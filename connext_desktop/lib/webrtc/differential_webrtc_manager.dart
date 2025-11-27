import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:convert';
import 'package:connext_desktop/native/native_screen.dart';
import 'package:connext_desktop/native/native_input_handler.dart';

enum PeerRole { host, client }

/// Ultra-low latency WebRTC manager using differential encoding
class DifferentialWebRTCManager {
  final PeerRole role;
  
  RTCPeerConnection? _peerConnection;
  WebSocketChannel? _wsChannel;
  RTCDataChannel? _dataChannel;
  Timer? _captureTimer;
  
  String? _roomId;
  int _frameCount = 0;
  int _sentFrames = 0;
  int _droppedFrames = 0;
  
  // Previous frame for differential encoding
  Uint8List? _previousFrame;
  int _previousWidth = 0;
  int _previousHeight = 0;
  
  // Performance tracking
  int _lastSecondFrames = 0;
  int _currentFps = 0;
  DateTime _lastFpsCheck = DateTime.now();
  
  // Adaptive settings
  int _blockSize = 64; // Size of blocks to check for changes
  double _changeThreshold = 0.05; // 5% change required to send block
  int _compressionLevel = 3; // 1-4 (higher = more compression, slower)
  
  Function(String state)? onConnectionStateChange;
  Function(Uint8List frameData, int width, int height)? onRemoteFrame;
  Function(int fps, double bandwidth, int blockSize)? onPerformanceUpdate;
  
  DifferentialWebRTCManager({required this.role});

  // Input methods (same as before)
  void sendMouseMove(double x, double y) {
    _sendInputMessage({'type': 'mouse', 'action': 'move', 'x': x, 'y': y});
  }

  void sendMouseClick(String button, String action) {
    _sendInputMessage({'type': 'mouse', 'action': action, 'button': button});
  }

  void sendMouseScroll(double deltaX, double deltaY) {
    _sendInputMessage({'type': 'mouse', 'action': 'scroll', 'deltaX': deltaX, 'deltaY': deltaY});
  }

  void sendKeyPress(String key, String action) {
    _sendInputMessage({'type': 'keyboard', 'action': action, 'key': key});
  }

  void _sendInputMessage(Map<String, dynamic> message) {
    if (_dataChannel?.state == RTCDataChannelState.RTCDataChannelOpen) {
      try {
        _dataChannel!.send(RTCDataChannelMessage(jsonEncode(message)));
      } catch (e) {
        print('Failed to send input: $e');
      }
    }
  }

  Future<void> connectToSignaling(String serverUrl, String roomId) async {
    _roomId = roomId;
    
    try {
      _wsChannel = WebSocketChannel.connect(Uri.parse(serverUrl));
      
      _wsChannel!.stream.listen(
        (message) => _handleSignalingMessage(message),
        onError: (error) => print('WebSocket error: $error'),
        onDone: () => print('WebSocket closed'),
      );

      _sendSignalingMessage({'type': 'join', 'room': roomId, 'role': role.name});
      print('Connected to signaling server');
    } catch (e) {
      print('Failed to connect to signaling: $e');
      rethrow;
    }
  }

  Future<void> initializePeerConnection() async {
    final configuration = {
      'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}],
    };

    _peerConnection = await createPeerConnection(configuration);

    _peerConnection!.onIceCandidate = (candidate) {
      _sendSignalingMessage({
        'type': 'ice-candidate',
        'candidate': candidate.toMap(),
        'room': _roomId,
      });
    };

    _peerConnection!.onConnectionState = (state) {
      onConnectionStateChange?.call(state.name);
    };

    if (role == PeerRole.client) {
      _peerConnection!.onDataChannel = (channel) {
        _setupDataChannel(channel);
      };
    }

    print('Peer connection initialized');
  }

