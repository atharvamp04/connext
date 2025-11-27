#include "flutter_window.h"

#include <optional>

#include "flutter/generated_plugin_registrant.h"

FlutterWindow::FlutterWindow(const flutter::DartProject& project)
    : project_(project) {}

FlutterWindow::~FlutterWindow() {}

bool FlutterWindow::OnCreate() {
  if (!Win32Window::OnCreate()) {
    return false;
  }

  RECT frame = GetClientArea();

  // The size here must match the window dimensions to avoid unnecessary surface
  // creation / destruction in the startup path.
  flutter_controller_ = std::make_unique<flutter::FlutterViewController>(
      frame.right - frame.left, frame.bottom - frame.top, project_);
  // Ensure that basic setup of the controller was successful.
  if (!flutter_controller_->engine() || !flutter_controller_->view()) {
    return false;
  }
  RegisterPlugins(flutter_controller_->engine());
  
  // Setup input method channel
  SetupInputMethodChannel(flutter_controller_->engine());
  
  SetChildContent(flutter_controller_->view()->GetNativeWindow());

  flutter_controller_->engine()->SetNextFrameCallback([&]() {
    this->Show();
  });

  // Flutter can complete the first frame before the "show window" callback is
  // registered. The following call ensures a frame is pending to ensure the
  // window is shown. It is a no-op if the first frame hasn't completed yet.
  flutter_controller_->ForceRedraw();

  return true;
}

void FlutterWindow::OnDestroy() {
  if (flutter_controller_) {
    flutter_controller_ = nullptr;
  }

  Win32Window::OnDestroy();
}

LRESULT
FlutterWindow::MessageHandler(HWND hwnd, UINT const message,
                              WPARAM const wparam,
                              LPARAM const lparam) noexcept {
  // Give Flutter, including plugins, an opportunity to handle window messages.
  if (flutter_controller_) {
    std::optional<LRESULT> result =
        flutter_controller_->HandleTopLevelWindowProc(hwnd, message, wparam,
                                                      lparam);
    if (result) {
      return *result;
    }
  }

  switch (message) {
    case WM_FONTCHANGE:
      flutter_controller_->engine()->ReloadSystemFonts();
      break;
  }

  return Win32Window::MessageHandler(hwnd, message, wparam, lparam);
}

// Helper function to map key names to Windows Virtual Key codes
WORD MapKeyToVirtualKey(const std::string& key) {
    if (key == "enter") return VK_RETURN;
    if (key == "backspace") return VK_BACK;
    if (key == "tab") return VK_TAB;
    if (key == "escape") return VK_ESCAPE;
    if (key == "space") return VK_SPACE;
    if (key == "delete") return VK_DELETE;
    
    if (key == "up") return VK_UP;
    if (key == "down") return VK_DOWN;
    if (key == "left") return VK_LEFT;
    if (key == "right") return VK_RIGHT;
    
    if (key == "shift") return VK_SHIFT;
    if (key == "ctrl") return VK_CONTROL;
    if (key == "alt") return VK_MENU;
    if (key == "meta") return VK_LWIN;
    
    if (key == "f1") return VK_F1;
    if (key == "f2") return VK_F2;
    if (key == "f3") return VK_F3;
    if (key == "f4") return VK_F4;
    if (key == "f5") return VK_F5;
    if (key == "f6") return VK_F6;
    if (key == "f7") return VK_F7;
    if (key == "f8") return VK_F8;
    if (key == "f9") return VK_F9;
    if (key == "f10") return VK_F10;
    if (key == "f11") return VK_F11;
    if (key == "f12") return VK_F12;
    
    // Single character keys
    if (key.length() == 1) {
        char c = static_cast<char>(std::toupper(static_cast<unsigned char>(key[0])));
        if (c >= 'A' && c <= 'Z') return static_cast<WORD>(c);
        if (c >= '0' && c <= '9') return static_cast<WORD>(c);
    }
    
    return 0;
}

