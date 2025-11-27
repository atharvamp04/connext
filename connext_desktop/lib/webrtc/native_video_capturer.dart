import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:screen_capture_plugin/screen_capture_plugin.dart';

class NativeVideoCapturer {
  MediaStream? _localStream;
  RTCVideoRenderer? _renderer;
  Timer? _captureTimer;
  bool _isCapturing = false;
  
  // Stats
  int _frameCount = 0;
  int _droppedFrames = 0;
  
  // Native capture settings
  int _captureWidth = 1920;
  int _captureHeight = 1080;
  int _captureFps = 30;

  Future<MediaStream?> startCapture({
    RTCVideoRenderer? renderer,
    int width = 1920,
    int height = 1080,
    int fps = 30,
  }) async {
    if (_isCapturing) {
      print('Already capturing');
      return _localStream;
    }

    _captureWidth = width;
    _captureHeight = height;
    _captureFps = fps;

    try {
      print('Native capturer: Starting frame capture at ${width}x${height}@${fps}fps');
      
      _isCapturing = true;
      _frameCount = 0;
      _droppedFrames = 0;

      // Start an external-track pump that forwards native frames into the
      // flutter_webrtc plugin (prototype). This runs in Dart and polls
      // the native capturer, forwarding frames to the flutter_webrtc method
      // channel.
      final trackId = await ScreenCapturePlugin.startExternalTrackPump(
        width: width,
        height: height,
        fps: fps,
      );
      if (trackId != null) {
        print('External track pump started: $trackId');
      } else {
        // Fallback to legacy timer-based capture (data-channel path)
        _startFrameCapture();
      }

      print('Native video capturer started');
      return null;  // Return null to indicate no WebRTC video track (fallback to data channel)
      
    } catch (e, st) {
      print('Error starting native capture: $e');
      print(st);
      return null;
    }
  }

  void _startFrameCapture() {
    // Poll frames from native capturer at the target framerate using the working API
    final frameInterval = (1000 / _captureFps).toInt();
    _captureTimer = Timer.periodic(Duration(milliseconds: frameInterval), (_) async {
      if (!_isCapturing) return;
      
      // Use the working captureFrame() API instead of the experimental video capturer
      final result = await ScreenCapturePlugin.captureFrame(returnPixels: true);
      if (result != null && result.success && result.pixels != null) {
        _frameCount++;
        // TODO: Send frame data over data channel to client
        // This is where we would encode and send the frame
        if (_frameCount % 30 == 0) {
          print('Captured frame $_frameCount: ${result.width}x${result.height}');
        }
      } else {
        _droppedFrames++;
      }
    });
  }

  Future<void> stopCapture() async {
    _captureTimer?.cancel();
    _isCapturing = false;

    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) {
        track.stop();
      });
      _localStream!.dispose();
      _localStream = null;
    }

    // Stop external track pump if running
    try {
      await ScreenCapturePlugin.stopExternalTrackPump();
    } catch (_) {}

    print('Capture stopped. Frames: $_frameCount, Dropped: $_droppedFrames');
  }

  MediaStream? get stream => _localStream;
  bool get isCapturing => _isCapturing;
  
  Map<String, int> getStats() {
    return {
      'frameCount': _frameCount,
      'droppedFrames': _droppedFrames,
    };
  }
}