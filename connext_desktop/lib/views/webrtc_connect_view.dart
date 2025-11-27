import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:connext_desktop/webrtc/webrtc_manager.dart';
import 'package:connext_desktop/widgets/interactive_screen_viewer.dart';

class WebRTCConnectView extends StatefulWidget {
  const WebRTCConnectView({super.key});

  @override
  State<WebRTCConnectView> createState() => _WebRTCConnectViewState();
}

class _WebRTCConnectViewState extends State<WebRTCConnectView> {
  WebRTCManager? _webrtc;
  final TextEditingController _roomController = TextEditingController(text: 'room-1');
  final TextEditingController _serverController = TextEditingController(text: 'ws://localhost:8080/signaling');
  
  bool _connecting = false;
  bool _connected = false;
  String _connectionState = 'Not connected';
  
  ui.Image? _currentFrame;
  int _frameCount = 0;
  int _remoteWidth = 0;
  int _remoteHeight = 0;
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();
  MediaStream? _remoteStream;

  @override
  void initState() {
    super.initState();
    _remoteRenderer.initialize();
  }

  Future<void> _connect() async {
    final room = _roomController.text.trim();
    final server = _serverController.text.trim();
    
    if (room.isEmpty || server.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter room ID and server URL')),
      );
      return;
    }

    setState(() {
      _connecting = true;
      _connected = false;
    });

    try {
      _webrtc = WebRTCManager(role: PeerRole.client);

      // Setup callbacks
      _webrtc!.onRemoteFrame = (pixels, width, height) async {
        try {
          // Store dimensions
          _remoteWidth = width;
          _remoteHeight = height;
          
          // Convert pixels to ui.Image
          final completer = Completer<ui.Image>();
          ui.decodeImageFromPixels(
            pixels,
            width,
            height,
            ui.PixelFormat.bgra8888,
            (image) {
              completer.complete(image);
            },
          );
          
          final image = await completer.future;
          
          if (mounted) {
            setState(() {
              _currentFrame?.dispose();
              _currentFrame = image;
              _frameCount++;
            });
          }
        } catch (e) {
          print('Error decoding frame: $e');
        }
      };

      _webrtc!.onRemoteStream = (stream) {
        print('onRemoteStream callback received: stream=$stream');
        try {
          if (stream != null) {
            final videoTracks = stream.getVideoTracks();
            print('  Remote stream has ${videoTracks.length} video track(s)');
            for (var t in videoTracks) {
              print('    track id=${t.id} kind=${t.kind} enabled=${t.enabled}');
            }
            _remoteStream = stream;
            _remoteRenderer.srcObject = stream;
            print('  Attached to remote renderer');
          } else {
            print('  stream is null');
            _remoteRenderer.srcObject = null;
            _remoteStream = null;
          }

          if (mounted) setState(() {});
        } catch (e) {
          print('Error attaching remote stream: $e');
        }
      };

      _webrtc!.onConnectionStateChange = (state) {
        print('Connection state: $state');
        if (mounted) {
          setState(() {
            _connectionState = state;
            _connected = state.contains('connected') || state.contains('Connected');
          });
        }
      };

      // Connect to signaling
      await _webrtc!.connectToSignaling(server, room);
      
      // Initialize peer connection
      await _webrtc!.initializePeerConnection();

      setState(() {
        _connecting = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Connecting to room: $room')),
        );
      }
    } catch (e) {
      print('Connection error: $e');
      if (mounted) {
        setState(() {
          _connecting = false;
          _connected = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to connect: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _disconnect() async {
    await _webrtc?.dispose();
    _webrtc = null;
    
    setState(() {
      _connected = false;
      _connecting = false;
      _connectionState = 'Disconnected';
      _currentFrame?.dispose();
      _currentFrame = null;
      _frameCount = 0;
    });
  }

  @override
  void dispose() {
    _webrtc?.dispose();
    _currentFrame?.dispose();
    _remoteRenderer.dispose();
    _roomController.dispose();
    _serverController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'Connect to Remote Screen (WebRTC)',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (_frameCount > 0)
              Text(
                'Frames: $_frameCount',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
            const SizedBox(width: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _connected 
                    ? Colors.greenAccent.withOpacity(0.2) 
                    : Colors.grey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _connected ? Colors.greenAccent : Colors.grey,
                ),
              ),
              child: Text(
                _connectionState,
                style: TextStyle(
                  color: _connected ? Colors.greenAccent : Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'View remote desktop streams using WebRTC Data Channels',
          style: TextStyle(color: Colors.white70),
        ),
        const SizedBox(height: 20),
        
        if (!_connected) ...[
          SizedBox(
            width: 500,
            child: Column(
              children: [
                TextField(
                  controller: _serverController,
                  decoration: const InputDecoration(
                    filled: true,
                    fillColor: Color(0xFF222222),
                    border: OutlineInputBorder(),
                    labelText: 'Signaling Server',
                    hintText: 'ws://localhost:8080/signaling',
                    prefixIcon: Icon(Icons.dns),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _roomController,
                  decoration: const InputDecoration(
                    filled: true,
                    fillColor: Color(0xFF222222),
                    border: OutlineInputBorder(),
                    labelText: 'Room ID',
                    hintText: 'Enter the room name',
                    prefixIcon: Icon(Icons.meeting_room),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _connecting ? null : _connect,
            icon: _connecting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.video_call),
            label: Text(_connecting ? 'Connecting...' : 'Connect to Room'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            ),
          ),
        ] else ...[
          Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.greenAccent),
              const SizedBox(width: 8),
              Text(
                'Connected to room: ${_roomController.text}',
                style: const TextStyle(color: Colors.greenAccent),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _disconnect,
                icon: const Icon(Icons.logout),
                label: const Text('Disconnect'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
              ),
            ],
          ),
        ],
        
        const SizedBox(height: 24),
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white24),
              color: const Color(0xFF1a1a1a),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _connected && _webrtc != null
                  ? Stack(
                      children: [
                        if (_remoteStream != null)
                          Positioned.fill(
                            child: RTCVideoView(
                              _remoteRenderer,
                              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitContain,
                            ),
                          ),
                        Positioned.fill(
                          child: InteractiveScreenViewer(
                            webrtcManager: _webrtc!,
                            frameImage: _currentFrame,
                            remoteWidth: _remoteWidth,
                            remoteHeight: _remoteHeight,
                          ),
                        ),
                      ],
                    )
                  : Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _connected ? Icons.hourglass_empty : Icons.videocam_off,
                            size: 64,
                            color: Colors.white54,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _connected 
                                ? 'Waiting for video stream...' 
                                : 'Enter room details and connect',
                            style: const TextStyle(color: Colors.white54),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ],
    );
  }
}