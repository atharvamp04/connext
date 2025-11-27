#include "include/screen_capture_plugin/screen_capture_plugin.h"
#include "screen_video_capturer.h"

#include <flutter/plugin_registrar_windows.h>
#include <flutter/method_channel.h>
#include <flutter/standard_method_codec.h>

#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <wrl/client.h>
#include <vector>
#include <memory>

using flutter::EncodableValue;
using flutter::EncodableMap;
using flutter::EncodableList;
using Microsoft::WRL::ComPtr;

namespace {

class ScreenCapturePlugin : public flutter::Plugin {
 public:
  static void RegisterWithRegistrar(flutter::PluginRegistrarWindows* registrar);

  ScreenCapturePlugin() : video_capturer_(nullptr) {}
  virtual ~ScreenCapturePlugin() {
    if (duplication_) duplication_.Reset();
    if (staging_texture_) staging_texture_.Reset();
    if (context_) context_.Reset();
    if (device_) device_.Reset();
  }

 private:
  void HandleMethodCall(
      const flutter::MethodCall<EncodableValue>& method_call,
      std::unique_ptr<flutter::MethodResult<EncodableValue>> result);

  bool initialized_ = false;
  ComPtr<ID3D11Device> device_;
  ComPtr<ID3D11DeviceContext> context_;
  ComPtr<IDXGIOutputDuplication> duplication_;
  ComPtr<ID3D11Texture2D> staging_texture_;
  std::string last_error_;
  int screen_width_ = 0;
  int screen_height_ = 0;
  
  // Video capturer for WebRTC
  std::shared_ptr<ScreenVideoCapturer> video_capturer_;
  