void FlutterWindow::SetupInputMethodChannel(flutter::FlutterEngine* engine) {
    const auto& codec = flutter::StandardMethodCodec::GetInstance();
    
    auto channel = std::make_unique<flutter::MethodChannel<>>(
        engine->messenger(),
        "connext_desktop/input",
        &codec
    );

    channel->SetMethodCallHandler(
        [](const flutter::MethodCall<>& call,
           std::unique_ptr<flutter::MethodResult<>> result) {
            
            const auto& method_name = call.method_name();
            const auto* arguments = std::get_if<flutter::EncodableMap>(call.arguments());
            
            if (!arguments) {
                result->Error("INVALID_ARGS", "Arguments must be a map");
                return;
            }

            if (method_name == "mouseMove") {
                auto x_it = arguments->find(flutter::EncodableValue("x"));
                auto y_it = arguments->find(flutter::EncodableValue("y"));
                
                if (x_it != arguments->end() && y_it != arguments->end()) {
                    int x = std::get<int>(x_it->second);
                    int y = std::get<int>(y_it->second);
                    
                    SetCursorPos(x, y);
                    result->Success();
                } else {
                    result->Error("MISSING_ARGS", "Missing x or y");
                }
            }
            else if (method_name == "mouseClick") {
                auto button_it = arguments->find(flutter::EncodableValue("button"));
                auto action_it = arguments->find(flutter::EncodableValue("action"));
                
                if (button_it != arguments->end() && action_it != arguments->end()) {
                    std::string button = std::get<std::string>(button_it->second);
                    std::string action = std::get<std::string>(action_it->second);
                    
                    DWORD downFlag = 0, upFlag = 0;
                    
                    if (button == "left") {
                        downFlag = MOUSEEVENTF_LEFTDOWN;
                        upFlag = MOUSEEVENTF_LEFTUP;
                    } else if (button == "right") {
                        downFlag = MOUSEEVENTF_RIGHTDOWN;
                        upFlag = MOUSEEVENTF_RIGHTUP;
                    } else if (button == "middle") {
                        downFlag = MOUSEEVENTF_MIDDLEDOWN;
                        upFlag = MOUSEEVENTF_MIDDLEUP;
                    }
                    
                    if (action == "down") {
                        mouse_event(downFlag, 0, 0, 0, 0);
                    } else if (action == "up") {
                        mouse_event(upFlag, 0, 0, 0, 0);
                    } else {
                        mouse_event(downFlag, 0, 0, 0, 0);
                        mouse_event(upFlag, 0, 0, 0, 0);
                    }
                    
                    result->Success();
                } else {
                    result->Error("MISSING_ARGS", "Missing button or action");
                }
            }
            else if (method_name == "mouseScroll") {
                auto deltaY_it = arguments->find(flutter::EncodableValue("deltaY"));
                
                if (deltaY_it != arguments->end()) {
                    int deltaY = std::get<int>(deltaY_it->second);
                    mouse_event(MOUSEEVENTF_WHEEL, 0, 0, static_cast<DWORD>(-deltaY), 0);
                }
                
                result->Success();
            }
            else if (method_name == "keyPress") {
                auto key_it = arguments->find(flutter::EncodableValue("key"));
                auto action_it = arguments->find(flutter::EncodableValue("action"));
                
                if (key_it != arguments->end() && action_it != arguments->end()) {
                    std::string key = std::get<std::string>(key_it->second);
                    std::string action = std::get<std::string>(action_it->second);
                    
                    WORD vk = MapKeyToVirtualKey(key);
                    
                    if (vk != 0) {
                        BYTE vkByte = static_cast<BYTE>(vk);
                        DWORD flags = (action == "up") ? KEYEVENTF_KEYUP : 0;
                        keybd_event(vkByte, 0, flags, 0);
                        
                        if (action == "press") {
                            keybd_event(vkByte, 0, KEYEVENTF_KEYUP, 0);
                        }
                    }
                    
                    result->Success();
                } else {
                    result->Error("MISSING_ARGS", "Missing key or action");
                }
            }
            else {
                result->NotImplemented();
            }
        }
    );
}