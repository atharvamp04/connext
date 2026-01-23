# ============================================================
# RustDesk Windows Automated Builder
# Author: ChatGPT (for Atharva)
# ============================================================

Write-Host "🚀 Starting RustDesk Automated Build..." -ForegroundColor Cyan

# ---------------------------------------------
# Install Chocolatey if missing
# ---------------------------------------------
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
}

# ---------------------------------------------
# Install LLVM + Tools
# ---------------------------------------------
Write-Host "Installing LLVM/Clang, CMake, Ninja..." -ForegroundColor Yellow
choco install llvm cmake ninja git -y

# ---------------------------------------------
# Install vcpkg
# ---------------------------------------------
$VCPKG = "C:\vcpkg"
if (!(Test-Path $VCPKG)) {
    Write-Host "Cloning vcpkg..." -ForegroundColor Yellow
    git clone https://github.com/microsoft/vcpkg $VCPKG
    & "$VCPKG\bootstrap-vcpkg.bat"
}

# ---------------------------------------------
# Install RustDesk Dependencies
# ---------------------------------------------
Write-Host "Installing vcpkg libs..." -ForegroundColor Yellow
& "$VCPKG\vcpkg.exe" install opus:x64-windows-static
& "$VCPKG\vcpkg.exe" install libvpx:x64-windows-static
& "$VCPKG\vcpkg.exe" install libyuv:x64-windows-static
& "$VCPKG\vcpkg.exe" install harfbuzz:x64-windows-static

# Set environment variable
[Environment]::SetEnvironmentVariable("VCPKG_ROOT", $VCPKG, "User")

# ---------------------------------------------
# Install cargo-make
# ---------------------------------------------
Write-Host "Installing cargo-make..." -ForegroundColor Yellow
cargo install cargo-make

# ---------------------------------------------
# Build RustDesk
# ---------------------------------------------
Write-Host "Building RustDesk..." -ForegroundColor Cyan

cd rustdesk
cargo make windows

Write-Host "🎉 Build Complete!" -ForegroundColor Green
Write-Host "Your executables are located at: rustdesk\target\release"
Write-Host "Files:"
Write-Host " - rustdesk.exe"
Write-Host " - rustdesk-host.exe"
Write-Host " - rustdesk-service.exe"