  Future<void> startScreenShare() async {
    if (role != PeerRole.host) {
      throw Exception('Only host can share screen');
    }

    try {
      final dataChannelInit = RTCDataChannelInit();
      dataChannelInit.ordered = false;
      dataChannelInit.maxRetransmits = 0;
      
      _dataChannel = await _peerConnection!.createDataChannel(
        'screen_frames',
        dataChannelInit,
      );
      
      _setupDataChannel(_dataChannel!);

      final offer = await _peerConnection!.createOffer();
      await _peerConnection!.setLocalDescription(offer);

      _sendSignalingMessage({
        'type': 'offer',
        'sdp': offer.toMap(),
        'room': _roomId,
      });

      print('✅ Differential screen sharing started');
    } catch (e) {
      print('❌ Failed to start screen share: $e');
      rethrow;
    }
  }

  void _setupDataChannel(RTCDataChannel channel) {
    _dataChannel = channel;

    channel.onDataChannelState = (state) {
      if (state == RTCDataChannelState.RTCDataChannelOpen) {
        print('✅ Data channel opened!');
        if (role == PeerRole.host) {
          _startDifferentialCapture();
        }
      } else if (state == RTCDataChannelState.RTCDataChannelClosed) {
        _captureTimer?.cancel();
      }
    };

    if (role == PeerRole.client) {
      channel.onMessage = (message) {
        if (message.isBinary) {
          _decodeDifferentialFrame(message.binary);
        }
      };
    } else {
      channel.onMessage = (message) {
        if (!message.isBinary) {
          _handleInputMessage(jsonDecode(message.text));
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
          await NativeInputHandler.handleMouseMove(
            (data['x'] as num).toInt(),
            (data['y'] as num).toInt(),
          );
        } else if (action == 'down' || action == 'up' || action == 'click') {
          await NativeInputHandler.handleMouseClick(
            data['button'] ?? 'left',
            action,
          );
        } else if (action == 'scroll') {
          await NativeInputHandler.handleMouseScroll(
            (data['deltaX'] as num).toInt(),
            (data['deltaY'] as num).toInt(),
          );
        }
      } else if (type == 'keyboard') {
        await NativeInputHandler.handleKeyPress(data['key'], action);
      }
    } catch (e) {
      print('Error handling input: $e');
    }
  }

