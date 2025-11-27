import 'package:plugin_platform_interface/plugin_platform_interface.dart';

import 'screen_capture_plugin_method_channel.dart';

abstract class ScreenCapturePluginPlatform extends PlatformInterface {
  /// Constructs a ScreenCapturePluginPlatform.
  ScreenCapturePluginPlatform() : super(token: _token);

  static final Object _token = Object();

  static ScreenCapturePluginPlatform _instance = MethodChannelScreenCapturePlugin();

  /// The default instance of [ScreenCapturePluginPlatform] to use.
  ///
  /// Defaults to [MethodChannelScreenCapturePlugin].
  static ScreenCapturePluginPlatform get instance => _instance;

  /// Platform-specific implementations should set this with their own
  /// platform-specific class that extends [ScreenCapturePluginPlatform] when
  /// they register themselves.
  static set instance(ScreenCapturePluginPlatform instance) {
    PlatformInterface.verifyToken(instance, _token);
    _instance = instance;
  }

  Future<String?> getPlatformVersion() {
    throw UnimplementedError('platformVersion() has not been implemented.');
  }
}
