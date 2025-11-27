#include "screen_video_capturer.h"
#include <chrono>
#include <cstring>
#include <mutex>
#include <thread>

ScreenVideoCapturer::ScreenVideoCapturer()
    : target_width_(1920),
      target_height_(1080),
      target_fps_(30),
      screen_width_(0),
      screen_height_(0) {}

ScreenVideoCapturer::~ScreenVideoCapturer() { StopCapture(); }

bool ScreenVideoCapturer::InitializeD3D() {
  HRESULT hr;

  // Create D3D11 device
  D3D_FEATURE_LEVEL level;
  hr = D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
                          D3D11_CREATE_DEVICE_BGRA_SUPPORT, nullptr, 0,
                          D3D11_SDK_VERSION, &device_, &level, &context_);
  if (FAILED(hr)) {
    last_error_ = "Failed to create D3D11 device";
    return false;
  }

  // Get DXGI device and adapter
  ComPtr<IDXGIDevice> dxgi_device;
  ComPtr<IDXGIAdapter> adapter;
  ComPtr<IDXGIOutput> output;

  hr = device_.As(&dxgi_device);
  if (FAILED(hr)) return false;

  hr = dxgi_device->GetAdapter(&adapter);
  if (FAILED(hr)) return false;

  hr = adapter->EnumOutputs(0, &output);
  if (FAILED(hr)) {
    last_error_ = "No display output found";
    return false;
  }

  // Get screen dimensions
  DXGI_OUTPUT_DESC output_desc;
  output->GetDesc(&output_desc);
  screen_width_ = output_desc.DesktopCoordinates.right -
                  output_desc.DesktopCoordinates.left;
  screen_height_ = output_desc.DesktopCoordinates.bottom -
                   output_desc.DesktopCoordinates.top;

  // Create output duplication
  ComPtr<IDXGIOutput1> output1;
  hr = output.As(&output1);
  if (FAILED(hr)) return false;

  hr = output1->DuplicateOutput(device_.Get(), &duplication_);
  if (FAILED(hr)) {
    last_error_ = "Failed to duplicate output";
    return false;
  }

  // Create staging texture for CPU read
  D3D11_TEXTURE2D_DESC staging_desc = {};
  staging_desc.Width = screen_width_;
  staging_desc.Height = screen_height_;
  staging_desc.MipLevels = 1;
  staging_desc.ArraySize = 1;
  staging_desc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
  staging_desc.SampleDesc.Count = 1;
  staging_desc.Usage = D3D11_USAGE_STAGING;
  staging_desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;

  hr = device_->CreateTexture2D(&staging_desc, nullptr, &staging_texture_);
  if (FAILED(hr)) {
    last_error_ = "Failed to create staging texture";
    return false;
  }

  return true;
}

bool ScreenVideoCapturer::StartCapture(int target_width, int target_height, int target_fps) {
  if (is_capturing_.load()) return true;

  target_width_ = target_width;
  target_height_ = target_height;
  target_fps_ = target_fps;

  if (!InitializeD3D()) return false;

  is_capturing_ = true;
  capture_thread_ =
      std::thread([this]() { this->CaptureLoop(); });

  return true;
}

void ScreenVideoCapturer::StopCapture() {
  is_capturing_ = false;
  if (capture_thread_.joinable()) {
    capture_thread_.join();
  }

  duplication_.Reset();
  staging_texture_.Reset();
  context_.Reset();
  device_.Reset();

  {
    std::lock_guard<std::mutex> lock(queue_mutex_);
    while (!frame_queue_.empty()) frame_queue_.pop();
  }
}

void ScreenVideoCapturer::CaptureLoop() {
  auto frame_interval_ms = 1000 / target_fps_;

  while (is_capturing_.load()) {
    auto start_time = std::chrono::high_resolution_clock::now();

    if (!CaptureAndQueueFrame()) {
      // On error, reinitialize
      std::this_thread::sleep_for(std::chrono::milliseconds(33));
    }

    auto elapsed_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::high_resolution_clock::now() - start_time)
        .count();
    auto sleep_time = frame_interval_ms - elapsed_ms;
    if (sleep_time > 0) {
      std::this_thread::sleep_for(
          std::chrono::milliseconds(sleep_time));
    }
  }
}

