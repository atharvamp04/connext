#ifndef FLUTTER_PLUGIN_SCREEN_VIDEO_CAPTURER_H_
#define FLUTTER_PLUGIN_SCREEN_VIDEO_CAPTURER_H_

#include <windows.h>
#include <d3d11.h>
#include <dxgi1_2.h>
#include <wrl/client.h>
#include <memory>
#include <string>
#include <thread>
#include <atomic>
#include <queue>
#include <mutex>
#include <vector>

using Microsoft::WRL::ComPtr;

// Simple video frame
struct VideoFrame {
  std::vector<uint8_t> data;
  int width;
  int height;
  int64_t timestamp_ms;
};

class ScreenVideoCapturer {
 public:
  ScreenVideoCapturer();
  ~ScreenVideoCapturer();

  // Start capturing the screen
  bool StartCapture(int target_width = 1920, int target_height = 1080, int target_fps = 30);
  
  // Stop capturing
  void StopCapture();

  // Get next frame (non-blocking, returns nullptr if no frame available)
  std::shared_ptr<VideoFrame> GetNextFrame();

  // Check if currently capturing
  bool IsCapturing() const { return is_capturing_.load(); }

  // Get current dimensions
  void GetDimensions(int& width, int& height) const;

 private:
  bool InitializeD3D();
  void CaptureLoop();
  bool CaptureAndQueueFrame();
  bool ResizeFrame(const std::vector<uint8_t>& src_data, int src_width, int src_height,
                   std::vector<uint8_t>& dst_data, int dst_width, int dst_height);

  // D3D11 objects
  ComPtr<ID3D11Device> device_;
  ComPtr<ID3D11DeviceContext> context_;
  ComPtr<IDXGIOutputDuplication> duplication_;
  ComPtr<ID3D11Texture2D> staging_texture_;

  // Capture settings
  int target_width_;
  int target_height_;
  int target_fps_;
  int screen_width_;
  int screen_height_;

  // Thread control
  std::atomic<bool> is_capturing_{false};
  std::thread capture_thread_;

  // Frame queue (simple FIFO, max 5 frames)
  std::queue<std::shared_ptr<VideoFrame>> frame_queue_;
  mutable std::mutex queue_mutex_;

  std::string last_error_;
};

#endif  // FLUTTER_PLUGIN_SCREEN_VIDEO_CAPTURER_H_