  void _startDifferentialCapture() {
    print('🎬 Starting differential capture (ultra low latency mode)...');
    
    // Capture at 60 FPS for ultra-smooth experience
    _captureTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) async {
      if (_dataChannel?.state != RTCDataChannelState.RTCDataChannelOpen) {
        return;
      }

      try {
        final result = await NativeScreen.captureFrame(returnPixels: true);
        
        if (result != null && result.pixels != null) {
          await _processDifferentialFrame(
            result.pixels!,
            result.width,
            result.height,
          );
          
          // Update FPS counter
          _lastSecondFrames++;
          final now = DateTime.now();
          if (now.difference(_lastFpsCheck).inSeconds >= 1) {
            _currentFps = _lastSecondFrames;
            _lastSecondFrames = 0;
            _lastFpsCheck = now;
            
            _adjustSettings();
            
            final bandwidth = (_sentFrames * 8) / 1024; // KB/s estimate
            onPerformanceUpdate?.call(_currentFps, bandwidth, _blockSize);
            
            print('📊 FPS: $_currentFps | BlockSize: $_blockSize | Sent: $_sentFrames | Dropped: $_droppedFrames');
            _sentFrames = 0;
          }
        }
      } catch (e) {
        print('Capture error: $e');
      }
    });
  }

  void _adjustSettings() {
    // Adaptive block size based on performance
    if (_currentFps >= 55 && _droppedFrames < 5) {
      // Performance is good, increase quality (smaller blocks)
      _blockSize = (_blockSize ~/ 2).clamp(16, 128);
      _changeThreshold = (_changeThreshold - 0.01).clamp(0.01, 0.1);
    } else if (_currentFps < 40 || _droppedFrames > 20) {
      // Performance is poor, decrease quality (larger blocks)
      _blockSize = (_blockSize * 2).clamp(16, 128);
      _changeThreshold = (_changeThreshold + 0.01).clamp(0.01, 0.1);
    }
    
    if (_droppedFrames > 50) {
      _droppedFrames = 0;
    }
  }

  Future<void> _processDifferentialFrame(
    Uint8List pixels,
    int width,
    int height,
  ) async {
    try {
      // Downscale to 720p for better performance
      final targetWidth = (width * 0.66).toInt(); // ~720p width
      final targetHeight = (height * 0.66).toInt();
      
      final scaledPixels = _downscalePixels(pixels, width, height, targetWidth, targetHeight);
      
      // First frame or resolution changed - send full frame
      if (_previousFrame == null || 
          _previousWidth != targetWidth || 
          _previousHeight != targetHeight) {
        await _sendFullFrame(scaledPixels, targetWidth, targetHeight);
        _previousFrame = Uint8List.fromList(scaledPixels);
        _previousWidth = targetWidth;
        _previousHeight = targetHeight;
        return;
      }
      
      // Find changed blocks
      final changedBlocks = _findChangedBlocks(
        scaledPixels,
        _previousFrame!,
        targetWidth,
        targetHeight,
      );
      
      // If more than 30% changed, send full frame
      final totalBlocks = (targetWidth ~/ _blockSize) * (targetHeight ~/ _blockSize);
      if (changedBlocks.length > totalBlocks * 0.3) {
        await _sendFullFrame(scaledPixels, targetWidth, targetHeight);
      } else if (changedBlocks.isNotEmpty) {
        await _sendDifferentialFrame(changedBlocks, scaledPixels, targetWidth, targetHeight);
      }
      
      // Update previous frame
      _previousFrame = Uint8List.fromList(scaledPixels);
    } catch (e) {
      print('Error processing differential frame: $e');
      _droppedFrames++;
    }
  }

  Uint8List _downscalePixels(Uint8List pixels, int srcW, int srcH, int dstW, int dstH) {
    final result = Uint8List(dstW * dstH * 4);
    final xRatio = srcW / dstW;
    final yRatio = srcH / dstH;
    
    for (int y = 0; y < dstH; y++) {
      for (int x = 0; x < dstW; x++) {
        final srcX = (x * xRatio).toInt();
        final srcY = (y * yRatio).toInt();
        final srcIdx = (srcY * srcW + srcX) * 4;
        final dstIdx = (y * dstW + x) * 4;
        
        result[dstIdx] = pixels[srcIdx];
        result[dstIdx + 1] = pixels[srcIdx + 1];
        result[dstIdx + 2] = pixels[srcIdx + 2];
        result[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }
    
    return result;
  }

  List<_ChangedBlock> _findChangedBlocks(
    Uint8List current,
    Uint8List previous,
    int width,
    int height,
  ) {
    final blocks = <_ChangedBlock>[];
    final blocksX = width ~/ _blockSize;
    final blocksY = height ~/ _blockSize;
    
    for (int by = 0; by < blocksY; by++) {
      for (int bx = 0; bx < blocksX; bx++) {
        if (_hasBlockChanged(current, previous, width, bx, by)) {
          blocks.add(_ChangedBlock(bx, by));
        }
      }
    }
    
    return blocks;
  }

  bool _hasBlockChanged(
    Uint8List current,
    Uint8List previous,
    int width,
    int bx,
    int by,
  ) {
    int diffCount = 0;
    final threshold = (_blockSize * _blockSize * _changeThreshold).toInt();
    
    for (int y = 0; y < _blockSize; y++) {
      for (int x = 0; x < _blockSize; x++) {
        final px = bx * _blockSize + x;
        final py = by * _blockSize + y;
        final idx = (py * width + px) * 4;
        
        // Compare RGB values (skip alpha)
        if ((current[idx] - previous[idx]).abs() > 10 ||
            (current[idx + 1] - previous[idx + 1]).abs() > 10 ||
            (current[idx + 2] - previous[idx + 2]).abs() > 10) {
          diffCount++;
          if (diffCount > threshold) return true;
        }
      }
    }
    
    return false;
  }

  Future<void> _sendFullFrame(Uint8List pixels, int width, int height) async {
    final packet = BytesBuilder();
    
    // Header: [type:1][width:4][height:4]
    packet.addByte(0); // 0 = full frame
    packet.add(_int32Bytes(width));
    packet.add(_int32Bytes(height));
    
    // Simple RLE compression
    final compressed = _compressRLE(pixels);
    packet.add(compressed);
    
    final frameData = packet.toBytes();
    
    try {
      await _dataChannel!.send(RTCDataChannelMessage.fromBinary(frameData));
      _sentFrames++;
      _frameCount++;
    } catch (e) {
      _droppedFrames++;
    }
  }

  Future<void> _sendDifferentialFrame(
    List<_ChangedBlock> blocks,
    Uint8List pixels,
    int width,
    int height,
  ) async {
    final packet = BytesBuilder();
    
    // Header: [type:1][width:4][height:4][blockCount:4]
    packet.addByte(1); // 1 = differential frame
    packet.add(_int32Bytes(width));
    packet.add(_int32Bytes(height));
    packet.add(_int32Bytes(blocks.length));
    
    // For each block: [x:2][y:2][pixels:blockSize*blockSize*4]
    for (final block in blocks) {
      packet.add(_int16Bytes(block.x));
      packet.add(_int16Bytes(block.y));
      
      // Extract block pixels
      final blockPixels = Uint8List(_blockSize * _blockSize * 4);
      int idx = 0;
      for (int y = 0; y < _blockSize; y++) {
        for (int x = 0; x < _blockSize; x++) {
          final px = block.x * _blockSize + x;
          final py = block.y * _blockSize + y;
          final srcIdx = (py * width + px) * 4;
          blockPixels[idx++] = pixels[srcIdx];
          blockPixels[idx++] = pixels[srcIdx + 1];
          blockPixels[idx++] = pixels[srcIdx + 2];
          blockPixels[idx++] = pixels[srcIdx + 3];
        }
      }
      
      packet.add(blockPixels);
    }
    
    final frameData = packet.toBytes();
    
    try {
      await _dataChannel!.send(RTCDataChannelMessage.fromBinary(frameData));
      _sentFrames++;
      _frameCount++;
    } catch (e) {
      _droppedFrames++;
    }
  }

  void _decodeDifferentialFrame(Uint8List data) {
    try {
      if (data.isEmpty) return;
      
      final type = data[0];
      int offset = 1;
      
      final width = _bytesToInt32(data, offset);
      offset += 4;
      final height = _bytesToInt32(data, offset);
      offset += 4;
      
      if (type == 0) {
        // Full frame
        final compressed = data.sublist(offset);
        final pixels = _decompressRLE(compressed, width * height * 4);
        onRemoteFrame?.call(pixels, width, height);
      } else if (type == 1) {
        // Differential frame
        final blockCount = _bytesToInt32(data, offset);
        offset += 4;
        
        // Start with previous frame or create new
        final pixels = _previousFrame != null && 
                      _previousWidth == width && 
                      _previousHeight == height
            ? Uint8List.fromList(_previousFrame!)
            : Uint8List(width * height * 4);
        
        // Apply changed blocks
        for (int i = 0; i < blockCount; i++) {
          final bx = _bytesToInt16(data, offset);
          offset += 2;
          final by = _bytesToInt16(data, offset);
          offset += 2;
          
          // Copy block pixels
          int blockIdx = 0;
          for (int y = 0; y < _blockSize; y++) {
            for (int x = 0; x < _blockSize; x++) {
              final px = bx * _blockSize + x;
              final py = by * _blockSize + y;
              if (px < width && py < height) {
                final destIdx = (py * width + px) * 4;
                pixels[destIdx] = data[offset + blockIdx++];
                pixels[destIdx + 1] = data[offset + blockIdx++];
                pixels[destIdx + 2] = data[offset + blockIdx++];
                pixels[destIdx + 3] = data[offset + blockIdx++];
              }
            }
          }
          offset += _blockSize * _blockSize * 4;
        }
        
        _previousFrame = pixels;
        _previousWidth = width;
        _previousHeight = height;
        
        onRemoteFrame?.call(pixels, width, height);
      }
    } catch (e) {
      print('Error decoding differential frame: $e');
    }
  }

  // Simple RLE compression
  Uint8List _compressRLE(Uint8List data) {
    final result = BytesBuilder();
    int count = 1;
    
    for (int i = 1; i < data.length; i++) {
      if (data[i] == data[i - 1] && count < 255) {
        count++;
      } else {
        result.addByte(count);
        result.addByte(data[i - 1]);
        count = 1;
      }
    }
    
    result.addByte(count);
    result.addByte(data[data.length - 1]);
    
    return result.toBytes();
  }

  Uint8List _decompressRLE(Uint8List data, int expectedSize) {
    final result = BytesBuilder();
    
    for (int i = 0; i < data.length; i += 2) {
      final count = data[i];
      final value = data[i + 1];
      for (int j = 0; j < count; j++) {
        result.addByte(value);
      }
    }
    
    return result.toBytes();
  }

  // Helper methods
  Uint8List _int32Bytes(int value) {
    return Uint8List(4)..buffer.asByteData().setInt32(0, value, Endian.little);
  }

  Uint8List _int16Bytes(int value) {
    return Uint8List(2)..buffer.asByteData().setInt16(0, value, Endian.little);
  }

  int _bytesToInt32(Uint8List bytes, int offset) {
    return bytes.buffer.asByteData().getInt32(offset, Endian.little);
  }

  int _bytesToInt16(Uint8List bytes, int offset) {
    return bytes.buffer.asByteData().getInt16(offset, Endian.little);
  }

  void _handleSignalingMessage(dynamic message) async {
    try {
      final data = jsonDecode(message);
      final type = data['type'];

      switch (type) {
        case 'offer':
          await _handleOffer(data['sdp']);
          break;
        case 'answer':
          await _handleAnswer(data['sdp']);
          break;
        case 'ice-candidate':
          await _handleIceCandidate(data['candidate']);
          break;
        case 'peer-joined':
          if (role == PeerRole.host && _dataChannel != null) {
            final offer = await _peerConnection!.createOffer();
            await _peerConnection!.setLocalDescription(offer);
            _sendSignalingMessage({
              'type': 'offer',
              'sdp': offer.toMap(),
              'room': _roomId,
            });
          }
          break;
      }
    } catch (e) {
      print('Error handling signaling message: $e');
    }
  }

  Future<void> _handleOffer(Map<String, dynamic> sdpMap) async {
    final sdp = RTCSessionDescription(sdpMap['sdp'], sdpMap['type']);
    await _peerConnection!.setRemoteDescription(sdp);
    final answer = await _peerConnection!.createAnswer();
    await _peerConnection!.setLocalDescription(answer);
    _sendSignalingMessage({'type': 'answer', 'sdp': answer.toMap(), 'room': _roomId});
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
    _wsChannel?.sink.add(jsonEncode(message));
  }

  Future<void> dispose() async {
    _captureTimer?.cancel();
    await _dataChannel?.close();
    await _peerConnection?.close();
    await _wsChannel?.sink.close();
    print('Disposed | Sent: $_sentFrames | Dropped: $_droppedFrames');
  }
}

class _ChangedBlock {
  final int x;
  final int y;
  _ChangedBlock(this.x, this.y);
}