import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:connext_desktop/native/native_screen.dart';

class ScreenShareManager {
  MediaStream? _localStream;
  RTCPeerConnection? _peerConnection;
  Timer? _captureTimer;
  Timer? _fpsTimer;
  bool _isSharing = false;
  
  int _frameCount = 0;
  int _fps = 0;
  
  // Callbacks
  Function(ui.Image image)? onFrameCaptured;
  Function(int fps)? onFpsUpdate;

  Future<bool> startSharing() async {
    if (_isSharing) return true;

    try {
      _isSharing = true;
      _frameCount = 0;
      _fps = 0;

      // Start FPS counter
      int tempFps = 0;
      _fpsTimer = Timer.periodic(const Duration(seconds: 1), (t) {
        if (!_isSharing) {
          t.cancel();
          return;
        }
        _fps = tempFps;
        tempFps = 0;
        onFpsUpdate?.call(_fps);
      });

      // Start capture loop
      _captureTimer = Timer.periodic(const Duration(milliseconds: 33), (t) async {
        if (!_isSharing) {
          t.cancel();
          return;
        }

        final shouldGetPixels = _frameCount % 2 == 0; // Every other frame
        final result = await NativeScreen.captureFrame(returnPixels: shouldGetPixels);

        if (result != null && result.success && result.frameChanged) {
          _frameCount++;
          tempFps++;

          if (shouldGetPixels && result.pixels != null) {
            final image = await _createImageFromPixels(
              result.pixels!,
              result.width,
              result.height,
            );

            if (image != null) {
              onFrameCaptured?.call(image);
            }
          }
        }
      });

      return true;
    } catch (e) {
      print('Error starting screen share: $e');
      return false;
    }
  }

  Future<void> stopSharing() async {
    _isSharing = false;
    _captureTimer?.cancel();
    _captureTimer = null;
    _fpsTimer?.cancel();
    _fpsTimer = null;

    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) => track.stop());
      _localStream!.dispose();
      _localStream = null;
    }

    if (_peerConnection != null) {
      await _peerConnection!.close();
      _peerConnection = null;
    }

    print('Screen sharing stopped. Total frames: $_frameCount');
  }

  Future<ui.Image?> _createImageFromPixels(
    Uint8List bgra,
    int width,
    int height,
  ) async {
    try {
      // Convert BGRA to RGBA
      final rgba = Uint8List(bgra.length);
      for (int i = 0; i < bgra.length; i += 4) {
        rgba[i] = bgra[i + 2];     // R
        rgba[i + 1] = bgra[i + 1]; // G
        rgba[i + 2] = bgra[i];     // B
        rgba[i + 3] = bgra[i + 3]; // A
      }

      final completer = Completer<ui.Image>();
      ui.decodeImageFromPixels(
        rgba,
        width,
        height,
        ui.PixelFormat.rgba8888,
        (ui.Image image) {
          completer.complete(image);
        },
      );
      return await completer.future;
    } catch (e) {
      print('Error creating image: $e');
      return null;
    }
  }

  bool get isSharing => _isSharing;
  int get fps => _fps;
  int get frameCount => _frameCount;
}