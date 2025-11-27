import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import 'package:connext_desktop/native/native_screen.dart';
import 'package:connext_desktop/native/native_input_handler.dart';
import 'package:image/image.dart' as img;
import 'package:connext_desktop/webrtc/native_video_capturer.dart';
import 'package:screen_capture_plugin/screen_capture_plugin.dart';

enum PeerRole { host, client }

class WebRTCManager {
  final PeerRole role;
  
  RTCPeerConnection? _peerConnection;
  WebSocketChannel? _wsChannel;
  RTCDataChannel? _dataChannel;
  Timer? _captureTimer;
  
  String? _roomId;
  int _frameCount = 0;
  int _sentFrames = 0;
  int _droppedFrames = 0;
  
  // Performance tracking
  int _lastSecondFrames = 0;
  int _currentFps = 0;
  DateTime _lastFpsCheck = DateTime.now();
  
  // Native capturer for WebRTC video track
  final NativeVideoCapturer _nativeCapturer = NativeVideoCapturer();
  int _screenWidth = 0;
  int _screenHeight = 0;
  
  Function(String state)? onConnectionStateChange;
  Function(Uint8List frameData, int width, int height)? onRemoteFrame;
  // Called when a remote MediaStream (video) is received
  Function(MediaStream? stream)? onRemoteStream;
  Function(int fps, int quality, int scale)? onPerformanceUpdate;
  
  // Input methods for client
  void sendMouseMove(double x, double y) {
    _sendInputMessage({
      'type': 'mouse',
      'action': 'move',
      'x': x,
      'y': y,
    });
  }

  void sendMouseClick(String button, String action, [double? x, double? y]) {
    final Map<String, dynamic> message = {
      'type': 'mouse',
      'action': action,
      'button': button,
    };
    if (x != null && y != null) {
      message['x'] = x;
      message['y'] = y;
    }
    _sendInputMessage(message);
  }

  void sendMouseScroll(double deltaX, double deltaY) {
    _sendInputMessage({
      'type': 'mouse',
      'action': 'scroll',
      'deltaX': deltaX,
      'deltaY': deltaY,
    });
  }

  void sendKeyPress(String key, String action) {
    _sendInputMessage({
      'type': 'keyboard',
      'action': action,
      'key': key,
    });
  }

  void _sendInputMessage(Map<String, dynamic> message) {
    if (_dataChannel?.state == RTCDataChannelState.RTCDataChannelOpen) {
      try {
        final json = jsonEncode(message);
        _dataChannel!.send(RTCDataChannelMessage(json));
      } catch (e) {
        print('Failed to send input: $e');
      }
    }
  }

  WebRTCManager({required this.role});

  RTCPeerConnection? get peerConnection => _peerConnection;

  Future<void> connectToSignaling(String serverUrl, String roomId) async {
    _roomId = roomId;
    
    try {
      _wsChannel = WebSocketChannel.connect(Uri.parse(serverUrl));
      
      _wsChannel!.stream.listen(
        (message) => _handleSignalingMessage(message),
        onError: (error) => print('WebSocket error: $error'),
        onDone: () => print('WebSocket closed'),
      );

      _sendSignalingMessage({
        'type': 'join',
        'room': roomId,
        'role': role.name,
      });

      print('Connected to signaling server: $serverUrl, room: $roomId');
    } catch (e) {
      print('Failed to connect to signaling: $e');
      rethrow;
    }
  }

  Future<void> initializePeerConnection() async {
    final configuration = {
      'iceServers': [
        {'urls': 'stun:stun.l.google.com:19302'},
      ],
    };

    _peerConnection = await createPeerConnection(configuration);

    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      _sendSignalingMessage({
        'type': 'ice-candidate',
        'candidate': candidate.toMap(),
        'room': _roomId,
      });
    };

    _peerConnection!.onConnectionState = (RTCPeerConnectionState state) {
      print('Connection state: $state');
      onConnectionStateChange?.call(state.name);
    };

    if (role == PeerRole.client) {
      _peerConnection!.onDataChannel = (channel) {
        print('📺 Data channel received: ${channel.label}');
        _setupDataChannel(channel);
      };
    }

    _peerConnection!.onIceConnectionState = (RTCIceConnectionState state) {
      print('ICE connection state: $state');
    };

