import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import 'screen_capture_plugin_platform_interface.dart';

/// An implementation of [ScreenCapturePluginPlatform] that uses method channels.
class MethodChannelScreenCapturePlugin extends ScreenCapturePluginPlatform {
  /// The method channel used to interact with the native platform.
  @visibleForTesting
  final methodChannel = const MethodChannel('screen_capture_plugin');

  @override
  Future<String?> getPlatformVersion() async {
    final version = await methodChannel.invokeMethod<String>('getPlatformVersion');
    return version;
  }
}