bool ScreenVideoCapturer::CaptureAndQueueFrame() {
  if (!duplication_) return false;

  DXGI_OUTDUPL_FRAME_INFO frame_info;
  ComPtr<IDXGIResource> frame_resource;

  HRESULT hr = duplication_->AcquireNextFrame(0, &frame_info, &frame_resource);

  if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
    return true;  // No frame available, keep trying
  }

  if (FAILED(hr)) {
    if (hr == DXGI_ERROR_ACCESS_LOST) {
      // Reinitialize on access lost
      duplication_.Reset();
      staging_texture_.Reset();
      InitializeD3D();
    }
    return false;
  }

  // Get the texture
  ComPtr<ID3D11Texture2D> frame_texture;
  hr = frame_resource.As(&frame_texture);

  if (SUCCEEDED(hr)) {
    // Copy to staging texture
    context_->CopyResource(staging_texture_.Get(), frame_texture.Get());

    // Map and read pixels
    D3D11_MAPPED_SUBRESOURCE mapped;
    hr = context_->Map(staging_texture_.Get(), 0, D3D11_MAP_READ, 0, &mapped);

    if (SUCCEEDED(hr)) {
      // Copy pixel data (BGRA format)
      auto frame = std::make_shared<VideoFrame>();
      frame->width = screen_width_;
      frame->height = screen_height_;
      frame->timestamp_ms =
          std::chrono::duration_cast<std::chrono::milliseconds>(
              std::chrono::high_resolution_clock::now()
                  .time_since_epoch())
              .count();

      size_t data_size = screen_width_ * screen_height_ * 4;
      frame->data.resize(data_size);

      uint8_t* src = static_cast<uint8_t*>(mapped.pData);
      for (int y = 0; y < screen_height_; y++) {
        std::memcpy(&frame->data[y * screen_width_ * 4],
                    &src[y * mapped.RowPitch], screen_width_ * 4);
      }

      context_->Unmap(staging_texture_.Get(), 0);

      // Queue the frame (keep max 5 in queue)
      {
        std::lock_guard<std::mutex> lock(queue_mutex_);
        if (frame_queue_.size() >= 5) {
          frame_queue_.pop();  // Drop oldest if queue is full
        }
        frame_queue_.push(frame);
      }
    }
  }

  duplication_->ReleaseFrame();
  return true;
}

std::shared_ptr<VideoFrame> ScreenVideoCapturer::GetNextFrame() {
  std::lock_guard<std::mutex> lock(queue_mutex_);
  if (frame_queue_.empty()) {
    return nullptr;
  }

  auto frame = frame_queue_.front();
  frame_queue_.pop();
  return frame;
}

void ScreenVideoCapturer::GetDimensions(int& width, int& height) const {
  width = screen_width_;
  height = screen_height_;
}

bool ScreenVideoCapturer::ResizeFrame(const std::vector<uint8_t>& src_data,
                                       int src_width, int src_height,
                                       std::vector<uint8_t>& dst_data,
                                       int dst_width, int dst_height) {
  // Simple nearest-neighbor resize (can be improved with bilinear)
  dst_data.resize(dst_width * dst_height * 4);

  float scale_x = static_cast<float>(src_width) / dst_width;
  float scale_y = static_cast<float>(src_height) / dst_height;

  for (int y = 0; y < dst_height; y++) {
    for (int x = 0; x < dst_width; x++) {
      int src_x = static_cast<int>(x * scale_x);
      int src_y = static_cast<int>(y * scale_y);

      // Clamp to source bounds
      src_x = (src_x < src_width) ? src_x : src_width - 1;
      src_y = (src_y < src_height) ? src_y : src_height - 1;

      int src_idx = (src_y * src_width + src_x) * 4;
      int dst_idx = (y * dst_width + x) * 4;

      std::memcpy(&dst_data[dst_idx], &src_data[src_idx], 4);
    }
  }

  return true;
}
