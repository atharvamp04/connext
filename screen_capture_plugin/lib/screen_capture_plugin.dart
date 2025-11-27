import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/services.dart';

class ScreenCaptureResult {
  final bool success;
  final bool frameChanged;
  final int width;
  final int height;
  final Uint8List? pixels;
  final String? error;

  ScreenCaptureResult({
    required this.success,
    required this.frameChanged,
    required this.width,
    required this.height,
    this.pixels,
    this.error,
  });

  factory ScreenCaptureResult.fromMap(Map<String, dynamic> map) {
    return ScreenCaptureResult(
      success: map['success'] == true,
      frameChanged: map['frame_changed'] == true,
      width: map['width'] ?? 0,
      height: map['height'] ?? 0,
      pixels: map['pixels'] != null ? Uint8List.fromList(List<int>.from(map['pixels'])) : null,
      error: map['error'],
    );
  }
}

class VideoFrame {
  final int width;
  final int height;
  final int timestamp;
  final Uint8List data;

  VideoFrame({
    required this.width,
    required this.height,
    required this.timestamp,
    required this.data,
  });

  factory VideoFrame.fromMap(Map<String, dynamic> map) {
    return VideoFrame(
      width: map['width'] ?? 0,
      height: map['height'] ?? 0,
      timestamp: map['timestamp'] ?? 0,
      data: map['data'] != null ? Uint8List.fromList(List<int>.from(map['data'])) : Uint8List(0),
    );
  }
}

class ScreenCapturePlugin {
  static const MethodChannel _channel = MethodChannel('screen_capture_plugin');
  static const MethodChannel _webrtcChannel = MethodChannel('FlutterWebRTC.Method');
  static Timer? _pumpTimer;
  static String? _externalTrackId;

  static Future<ScreenCaptureResult?> captureFrame({bool returnPixels = false}) async {
    try {
      final result = await _channel.invokeMethod('captureFrame', {
        'returnPixels': returnPixels,
      });
      
      if (result is Map) {
        return ScreenCaptureResult.fromMap(Map<String, dynamic>.from(result));
      }
      return null;
    } catch (e) {
      print('Error capturing frame: $e');
      return null;
    }
  }

  /// Start native video capture for WebRTC streaming
  static Future<bool> startNativeVideoCapture({
    int width = 1920,
    int height = 1080,
    int fps = 30,
  }) async {
    try {
      final result = await _channel.invokeMethod('startNativeVideoCapture', {
        'width': width,
        'height': height,
        'fps': fps,
      });
      
      if (result is Map) {
        return result['success'] == true;
      }
      return false;
    } catch (e) {
      print('Error starting native video capture: $e');
      return false;
    }
  }

  /// Stop native video capture
  static Future<void> stopNativeVideoCapture() async {
    try {
      await _channel.invokeMethod('stopNativeVideoCapture');
    } catch (e) {
      print('Error stopping native video capture: $e');
    }
  }

  /// Get next video frame from native capturer
  static Future<VideoFrame?> getNativeVideoFrame() async {
    try {
      final result = await _channel.invokeMethod('getNativeVideoFrame');
      
      if (result is Map) {
        final map = Map<String, dynamic>.from(result);
        if (map['success'] == true) {
          return VideoFrame.fromMap(map);
        }
      }
      return null;
    } catch (e) {
      print('Error getting native video frame: $e');
      return null;
    }
  }

  /// Get current screen dimensions
  static Future<({int width, int height})> getVideoDimensions() async {
    try {
      final result = await _channel.invokeMethod('getVideoDimensions');
      
      if (result is Map) {
        final map = Map<String, dynamic>.from(result);
        int width = 1920;
        int height = 1080;
        
        if (map['width'] != null) {
          width = (map['width'] as num).toInt();
        }
        if (map['height'] != null) {
          height = (map['height'] as num).toInt();
        }
        
        return (width: width, height: height);
      }
      return (width: 1920, height: 1080);
    } catch (e) {
      print('Error getting video dimensions: $e');
      return (width: 1920, height: 1080);
    }
  }

  /// Start pumping native frames into flutter_webrtc's external-track API.
  /// Returns the created external track id when successful, or null.
  static Future<String?> startExternalTrackPump({
    int width = 1920,
    int height = 1080,
    int fps = 30,
  }) async {
    try {
      // Create external track in flutter_webrtc plugin
      final createResult = await _webrtcChannel.invokeMethod('createExternalTrack', {
        'width': width,
        'height': height,
        'fps': fps,
      });

      if (createResult is Map && createResult['trackId'] != null) {
        final String trackId = createResult['trackId'];
        _externalTrackId = trackId;

        // Start pump timer
        final intervalMs = (1000 / fps).round();
        _pumpTimer = Timer.periodic(Duration(milliseconds: intervalMs), (t) async {
          try {
            final frame = await getNativeVideoFrame();
            if (frame != null && _externalTrackId != null) {
              final pushResult = await _webrtcChannel.invokeMethod('pushExternalFrame', {
                'trackId': _externalTrackId,
                'width': frame.width,
                'height': frame.height,
                'timestamp': frame.timestamp,
                'data': frame.data,
              });
              if (pushResult is Map) {
                // optional debug info
                // ignore
              }
            }
          } catch (e) {
            // ignore per-frame errors
          }
        });

        return trackId;
      }
    } catch (e) {
      print('Error creating external track: $e');
    }
    return null;
  }

  /// Stop the external-track pump and notify flutter_webrtc plugin.
  static Future<void> stopExternalTrackPump() async {
    try {
      _pumpTimer?.cancel();
      _pumpTimer = null;
      if (_externalTrackId != null) {
        await _webrtcChannel.invokeMethod('stopExternalTrack', {
          'trackId': _externalTrackId,
        });
        _externalTrackId = null;
      }
    } catch (e) {
      print('Error stopping external track pump: $e');
    }
  }

  /// Query stats for an external track (frames received, last frame size)
  static Future<Map<String, int>?> getExternalTrackStats(String trackId) async {
    try {
      final result = await _webrtcChannel.invokeMethod('getExternalTrackStats', {
        'trackId': trackId,
      });
      if (result is Map) {
        final map = Map<String, dynamic>.from(result);
        return {
          'frames': (map['frames'] ?? 0) as int,
          'lastSize': (map['lastSize'] ?? 0) as int,
        };
      }
    } catch (e) {
      print('Error getting external track stats: $e');
    }
    return null;
  }

  /// Create an external video track without starting the pump.
  /// Returns a map with 'trackId' and 'success' keys.
  static Future<Map<String, dynamic>?> createExternalTrack({
    int width = 1920,
    int height = 1080,
    int fps = 30,
  }) async {
    try {
      final result = await _webrtcChannel.invokeMethod('createExternalTrack', {
        'width': width,
        'height': height,
        'fps': fps,
      });

      if (result is Map) {
        return Map<String, dynamic>.from(result);
      }
    } catch (e) {
      print('Error creating external track: $e');
    }
    return null;
  }
}