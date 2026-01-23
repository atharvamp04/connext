cmake_minimum_required(VERSION 3.14)
set(PROJECT_NAME "screen_capture_plugin")
project(${PROJECT_NAME} LANGUAGES CXX)

set(PLUGIN_NAME "screen_capture_plugin_plugin")

add_library(${PLUGIN_NAME} SHARED
  "screen_capture_plugin.cpp"
  "screen_video_capturer.cpp"
)

apply_standard_settings(${PLUGIN_NAME})

set_target_properties(${PLUGIN_NAME} PROPERTIES
  CXX_VISIBILITY_PRESET hidden
  WINDOWS_EXPORT_ALL_SYMBOLS ON)

cmake_minimum_required(VERSION 3.14)
set(PROJECT_NAME "screen_capture_plugin")
project(${PROJECT_NAME} LANGUAGES CXX)

set(PLUGIN_NAME "screen_capture_plugin_plugin")

add_library(${PLUGIN_NAME} SHARED
  "screen_capture_plugin.cpp"
  "screen_video_capturer.cpp"
)

apply_standard_settings(${PLUGIN_NAME})

set_target_properties(${PLUGIN_NAME} PROPERTIES
  CXX_VISIBILITY_PRESET hidden
  WINDOWS_EXPORT_ALL_SYMBOLS ON)

target_compile_definitions(${PLUGIN_NAME} PRIVATE FLUTTER_PLUGIN_IMPL)

target_include_directories(${PLUGIN_NAME} INTERFACE
  "${CMAKE_CURRENT_SOURCE_DIR}/include")

target_link_libraries(${PLUGIN_NAME} PRIVATE 
  flutter 
  flutter_wrapper_plugin
  d3d11
  dxgi
  user32
)

set(screen_capture_plugin_bundled_libraries
  "$<TARGET_FILE:${PLUGIN_NAME}>"
  PARENT_SCOPE
)