import 'package:flutter/services.dart';

class NativeInputHandler {
  static const MethodChannel _channel = MethodChannel('native_input');

  static Future<void> handleMouseMove(double x, double y) async {
    try {
      await _channel.invokeMethod('mouseMove', {
        'x': x,
        'y': y,
      });
    } catch (e) {
      print('Failed to handle mouse move: $e');
    }
  }

  static Future<void> handleMouseClick(String button, String action) async {
    try {
      await _channel.invokeMethod('mouseClick', {
        'button': button,
        'action': action,
      });
    } catch (e) {
      print('Failed to handle mouse click: $e');
    }
  }

  static Future<void> handleMouseScroll(int deltaX, int deltaY) async {
    try {
      await _channel.invokeMethod('mouseScroll', {
        'deltaX': deltaX,
        'deltaY': deltaY,
      });
    } catch (e) {
      print('Failed to handle mouse scroll: $e');
    }
  }

  static Future<void> handleKeyPress(String key, String action) async {
    try {
      await _channel.invokeMethod('keyPress', {
        'key': key,
        'action': action,
      });
    } catch (e) {
      print('Failed to handle key press: $e');
    }
  }
}