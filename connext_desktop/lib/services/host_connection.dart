import 'dart:async';
import 'dart:typed_data';
import 'package:web_socket_channel/web_socket_channel.dart';

class HostConnection {
  WebSocketChannel? _channel;
  StreamController<Uint8List>? _frameController;
  bool _connected = false;
  String? _hostAddress;

  Stream<Uint8List>? get frameStream => _frameController?.stream;
  bool get isConnected => _connected;
  String? get hostAddress => _hostAddress;

  Future<bool> connect(String host) async {
    try {
      final uri = Uri.parse('ws://$host:8080/ws');
      print('Connecting to $uri');

      _channel = WebSocketChannel.connect(uri);
      _frameController = StreamController<Uint8List>.broadcast();
      _hostAddress = host;

      // Listen for messages
      _channel!.stream.listen(
        (message) {
          if (message is List<int>) {
            // Binary message (JPEG frame)
            _frameController?.add(Uint8List.fromList(message));
          } else if (message is String) {
            // Text message (JSON)
            print('Received message: $message');
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _connected = false;
        },
        onDone: () {
          print('WebSocket connection closed');
          _connected = false;
        },
      );

      _connected = true;
      print('Connected to host at $host');
      return true;
    } catch (e) {
      print('Connection failed: $e');
      _connected = false;
      return false;
    }
  }

  void startCapture() {
    if (!_connected) return;

    final message = '{"type": "start_capture"}';
    _channel?.sink.add(message);
    print('Sent start_capture command');
  }

  void stopCapture() {
    if (!_connected) return;

    final message = '{"type": "stop_capture"}';
    _channel?.sink.add(message);
    print('Sent stop_capture command');
  }

  void sendMouseEvent(int x, int y, String action) {
    if (!_connected) return;

    final message = '{"type": "mouse_event", "x": $x, "y": $y, "action": "$action"}';
    _channel?.sink.add(message);
  }

  void sendKeyboardEvent(String key, String action) {
    if (!_connected) return;

    final message = '{"type": "keyboard_event", "key": "$key", "action": "$action"}';
    _channel?.sink.add(message);
  }

  void disconnect() {
    _channel?.sink.close();
    _frameController?.close();
    _connected = false;
    _hostAddress = null;
    print('Disconnected from host');
  }
}