import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:connext_desktop/native/native_screen.dart';

class WebRTCScreenShareManager {
  // WebRTC
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  RTCDataChannel? _dataChannel;
  WebSocketChannel? _signaling;
  
  // Native capture
  Timer? _captureTimer;
  Timer? _fpsTimer;
  bool _isSharing = false;
  
  // Stats
  int _frameCount = 0;
  int _fps = 0;
  
  // Callbacks
  Function(ui.Image image)? onFrameCaptured;
  Function(int fps)? onFpsUpdate;
  Function(String state)? onConnectionStateChanged;
  
  String? _signalingServer;

  /// Start sharing screen via WebRTC
  /// If signalingServer is null, only local preview (no streaming)
  Future<bool> startSharing({String? signalingServer}) async {
    if (_isSharing) return true;

    try {
      _isSharing = true;
      _frameCount = 0;
      _fps = 0;
      _signalingServer = signalingServer;

      // If we have a signaling server, set up WebRTC
      if (_signalingServer != null) {
        await _initializeWebRTC();
        await _connectSignaling();
      }

      // Start native screen capture
      await _startNativeCapture();

      return true;
    } catch (e) {
      print('Error starting screen share: $e');
      _isSharing = false;
      return false;
    }
  }

  Future<void> _initializeWebRTC() async {
    final configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ]
    };

    final constraints = {
      'mandatory': {},
      'optional': [
        {'DtlsSrtpKeyAgreement': true},
      ],
    };

    _peerConnection = await createPeerConnection(configuration, constraints);

    // Get display media (screen capture)
    final mediaConstraints = {
      'audio': false,
      'video': {
        'mandatory': {
          'minWidth': '1920',
          'minHeight': '1080',
          'minFrameRate': '30',
        }
      }
    };

    _localStream = await navigator.mediaDevices.getDisplayMedia(mediaConstraints);

    // Add tracks to peer connection
    _localStream!.getTracks().forEach((track) {
      _peerConnection!.addTrack(track, _localStream!);
    });

    // Create data channel for input control
    _dataChannel = await _peerConnection!.createDataChannel(
      'input',
      RTCDataChannelInit(),
    );

    _dataChannel!.onMessage = (RTCDataChannelMessage message) {
      _handleInputMessage(message.text);
    };

    // Set up connection state callbacks
    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      print('Connection state: $state');
      onConnectionStateChanged?.call(state.toString());
    };

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      _sendSignalingMessage({
        'type': 'ice_candidate',
        'candidate': jsonEncode(candidate.toMap()),
      });
    };
  }

  Future<void> _connectSignaling() async {
    try {
      _signaling = WebSocketChannel.connect(
        Uri.parse('ws://$_signalingServer/ws'),
      );

      _signaling!.stream.listen(
        (message) {
          _handleSignalingMessage(jsonDecode(message));
        },
        onError: (error) {
          print('Signaling error: $error');
        },
        onDone: () {
          print('Signaling connection closed');
        },
      );

      // Wait a bit for connection to establish
      await Future.delayed(const Duration(milliseconds: 500));

      // Create and send offer
      await _createOffer();
    } catch (e) {
      print('Failed to connect to signaling server: $e');
      throw e;
    }
  }

  Future<void> _createOffer() async {
    final offer = await _peerConnection!.createOffer();
    await _peerConnection!.setLocalDescription(offer);

    _sendSignalingMessage({
      'type': 'offer',
      'offer': jsonEncode(offer.toMap()),
    });
  }

  void _handleSignalingMessage(Map<String, dynamic> message) async {
    final type = message['type'];

    switch (type) {
      case 'answer':
        await _handleAnswer(message['answer']);
        break;
      case 'ice_candidate':
        await _handleIceCandidate(message['candidate']);
        break;
    }
  }

  Future<void> _handleAnswer(String answerJson) async {
    final answerMap = jsonDecode(answerJson);
    final answer = RTCSessionDescription(
      answerMap['sdp'],
      answerMap['type'],
    );
    await _peerConnection!.setRemoteDescription(answer);
  }

  Future<void> _handleIceCandidate(String candidateJson) async {
    final candidateMap = jsonDecode(candidateJson);
    final candidate = RTCIceCandidate(
      candidateMap['candidate'],
      candidateMap['sdpMid'],
      candidateMap['sdpMLineIndex'],
    );
    await _peerConnection!.addCandidate(candidate);
  }

  void _sendSignalingMessage(Map<String, dynamic> message) {
    if (_signaling != null) {
      _signaling!.sink.add(jsonEncode(message));
    }
  }

  void _handleInputMessage(String message) {
    // Handle remote input control messages
    // This is for when someone is controlling THIS machine
    try {
      final data = jsonDecode(message);
      final type = data['type'];
      
      // TODO: Implement input injection
      print('Received input: $type');
    } catch (e) {
      print('Error handling input message: $e');
    }
  }

  Future<void> _startNativeCapture() async {
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

    // Start capture loop for preview
    _captureTimer = Timer.periodic(const Duration(milliseconds: 33), (t) async {
      if (!_isSharing) {
        t.cancel();
        return;
      }

      final shouldGetPixels = _frameCount % 2 == 0; // Every other frame for preview
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

  Future<void> stopSharing() async {
    _isSharing = false;
    _captureTimer?.cancel();
    _captureTimer = null;
    _fpsTimer?.cancel();
    _fpsTimer = null;

    _dataChannel?.close();
    _dataChannel = null;

    if (_localStream != null) {
      _localStream!.getTracks().forEach((track) => track.stop());
      _localStream!.dispose();
      _localStream = null;
    }

    if (_peerConnection != null) {
      await _peerConnection!.close();
      _peerConnection = null;
    }

    _signaling?.sink.close();
    _signaling = null;

    print('Screen sharing stopped. Total frames: $_frameCount');
  }

  bool get isSharing => _isSharing;
  int get fps => _fps;
  int get frameCount => _frameCount;
  MediaStream? get localStream => _localStream;
}