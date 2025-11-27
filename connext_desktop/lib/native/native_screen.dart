import 'dart:typed_data';
import 'package:screen_capture_plugin/screen_capture_plugin.dart';

class NativeScreen {
  static Future<ScreenCaptureResult?> captureFrame({bool returnPixels = false}) async {
    return await ScreenCapturePlugin.captureFrame(returnPixels: returnPixels);
  }
}