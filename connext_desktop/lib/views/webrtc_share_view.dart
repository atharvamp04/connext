import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:connext_desktop/webrtc/webrtc_manager.dart';

class WebRTCShareView extends StatefulWidget {
  const WebRTCShareView({super.key});

  @override
  State<WebRTCShareView> createState() => _WebRTCShareViewState();
}

class _WebRTCShareViewState extends State<WebRTCShareView> {
  final WebRTCManager _webrtc = WebRTCManager(role: PeerRole.host);
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final TextEditingController _roomController = TextEditingController(text: 'room-1');
  
  bool _initialized = false;
  bool _sharing = false;
  String _connectionState = 'Disconnected';

  @override
  void initState() {
    super.initState();
    _initializeRenderer();
    
    _webrtc.onConnectionStateChange = (state) {
      if (mounted) {
        setState(() {
          _connectionState = state;
        });
      }
    };
  }

  Future<void> _initializeRenderer() async {
    await _localRenderer.initialize();
    setState(() {
      _initialized = true;
    });
  }

  Future<void> _startSharing() async {
    final room = _roomController.text.trim();
    if (room.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a room ID')),
      );
      return;
    }

    setState(() {
      _sharing = true;
    });

    try {
      await _webrtc.connectToSignaling('ws://localhost:8080/signaling', room);
      await _webrtc.initializePeerConnection();
      await _webrtc.startScreenShare();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sharing screen in room: $room')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _sharing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start sharing: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _stopSharing() async {
    await _webrtc.dispose();
    setState(() {
      _sharing = false;
      _connectionState = 'Disconnected';
    });
  }

  @override
  void dispose() {
    _webrtc.dispose();
    _localRenderer.dispose();
    _roomController.dispose();
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
              'Share Your Screen (WebRTC)',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: _sharing ? Colors.greenAccent.withOpacity(0.2) : Colors.grey.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _sharing ? Colors.greenAccent : Colors.grey,
                ),
              ),
              child: Text(
                _connectionState,
                style: TextStyle(
                  color: _sharing ? Colors.greenAccent : Colors.grey,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Stream your screen to remote devices using WebRTC',
          style: TextStyle(color: Colors.white70),
        ),
        const SizedBox(height: 20),
        
        if (!_sharing) ...[
          SizedBox(
            width: 400,
            child: TextField(
              controller: _roomController,
              decoration: const InputDecoration(
                filled: true,
                fillColor: Color(0xFF222222),
                border: OutlineInputBorder(),
                labelText: 'Room ID',
                hintText: 'Enter a room name',
                prefixIcon: Icon(Icons.meeting_room),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _startSharing,
            icon: const Icon(Icons.video_call),
            label: const Text('Start WebRTC Sharing'),
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
                'Sharing in room: ${_roomController.text}',
                style: const TextStyle(color: Colors.greenAccent),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _stopSharing,
                icon: const Icon(Icons.stop),
                label: const Text('Stop Sharing'),
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
              color: const Color(0xFF222222),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _initialized
                  ? RTCVideoView(_localRenderer, mirror: false)
                  : const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.screen_share, size: 64, color: Colors.white54),
                          SizedBox(height: 16),
                          Text(
                            'Your screen preview will appear here',
                            style: TextStyle(color: Colors.white54),
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