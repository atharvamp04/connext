#include "include/screen_capture_plugin/screen_capture_plugin.h"

#include <flutter/plugin_registrar_windows.h>

void ScreenCapturePluginCApiRegisterWithRegistrar(
    FlutterDesktopPluginRegistrarRef registrar) {
  ScreenCapturePluginRegisterWithRegistrar(
      reinterpret_cast<flutter::PluginRegistrarWindows*>(registrar));
}
