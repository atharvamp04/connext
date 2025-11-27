import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:connext_desktop/services/host_connection.dart';

class RemoteScreenViewer extends StatefulWidget {
  final HostConnection connection;
  final Uint8List? frameData;

  const RemoteScreenViewer({
    super.key,
    required this.connection,
    this.frameData,
  });

  @override
  State<RemoteScreenViewer> createState() => _RemoteScreenViewerState();
}

class _RemoteScreenViewerState extends State<RemoteScreenViewer> {
  final FocusNode _focusNode = FocusNode();
  final GlobalKey _imageKey = GlobalKey();
  
  // Remote screen dimensions (get from first frame or API)
  int _remoteWidth = 1920;
  int _remoteHeight = 1080;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
      _fetchScreenInfo();
    });
  }

  Future<void> _fetchScreenInfo() async {
    // TODO: Fetch actual screen dimensions from host
    // For now, using default 1920x1080
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  // Convert local widget coordinates to remote screen coordinates
  Offset? _localToRemote(Offset localPosition) {
    final RenderBox? renderBox = _imageKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return null;

    final size = renderBox.size;
    
    // Calculate how the image is scaled in the container (BoxFit.contain)
    final imageAspect = _remoteWidth / _remoteHeight;
    final containerAspect = size.width / size.height;
    
    double scaledWidth, scaledHeight, offsetX, offsetY;
    
    if (containerAspect > imageAspect) {
      // Container is wider - image is constrained by height
      scaledHeight = size.height;
      scaledWidth = scaledHeight * imageAspect;
      offsetX = (size.width - scaledWidth) / 2;
      offsetY = 0;
    } else {
      // Container is taller - image is constrained by width
      scaledWidth = size.width;
      scaledHeight = scaledWidth / imageAspect;
      offsetX = 0;
      offsetY = (size.height - scaledHeight) / 2;
    }

    // Check if click is within the scaled image bounds
    final imageLocalX = localPosition.dx - offsetX;
    final imageLocalY = localPosition.dy - offsetY;
    
    if (imageLocalX < 0 || imageLocalX > scaledWidth ||
        imageLocalY < 0 || imageLocalY > scaledHeight) {
      return null; // Click outside image
    }

    // Convert to remote coordinates
    final remoteX = (imageLocalX / scaledWidth * _remoteWidth).round();
    final remoteY = (imageLocalY / scaledHeight * _remoteHeight).round();

    return Offset(remoteX.toDouble(), remoteY.toDouble());
  }

  void _handlePointerMove(PointerMoveEvent event) {
    final remotePos = _localToRemote(event.localPosition);
    if (remotePos != null) {
      widget.connection.sendMouseEvent(
        remotePos.dx.toInt(),
        remotePos.dy.toInt(),
        'move',
      );
    }
  }

  void _handlePointerDown(PointerDownEvent event) {
    final remotePos = _localToRemote(event.localPosition);
    if (remotePos == null) return;

    String button = 'left';
    if (event.buttons == 2) {
      button = 'right';
    } else if (event.buttons == 4) {
      button = 'middle';
    }

    widget.connection.sendMouseEvent(
      remotePos.dx.toInt(),
      remotePos.dy.toInt(),
      'down',
    );
  }

  void _handlePointerUp(PointerUpEvent event) {
    final remotePos = _localToRemote(event.localPosition);
    if (remotePos == null) return;

    widget.connection.sendMouseEvent(
      remotePos.dx.toInt(),
      remotePos.dy.toInt(),
      'up',
    );
  }

  void _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      widget.connection.sendKeyboardEvent(
        event.logicalKey.keyLabel,
        'down',
      );
    } else if (event is KeyUpEvent) {
      widget.connection.sendKeyboardEvent(
        event.logicalKey.keyLabel,
        'up',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _focusNode,
      onKeyEvent: (node, event) {
        _handleKeyEvent(event);
        return KeyEventResult.handled;
      },
      child: MouseRegion(
        cursor: SystemMouseCursors.none, // Hide local cursor, show remote
        child: Listener(
          onPointerMove: _handlePointerMove,
          onPointerDown: _handlePointerDown,
          onPointerUp: _handlePointerUp,
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white24),
              color: const Color(0xFF1a1a1a),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: widget.frameData != null
                  ? Image.memory(
                      key: _imageKey,
                      widget.frameData!,
                      fit: BoxFit.contain,
                      gaplessPlayback: true,
                    )
                  : const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text(
                            'Waiting for frames...',
                            style: TextStyle(color: Colors.white54),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}