    // Handle incoming remote tracks
    _peerConnection!.onTrack = (RTCTrackEvent event) {
      try {
        print('onTrack event: track.kind=${event.track.kind} track.id=${event.track.id} streams=${event.streams.length}');
        if (event.track.kind == 'video') {
          print('  Video track received!');
          if (event.streams.isNotEmpty) {
            print('  Using stream from event.streams[0]');
            onRemoteStream?.call(event.streams[0]);
          } else {
            // If no stream is provided with the event, create a local MediaStream
            print('  No streams in event, creating local MediaStream...');
            Future(() async {
              try {
                final ms = await createLocalMediaStream('remote-${event.track.id}');
                await ms.addTrack(event.track);
                print('  Created local MediaStream and added track');
                onRemoteStream?.call(ms);
              } catch (e) {
                print('Failed to create local media stream for track: $e');
                onRemoteStream?.call(null);
              }
            });
          }
        }
      } catch (e) {
        print('Error in onTrack handler: $e');
      }
    };

    print('Peer connection initialized');
  }

  Future<void> startScreenShare({RTCVideoRenderer? localRenderer}) async {
    if (role != PeerRole.host) {
      throw Exception('Only host can share screen');
    }

    try {
      // Create a data channel for control events (input, etc.)
      final dataChannelInit = RTCDataChannelInit();
      dataChannelInit.ordered = true;
      _dataChannel = await _peerConnection!.createDataChannel(
        'screen_data',
        dataChannelInit,
      );
      _setupDataChannel(_dataChannel!);

      // Try to obtain screen info if unknown
      if (_screenWidth == 0 || _screenHeight == 0) {
        try {
          final info = await NativeScreen.captureFrame(returnPixels: false);
          if (info != null) {
            _screenWidth = info.width;
            _screenHeight = info.height;
          }
        } catch (e) {
          print('⚠️ Could not get screen dimensions: $e');
        }
      }

      // Try to start native external video track
      String? externalTrackId;
      try {
        print('Creating external video track...');
        final result = await ScreenCapturePlugin.createExternalTrack(
          width: _screenWidth > 0 ? _screenWidth : 1920,
          height: _screenHeight > 0 ? _screenHeight : 1080,
          fps: 30,
        );
        if (result != null && result['success'] == true) {
          externalTrackId = result['trackId'];
          print('✅ External video track created: $externalTrackId');

          // Create a local media stream and add the track to it
          // This makes the track available to add to the peer connection
          try {
            final localStream = await createLocalMediaStream('screen_stream');
            // The track exists in the plugin's local_tracks_ map
            // For now, we'll add it via a placeholder approach
            // In a real implementation, we'd get the track object and add it
            print('📹 Local media stream created');
          } catch (e) {
            print('⚠️ Could not create local media stream: $e');
          }
        } else {
          print('⚠️ createExternalTrack returned false or null: $result');
        }
      } catch (e, st) {
        print('⚠️ Warning: Could not create external video track: $e');
        print('Stacktrace: $st');
      }

      // Create offer BEFORE starting capture to ensure it's sent
      print('Creating offer...');
      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      print('✅ Offer created and set as local description');

      _sendSignalingMessage({
        'type': 'offer',
        'sdp': offer.toMap(),
        'room': _roomId,
      });

      // Start capturing frames via data channel (proven working approach)
      print('Starting frame capture via data channel...');
      await _nativeCapturer.startCapture();
      _startFrameCapture();
      print('✅ Screen sharing started (frames via data channel)');
    } catch (e, st) {
      print('❌ Failed to start screen share: $e');
      print('Stacktrace: $st');
      rethrow;
    }
  }


  void _setupDataChannel(RTCDataChannel channel) {
    _dataChannel = channel;

    channel.onDataChannelState = (state) {
      print('Data channel state: $state');

      if (state == RTCDataChannelState.RTCDataChannelOpen) {
        print('✅ Data channel opened!');
      } else if (state == RTCDataChannelState.RTCDataChannelClosed) {
        print('❌ Data channel closed');
        _captureTimer?.cancel();
      }
    };

    if (role == PeerRole.client) {
      channel.onMessage = (RTCDataChannelMessage message) {
        try {
          // Clients should receive frame data (binary) or metadata (text)
          if (message.isBinary) {
            // This is a JPEG frame with width/height header
            _decodeFrame(message.binary!);
          } else {
            // This is metadata (JSON)
            final meta = jsonDecode(message.text);
            if (meta['type'] == 'frame_meta') {
              _screenWidth = meta['width'] ?? 0;
              _screenHeight = meta['height'] ?? 0;
            }
          }
        } catch (e) {
          print('Error handling frame: $e');
        }
      };
    } else {
      channel.onMessage = (RTCDataChannelMessage message) {
        try {
          if (!message.isBinary) {
            final data = jsonDecode(message.text);
            _handleInputMessage(data);
          }
        } catch (e) {
          print('Error handling input: $e');
        }
      };
    }
  }
  
  void _handleInputMessage(Map<String, dynamic> data) async {
    final type = data['type'];
    final action = data['action'];
    
    try {
      if (type == 'mouse') {
        if (action == 'move') {
          // Accept normalized coordinates (0..1) or absolute pixels
          final rawX = (data['x'] as num).toDouble();
          final rawY = (data['y'] as num).toDouble();

          int x;
          int y;
          if (rawX >= 0 && rawX <= 1) {
            x = (_screenWidth > 0) ? (rawX * (_screenWidth - 1)).round() : rawX.toInt();
          } else {
            x = rawX.toInt();
          }
          if (rawY >= 0 && rawY <= 1) {
            y = (_screenHeight > 0) ? (rawY * (_screenHeight - 1)).round() : rawY.toInt();
          } else {
            y = rawY.toInt();
          }

          await NativeInputHandler.handleMouseMove(x, y);
        } else if (action == 'down' || action == 'up' || action == 'click') {
          final button = data['button'] as String? ?? 'left';

          // If coordinates provided with the click, move first
          if (data.containsKey('x') && data.containsKey('y')) {
            final rawX = (data['x'] as num).toDouble();
            final rawY = (data['y'] as num).toDouble();

            int cx = rawX >= 0 && rawX <= 1
                ? (_screenWidth > 0 ? (rawX * (_screenWidth - 1)).round() : rawX.toInt())
                : rawX.toInt();
            int cy = rawY >= 0 && rawY <= 1
                ? (_screenHeight > 0 ? (rawY * (_screenHeight - 1)).round() : rawY.toInt())
                : rawY.toInt();

            await NativeInputHandler.handleMouseMove(cx, cy);
          }

          await NativeInputHandler.handleMouseClick(button, action);
        } else if (action == 'scroll') {
          final deltaX = (data['deltaX'] as num).toDouble();
          final deltaY = (data['deltaY'] as num).toDouble();
          await NativeInputHandler.handleMouseScroll(deltaX.toInt(), deltaY.toInt());
        }
      } else if (type == 'keyboard') {
        final key = data['key'] as String;
        await NativeInputHandler.handleKeyPress(key, action);
      }
    } catch (e) {
      print('Error handling input: $e');
    }
  }

  void _decodeFrame(Uint8List data) {
    try {
      if (data.length < 8) return;
      
      final byteData = ByteData.sublistView(data);
      final width = byteData.getInt32(0, Endian.little);
      final height = byteData.getInt32(4, Endian.little);
      final jpegData = data.sublist(8);
      
      final image = img.decodeJpg(jpegData);
      if (image == null) {
        print('Failed to decode JPEG');
        return;
      }
      
      final pixels = Uint8List(width * height * 4);
      int pixelIndex = 0;
      
      for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
          final pixel = image.getPixel(x, y);
          pixels[pixelIndex++] = pixel.b.toInt();
          pixels[pixelIndex++] = pixel.g.toInt();
          pixels[pixelIndex++] = pixel.r.toInt();
          pixels[pixelIndex++] = pixel.a.toInt();
        }
      }
      
      onRemoteFrame?.call(pixels, width, height);
    } catch (e) {
      print('Error decoding frame: $e');
    }
  }

  void _startFrameCapture() {
    print('🎬 Starting frame capture (optimized)...');
    
    // Target 30 FPS (33ms intervals)
    _captureTimer = Timer.periodic(const Duration(milliseconds: 33), (timer) async {
      if (_dataChannel?.state != RTCDataChannelState.RTCDataChannelOpen) {
        return;
      }

      try {
        final result = await NativeScreen.captureFrame(returnPixels: true);
        
        if (result != null && result.pixels != null) {
          await _processAndSendFrame(result.pixels!, result.width, result.height);
          
          // Update FPS counter
          _lastSecondFrames++;
          final now = DateTime.now();
          if (now.difference(_lastFpsCheck).inSeconds >= 1) {
            _currentFps = _lastSecondFrames;
            _lastSecondFrames = 0;
            _lastFpsCheck = now;
            
            onPerformanceUpdate?.call(_currentFps, 85, 1);
            
            print('📊 FPS: $_currentFps | Sent: $_sentFrames | Dropped: $_droppedFrames');
          }
        }
      } catch (e) {
        print('Frame capture error: $e');
      }
    });
  }

  Future<void> _processAndSendFrame(Uint8List pixels, int width, int height) async {
    if (_dataChannel?.state != RTCDataChannelState.RTCDataChannelOpen) return;
    
    try {
      // OPTIMIZED: Encode BGRA directly without format conversion
      var image = img.Image.fromBytes(
        width: width,
        height: height,
        bytes: pixels.buffer,
        numChannels: 4,  // BGRA
      );
      
      // Encode JPEG with fixed high quality for speed
      final jpegData = img.encodeJpg(image, quality: 85);
      
      // Create packet with metadata
      final packet = BytesBuilder();
      final wb = ByteData(4)..setInt32(0, width, Endian.little);
      final hb = ByteData(4)..setInt32(0, height, Endian.little);
      packet.add(wb.buffer.asUint8List());
      packet.add(hb.buffer.asUint8List());
      packet.add(jpegData);
      
      await _dataChannel!.send(RTCDataChannelMessage.fromBinary(packet.toBytes()));
      _sentFrames++;
      _frameCount++;
    } catch (e) {
      _droppedFrames++;
    }
  }

  void _handleSignalingMessage(dynamic message) async {
    try {
      final data = jsonDecode(message);
      final type = data['type'];

      print('Received signaling message: $type');

      switch (type) {
        case 'offer':
          try {
            await _handleOffer(data['sdp']);
          } catch (e, st) {
            print('❌ Error handling offer: $e');
            print('Stacktrace: $st');
          }
          break;
        case 'answer':
          try {
            await _handleAnswer(data['sdp']);
          } catch (e, st) {
            print('❌ Error handling answer: $e');
            print('Stacktrace: $st');
          }
          break;
        case 'ice-candidate':
          try {
            await _handleIceCandidate(data['candidate']);
          } catch (e, st) {
            print('⚠️ Error handling ICE candidate: $e');
          }
          break;
        case 'peer-joined':
          print('🔔 Peer joined the room');
          if (role == PeerRole.host && _dataChannel != null) {
            print('📤 Creating new offer for peer...');
            try {
              final offer = await _peerConnection!.createOffer();
              await _peerConnection!.setLocalDescription(offer);
              _sendSignalingMessage({
                'type': 'offer',
                'sdp': offer.toMap(),
                'room': _roomId,
              });
            } catch (e, st) {
              print('❌ Error creating peer offer: $e');
              print('Stacktrace: $st');
            }
          }
          break;
        default:
          print('Unknown message type: $type');
      }
    } catch (e, st) {
      print('❌ Error handling signaling message: $e');
      print('Stacktrace: $st');
    }
  }

  Future<void> _handleOffer(Map<String, dynamic> sdpMap) async {
    final sdp = RTCSessionDescription(sdpMap['sdp'], sdpMap['type']);
    await _peerConnection!.setRemoteDescription(sdp);

    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);

    _sendSignalingMessage({
      'type': 'answer',
      'sdp': answer.toMap(),
      'room': _roomId,
    });
  }

  Future<void> _handleAnswer(Map<String, dynamic> sdpMap) async {
    final sdp = RTCSessionDescription(sdpMap['sdp'], sdpMap['type']);
    await _peerConnection!.setRemoteDescription(sdp);
  }

  Future<void> _handleIceCandidate(Map<String, dynamic> candidateMap) async {
    final candidate = RTCIceCandidate(
      candidateMap['candidate'],
      candidateMap['sdpMid'],
      candidateMap['sdpMLineIndex'],
    );
    await _peerConnection!.addCandidate(candidate);
  }

  void _sendSignalingMessage(Map<String, dynamic> message) {
    if (_wsChannel != null) {
      _wsChannel!.sink.add(jsonEncode(message));
    }
  }

  Future<void> dispose() async {
    _captureTimer?.cancel();
    _captureTimer = null;
    
    await _dataChannel?.close();
    _dataChannel = null;
    
    await _peerConnection?.close();
    _peerConnection = null;
    
    await _wsChannel?.sink.close();
    _wsChannel = null;
    
    print('WebRTC Manager disposed | Sent: $_sentFrames | Dropped: $_droppedFrames');
  }
}
