import 'dart:async';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:connext_desktop/webrtc/webrtc_manager.dart';

class InteractiveScreenViewer extends StatefulWidget {
  final WebRTCManager webrtcManager;
  final ui.Image? frameImage;
  final int remoteWidth;
  final int remoteHeight;

  const InteractiveScreenViewer({
    super.key,
    required this.webrtcManager,
    required this.frameImage,
    required this.remoteWidth,
    required this.remoteHeight,
  });

  @override
  State<InteractiveScreenViewer> createState() => _InteractiveScreenViewerState();
}

class _InteractiveScreenViewerState extends State<InteractiveScreenViewer> {
  final FocusNode _focusNode = FocusNode();
  Offset? _lastMousePosition;
  bool _isLeftButtonDown = false;
  bool _isRightButtonDown = false;
  bool _isMiddleButtonDown = false;

  @override
  void initState() {
    super.initState();
    // Request focus for keyboard input
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  /// Calculate normalized coordinates (0..1) from a pointer event
  Offset? _getRemoteCoordinates(PointerEvent details, Size widgetSize) {
    if (widget.remoteWidth == 0 || widget.remoteHeight == 0 || widgetSize.isEmpty) return null;

    // Use provided remote dimensions if image is not yet available
    final imageWidth = widget.frameImage?.width.toDouble() ?? widget.remoteWidth.toDouble();
    final imageHeight = widget.frameImage?.height.toDouble() ?? widget.remoteHeight.toDouble();

    // Calculate the scaled display rect
    final double scaleX = widgetSize.width / imageWidth;
    final double scaleY = widgetSize.height / imageHeight;
    final double scale = scaleX < scaleY ? scaleX : scaleY;
    
    final double scaledWidth = imageWidth * scale;
    final double scaledHeight = imageHeight * scale;
    final double displayLeft = (widgetSize.width - scaledWidth) / 2;
    final double displayTop = (widgetSize.height - scaledHeight) / 2;
    
    final localX = details.localPosition.dx;
    final localY = details.localPosition.dy;
    
    // Check if pointer is within bounds
    if (localX < displayLeft || localX > displayLeft + scaledWidth ||
        localY < displayTop || localY > displayTop + scaledHeight) {
      return null;
    }
    
    // Map to image coordinates
    final imageX = (localX - displayLeft) / scale;
    final imageY = (localY - displayTop) / scale;
    
    // Convert to normalized (0..1)
    final normX = (imageX / imageWidth).clamp(0.0, 1.0);
    final normY = (imageY / imageHeight).clamp(0.0, 1.0);

    return Offset(normX, normY);
  }

  void _handlePointerMove(PointerEvent details, Size widgetSize) {
    final coords = _getRemoteCoordinates(details, widgetSize);
    if (coords == null) return;

    widget.webrtcManager.sendMouseMove(coords.dx, coords.dy);
  }

  void _handlePointerDown(PointerDownEvent details) {
    // Get the parent widget's size from the Listener context
    final size = context.size ?? Size.zero;
    final coords = _getRemoteCoordinates(details, size);
    if (coords == null) return;

    String button = 'left';
    if (details.buttons == kSecondaryButton) {
      button = 'right';
      _isRightButtonDown = true;
    } else if (details.buttons == kMiddleMouseButton) {
      button = 'middle';
      _isMiddleButtonDown = true;
    } else {
      button = 'left';
      _isLeftButtonDown = true;
    }

    widget.webrtcManager.sendMouseClick(button, 'down', coords.dx, coords.dy);
  }

  void _handlePointerUp(PointerUpEvent details) {
    // Get the parent widget's size from the Listener context
    final size = context.size ?? Size.zero;
    final coords = _getRemoteCoordinates(details, size);
    if (coords == null) return;

    String button = 'left';
    if (_isRightButtonDown) {
      button = 'right';
      _isRightButtonDown = false;
    } else if (_isMiddleButtonDown) {
      button = 'middle';
      _isMiddleButtonDown = false;
    } else if (_isLeftButtonDown) {
      button = 'left';
      _isLeftButtonDown = false;
    }

    widget.webrtcManager.sendMouseClick(button, 'up', coords.dx, coords.dy);
  }

  void _handleScroll(PointerSignalEvent event) {
    if (event is PointerScrollEvent) {
      widget.webrtcManager.sendMouseScroll(
        event.scrollDelta.dx,
        event.scrollDelta.dy,
      );
    }
  }

  void _handleKeyEvent(KeyEvent event) {
    final key = event.logicalKey;
    String action = 'press';
    
    if (event is KeyDownEvent) {
      action = 'down';
    } else if (event is KeyUpEvent) {
      action = 'up';
    }

    // Map common keys
    String keyName = _mapLogicalKey(key);
    
    if (keyName.isNotEmpty) {
      print('⌨️  Key event: key=$keyName action=$action');
      widget.webrtcManager.sendKeyPress(keyName, action);
    }
  }

  String _mapLogicalKey(LogicalKeyboardKey key) {
    // Special keys
    if (key == LogicalKeyboardKey.enter) return 'enter';
    if (key == LogicalKeyboardKey.backspace) return 'backspace';
    if (key == LogicalKeyboardKey.tab) return 'tab';
    if (key == LogicalKeyboardKey.escape) return 'escape';
    if (key == LogicalKeyboardKey.space) return 'space';
    if (key == LogicalKeyboardKey.delete) return 'delete';
    
    // Arrow keys
    if (key == LogicalKeyboardKey.arrowUp) return 'up';
    if (key == LogicalKeyboardKey.arrowDown) return 'down';
    if (key == LogicalKeyboardKey.arrowLeft) return 'left';
    if (key == LogicalKeyboardKey.arrowRight) return 'right';
    
    // Modifiers
    if (key == LogicalKeyboardKey.shiftLeft || key == LogicalKeyboardKey.shiftRight) return 'shift';
    if (key == LogicalKeyboardKey.controlLeft || key == LogicalKeyboardKey.controlRight) return 'ctrl';
    if (key == LogicalKeyboardKey.altLeft || key == LogicalKeyboardKey.altRight) return 'alt';
    if (key == LogicalKeyboardKey.metaLeft || key == LogicalKeyboardKey.metaRight) return 'meta';
    
    // Function keys
    if (key == LogicalKeyboardKey.f1) return 'f1';
    if (key == LogicalKeyboardKey.f2) return 'f2';
    if (key == LogicalKeyboardKey.f3) return 'f3';
    if (key == LogicalKeyboardKey.f4) return 'f4';
    if (key == LogicalKeyboardKey.f5) return 'f5';
    if (key == LogicalKeyboardKey.f6) return 'f6';
    if (key == LogicalKeyboardKey.f7) return 'f7';
    if (key == LogicalKeyboardKey.f8) return 'f8';
    if (key == LogicalKeyboardKey.f9) return 'f9';
    if (key == LogicalKeyboardKey.f10) return 'f10';
    if (key == LogicalKeyboardKey.f11) return 'f11';
    if (key == LogicalKeyboardKey.f12) return 'f12';
    
    // Regular characters
    final label = key.keyLabel;
    if (label.length == 1) {
      return label.toLowerCase();
    }
    
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _focusNode,
      onKeyEvent: (node, event) {
        _handleKeyEvent(event);
        return KeyEventResult.handled;
      },
      child: Listener(
        onPointerMove: (details) {
          final size = context.size ?? Size.zero;
          _handlePointerMove(details, size);
        },
        onPointerDown: _handlePointerDown,
        onPointerUp: _handlePointerUp,
        onPointerSignal: _handleScroll,
        child: MouseRegion(
          cursor: SystemMouseCursors.basic,
          child: Container(
            color: Colors.black,
            child: widget.frameImage != null
                ? CustomPaint(
                    painter: _RemoteScreenPainter(widget.frameImage!),
                    size: Size.infinite,
                  )
                : const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.hourglass_empty, size: 64, color: Colors.white54),
                        SizedBox(height: 16),
                        Text(
                          'Waiting for video stream...',
                          style: TextStyle(color: Colors.white54),
                        ),
                      ],
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

class _RemoteScreenPainter extends CustomPainter {
  final ui.Image image;

  _RemoteScreenPainter(this.image);

  @override
  void paint(Canvas canvas, Size size) {
    final src = Rect.fromLTWH(0, 0, image.width.toDouble(), image.height.toDouble());
    
    final double scaleX = size.width / image.width;
    final double scaleY = size.height / image.height;
    final double scale = scaleX < scaleY ? scaleX : scaleY;
    
    final double scaledWidth = image.width * scale;
    final double scaledHeight = image.height * scale;
    final double left = (size.width - scaledWidth) / 2;
    final double top = (size.height - scaledHeight) / 2;
    
    final dst = Rect.fromLTWH(left, top, scaledWidth, scaledHeight);
    
    canvas.drawImageRect(image, src, dst, Paint());
  }

  @override
  bool shouldRepaint(_RemoteScreenPainter oldDelegate) => oldDelegate.image != image;
}