  bool InitCapture();
  EncodableMap CaptureFrame(bool returnPixels);
};

bool ScreenCapturePlugin::InitCapture() {
  HRESULT hr;

  D3D_FEATURE_LEVEL level;
  hr = D3D11CreateDevice(
      nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
      D3D11_CREATE_DEVICE_BGRA_SUPPORT, nullptr, 0,
      D3D11_SDK_VERSION, &device_, &level, &context_);
  if (FAILED(hr)) {
    last_error_ = "Failed to create D3D11 device";
    return false;
  }

  ComPtr<IDXGIDevice> dxgiDevice;
  ComPtr<IDXGIAdapter> adapter;
  ComPtr<IDXGIOutput> output;

  hr = device_.As(&dxgiDevice);
  if (FAILED(hr)) return false;
  
  hr = dxgiDevice->GetAdapter(&adapter);
  if (FAILED(hr)) return false;
  
  hr = adapter->EnumOutputs(0, &output);
  if (FAILED(hr)) {
    last_error_ = "No display output found";
    return false;
  }

  DXGI_OUTPUT_DESC desc;
  output->GetDesc(&desc);
  screen_width_ = desc.DesktopCoordinates.right - desc.DesktopCoordinates.left;
  screen_height_ = desc.DesktopCoordinates.bottom - desc.DesktopCoordinates.top;

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

  initialized_ = true;
  last_error_.clear();
  return true;
}

EncodableMap ScreenCapturePlugin::CaptureFrame(bool returnPixels) {
  EncodableMap result;
  
  if (!initialized_) {
    if (!InitCapture()) {
      result[EncodableValue("success")] = EncodableValue(false);
      result[EncodableValue("error")] = EncodableValue(last_error_);
      return result;
    }
  }

  DXGI_OUTDUPL_FRAME_INFO info;
  ComPtr<IDXGIResource> resource;

  HRESULT hr = duplication_->AcquireNextFrame(0, &info, &resource);
  
  if (hr == DXGI_ERROR_WAIT_TIMEOUT) {
    result[EncodableValue("success")] = EncodableValue(true);
    result[EncodableValue("frame_changed")] = EncodableValue(false);
    result[EncodableValue("width")] = EncodableValue(screen_width_);
    result[EncodableValue("height")] = EncodableValue(screen_height_);
    return result;
  }
  
  if (FAILED(hr)) {
    if (hr == DXGI_ERROR_ACCESS_LOST) {
      initialized_ = false;
      duplication_.Reset();
      staging_texture_.Reset();
      last_error_ = "Access lost";
    } else {
      last_error_ = "Capture failed";
    }
    result[EncodableValue("success")] = EncodableValue(false);
    result[EncodableValue("error")] = EncodableValue(last_error_);
    return result;
  }

  result[EncodableValue("success")] = EncodableValue(true);
  result[EncodableValue("frame_changed")] = EncodableValue(true);
  result[EncodableValue("width")] = EncodableValue(screen_width_);
  result[EncodableValue("height")] = EncodableValue(screen_height_);

  if (returnPixels) {
    // Get the texture
    ComPtr<ID3D11Texture2D> texture;
    hr = resource.As(&texture);
    
    if (SUCCEEDED(hr)) {
      // Copy to staging texture
      context_->CopyResource(staging_texture_.Get(), texture.Get());

      // Map and read pixels
      D3D11_MAPPED_SUBRESOURCE mapped;
      hr = context_->Map(staging_texture_.Get(), 0, D3D11_MAP_READ, 0, &mapped);
      
      if (SUCCEEDED(hr)) {
        // Copy pixel data (BGRA format)
        size_t data_size = screen_width_ * screen_height_ * 4;
        std::vector<uint8_t> pixels(data_size);
        
        uint8_t* src = static_cast<uint8_t*>(mapped.pData);
        for (int y = 0; y < screen_height_; y++) {
          memcpy(&pixels[y * screen_width_ * 4], 
                 &src[y * mapped.RowPitch], 
                 screen_width_ * 4);
        }
        
        context_->Unmap(staging_texture_.Get(), 0);
        
        result[EncodableValue("pixels")] = EncodableValue(pixels);
      }
    }
  }

  duplication_->ReleaseFrame();
  return result;
}

void ScreenCapturePlugin::HandleMethodCall(
    const flutter::MethodCall<EncodableValue>& method_call,
    std::unique_ptr<flutter::MethodResult<EncodableValue>> result) {
  
  if (method_call.method_name() == "captureFrame") {
    // Check if we should return pixels
    bool returnPixels = false;
    
    if (method_call.arguments()) {
      try {
        auto& args = std::get<EncodableMap>(*method_call.arguments());
        auto it = args.find(EncodableValue("returnPixels"));
        if (it != args.end()) {
          try {
            returnPixels = std::get<bool>(it->second);
          } catch (...) {
            // If it's not a bool, just use false
          }
        }
      } catch (...) {
        // If arguments is not a map, just use default false
      }
    }
    
    auto frame_result = CaptureFrame(returnPixels);
    result->Success(EncodableValue(frame_result));
  } else if (method_call.method_name() == "startNativeVideoCapture") {
    // Start native video capture for WebRTC
    int target_width = 1920;
    int target_height = 1080;
    int target_fps = 30;
    
    if (method_call.arguments()) {
      try {
        auto& args = std::get<EncodableMap>(*method_call.arguments());
        
        auto width_it = args.find(EncodableValue("width"));
        if (width_it != args.end()) {
          try {
            target_width = std::get<int32_t>(width_it->second);
          } catch (...) {}
        }
        
        auto height_it = args.find(EncodableValue("height"));
        if (height_it != args.end()) {
          try {
            target_height = std::get<int32_t>(height_it->second);
          } catch (...) {}
        }
        
        auto fps_it = args.find(EncodableValue("fps"));
        if (fps_it != args.end()) {
          try {
            target_fps = std::get<int32_t>(fps_it->second);
          } catch (...) {}
        }
      } catch (...) {}
    }
    
    if (!video_capturer_) {
      video_capturer_ = std::make_shared<ScreenVideoCapturer>();
    }
    
    bool success = video_capturer_->StartCapture(target_width, target_height, target_fps);
    
    EncodableMap response;
    response[EncodableValue("success")] = EncodableValue(success);
    if (!success) {
      response[EncodableValue("error")] = EncodableValue("Failed to start video capture");
    }
    result->Success(EncodableValue(response));
  } else if (method_call.method_name() == "stopNativeVideoCapture") {
    // Stop native video capture
    if (video_capturer_) {
      video_capturer_->StopCapture();
    }
    
    EncodableMap response;
    response[EncodableValue("success")] = EncodableValue(true);
    result->Success(EncodableValue(response));
  } else if (method_call.method_name() == "getNativeVideoFrame") {
    // Get next frame from video capturer
    EncodableMap response;
    response[EncodableValue("success")] = EncodableValue(false);
    
    if (!video_capturer_) {
      response[EncodableValue("error")] = EncodableValue("Video capturer not initialized");
    } else {
      auto frame = video_capturer_->GetNextFrame();
      if (frame) {
        response[EncodableValue("success")] = EncodableValue(true);
        response[EncodableValue("width")] = EncodableValue(static_cast<int32_t>(frame->width));
        response[EncodableValue("height")] = EncodableValue(static_cast<int32_t>(frame->height));
        response[EncodableValue("timestamp")] = EncodableValue(static_cast<int64_t>(frame->timestamp_ms));
        response[EncodableValue("data")] = EncodableValue(frame->data);
      } else {
        response[EncodableValue("error")] = EncodableValue("No frame available");
      }
    }
    
    result->Success(EncodableValue(response));
  } else if (method_call.method_name() == "getVideoDimensions") {
    // Get screen dimensions
    if (!video_capturer_) {
      video_capturer_ = std::make_shared<ScreenVideoCapturer>();
      video_capturer_->StartCapture(1920, 1080, 30);
    }
    
    int width, height;
    video_capturer_->GetDimensions(width, height);
    
    EncodableMap response;
    response[EncodableValue("width")] = EncodableValue(static_cast<int32_t>(width));
    response[EncodableValue("height")] = EncodableValue(static_cast<int32_t>(height));
    result->Success(EncodableValue(response));
  } else {
    result->NotImplemented();
  }
}

void ScreenCapturePlugin::RegisterWithRegistrar(
    flutter::PluginRegistrarWindows* registrar) {
  auto channel = std::make_unique<flutter::MethodChannel<EncodableValue>>(
      registrar->messenger(), "screen_capture_plugin",
      &flutter::StandardMethodCodec::GetInstance());

  auto plugin = std::make_unique<ScreenCapturePlugin>();

  channel->SetMethodCallHandler(
      [plugin_pointer = plugin.get()](const auto& call, auto result) {
        plugin_pointer->HandleMethodCall(call, std::move(result));
      });

  registrar->AddPlugin(std::move(plugin));
}

}  // namespace

void ScreenCapturePluginRegisterWithRegistrar(
    FlutterDesktopPluginRegistrarRef registrar) {
  ScreenCapturePlugin::RegisterWithRegistrar(
      flutter::PluginRegistrarManager::GetInstance()
          ->GetRegistrar<flutter::PluginRegistrarWindows>(registrar));
}