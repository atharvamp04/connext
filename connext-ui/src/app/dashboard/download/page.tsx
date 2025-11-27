"use client";

import { useState } from "react";
import { Download, Check, AlertCircle, Copy, Terminal } from "lucide-react";
import SectionHeader from "@/app/components/dashboard/SectionHeader";
import { API_URL, authHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";

// Professional OS Logos as SVG Components
const WindowsLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 88 88" fill="currentColor">
    <path d="M0 12.402l35.687-4.86.016 34.423-35.67.203zm35.67 33.529l.028 34.453L.028 75.48.026 45.7zm4.326-39.025L87.314 0v41.527l-47.318.376zm47.329 39.349l-.011 41.34-47.318-6.678-.066-34.739z"/>
  </svg>
);

const AppleLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 814 1000" fill="currentColor">
    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
  </svg>
);

const LinuxLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 265 314" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main body - black */}
    <path d="M132.5 10C132.5 10 90 30 75 80C60 130 65 160 65 160C65 160 60 180 70 200C80 220 90 240 90 240L85 270C85 270 80 290 95 300C110 310 120 310 120 310L145 310C145 310 155 310 170 300C185 290 180 270 180 270L175 240C175 240 185 220 195 200C205 180 200 160 200 160C200 160 205 130 190 80C175 30 132.5 10 132.5 10Z" fill="#000000"/>
    
    {/* White belly */}
    <ellipse cx="132.5" cy="180" rx="55" ry="85" fill="#FFFFFF"/>
    
    {/* Left eye white */}
    <ellipse cx="105" cy="100" rx="20" ry="28" fill="#FFFFFF"/>
    {/* Right eye white */}
    <ellipse cx="160" cy="100" rx="20" ry="28" fill="#FFFFFF"/>
    
    {/* Left pupil */}
    <circle cx="108" cy="105" r="10" fill="#000000"/>
    {/* Right pupil */}
    <circle cx="157" cy="105" r="10" fill="#000000"/>
    
    {/* Left eye shine */}
    <circle cx="110" cy="102" r="4" fill="#FFFFFF"/>
    {/* Right eye shine */}
    <circle cx="159" cy="102" r="4" fill="#FFFFFF"/>
    
    {/* Beak/nose - yellow */}
    <path d="M132.5 120C132.5 120 115 125 115 140C115 155 125 158 132.5 158C140 158 150 155 150 140C150 125 132.5 120 132.5 120Z" fill="#FDB924"/>
    <path d="M132.5 120L132.5 145" stroke="#000000" strokeWidth="2"/>
    
    {/* Left foot */}
    <path d="M85 290C85 290 70 295 65 305C60 315 70 314 85 314C95 314 110 314 110 314C110 314 105 300 95 295C90 292 85 290 85 290Z" fill="#FDB924"/>
    
    {/* Right foot */}
    <path d="M180 290C180 290 195 295 200 305C205 315 195 314 180 314C170 314 155 314 155 314C155 314 160 300 170 295C175 292 180 290 180 290Z" fill="#FDB924"/>
    
    {/* Left wing */}
    <ellipse cx="60" cy="160" rx="12" ry="45" fill="#000000" transform="rotate(-15 60 160)"/>
    
    {/* Right wing */}
    <ellipse cx="205" cy="160" rx="12" ry="45" fill="#000000" transform="rotate(15 205 160)"/>
    
    {/* Foot details - left */}
    <line x1="75" y1="305" x2="75" y2="314" stroke="#000000" strokeWidth="1.5"/>
    <line x1="85" y1="305" x2="85" y2="314" stroke="#000000" strokeWidth="1.5"/>
    <line x1="95" y1="305" x2="95" y2="314" stroke="#000000" strokeWidth="1.5"/>
    
    {/* Foot details - right */}
    <line x1="170" y1="305" x2="170" y2="314" stroke="#000000" strokeWidth="1.5"/>
    <line x1="180" y1="305" x2="180" y2="314" stroke="#000000" strokeWidth="1.5"/>
    <line x1="190" y1="305" x2="190" y2="314" stroke="#000000" strokeWidth="1.5"/>
  </svg>
);

export default function ClientDownloadPage() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const serverUrl = "http://192.168.1.10:8080"; // ⚠️ CHANGE THIS to your actual Headscale server URL

  async function generateInstaller(os: 'windows' | 'mac' | 'linux') {
    setGenerating(true);
    setError("");

    try {
      // Generate a new auth key (1 hour expiration for installation)
      const res = await fetch(`${API_URL}/headscale/keys`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reusable: false,
          ephemeral: false,
          expiration: "1h"
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate auth key");
      }

      const data = await res.json();
      const authKey = data.key;

      // Generate installer script based on OS
      let script = "";
      let filename = "";
      
if (os === 'windows') {
  script = `# Connext Network Auto-Installer
# This script will install Tailscale and connect you to the Connext network

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Connext Network Client Installer" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$AuthKey = "${authKey}"
$ServerUrl = "${serverUrl}"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Right-click the script and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/3] Downloading Tailscale..." -ForegroundColor Green
$installer = "$env:TEMP\\tailscale-setup.exe"
try {
    Invoke-WebRequest -Uri "https://pkgs.tailscale.com/stable/tailscale-setup-latest.exe" -OutFile $installer -UseBasicParsing
} catch {
    Write-Host "ERROR: Failed to download Tailscale" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[2/3] Installing Tailscale..." -ForegroundColor Green
try {
    Start-Process -FilePath $installer -ArgumentList "/silent" -Wait -NoNewWindow
    Start-Sleep -Seconds 10
} catch {
    Write-Host "ERROR: Failed to install Tailscale" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[3/3] Connecting to Connext network..." -ForegroundColor Green

# Find Tailscale executable
$tailscalePath = "C:\\Program Files\\Tailscale\\tailscale.exe"
if (-not (Test-Path $tailscalePath)) {
    $tailscalePath = "C:\\Program Files (x86)\\Tailscale\\tailscale.exe"
}

if (-not (Test-Path $tailscalePath)) {
    Write-Host "ERROR: Tailscale not found after installation" -ForegroundColor Red
    Write-Host "Please check if Tailscale installed correctly" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Tailscale path: $tailscalePath" -ForegroundColor Gray
Write-Host "Server URL: $ServerUrl" -ForegroundColor Gray

try {
    # Check current status
    Write-Host "Checking current Tailscale status..." -ForegroundColor Gray
    $currentStatus = & $tailscalePath status 2>&1
    Write-Host "Current status: $currentStatus" -ForegroundColor Gray
    
    # Force complete disconnect
    Write-Host "Disconnecting from any existing networks..." -ForegroundColor Yellow
    & $tailscalePath logout 2>&1 | Out-Null
    Start-Sleep -Seconds 3
    
    # Stop Tailscale service
    Write-Host "Stopping Tailscale service..." -ForegroundColor Yellow
    Stop-Service -Name "Tailscale" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    
    # Start Tailscale service
    Write-Host "Starting Tailscale service..." -ForegroundColor Yellow
    Start-Service -Name "Tailscale" -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    
    # Now connect to new server
    Write-Host "Connecting to Connext network..." -ForegroundColor Green
    
    $connectCommand = "& '$tailscalePath' up --login-server='$ServerUrl' --authkey='$AuthKey' --accept-routes --reset --force-reauth"
    Write-Host "Running: tailscale up --login-server=$ServerUrl --authkey=*** --accept-routes --reset --force-reauth" -ForegroundColor Gray
    
    $output = & $tailscalePath up --login-server=$ServerUrl --authkey=$AuthKey --accept-routes --reset --force-reauth 2>&1
    
    Write-Host ""
    Write-Host "Connection output:" -ForegroundColor Gray
    Write-Host $output -ForegroundColor Gray
    Write-Host ""
    
    Start-Sleep -Seconds 5
    
    # Verify connection
    Write-Host "Verifying connection..." -ForegroundColor Gray
    $status = & $tailscalePath status 2>&1
    $statusString = $status | Out-String
    
    if ($statusString -match "100\.\d+\.\d+\.\d+" -or $statusString -notmatch "Logged out") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Successfully connected to Connext!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Connection details:" -ForegroundColor White
        Write-Host $statusString -ForegroundColor Gray
        Write-Host ""
        Write-Host "Your device is now part of the secure network." -ForegroundColor White
        Write-Host "You can check your connection status in the system tray." -ForegroundColor White
    } else {
        Write-Host "WARNING: Connection status unclear" -ForegroundColor Yellow
        Write-Host "Current status:" -ForegroundColor Yellow
        Write-Host $statusString -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please manually check Tailscale system tray icon" -ForegroundColor Yellow
        Write-Host "Or run: tailscale status" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "ERROR: Failed to connect to network" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual connection steps:" -ForegroundColor Yellow
    Write-Host "1. Open Command Prompt as Administrator" -ForegroundColor Yellow
    Write-Host "2. Run: tailscale logout" -ForegroundColor Yellow
    Write-Host "3. Run: tailscale up --login-server=$ServerUrl --authkey=$AuthKey --accept-routes --force-reauth" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
pause`;
  filename = "install-connext.ps1";
} else if (os === 'mac') {
        script = `#!/bin/bash
# Connext Network Auto-Installer (macOS)
# This script will install Tailscale and connect you to the Connext network

echo "========================================"
echo "  Connext Network Client Installer"
echo "========================================"
echo ""

AUTH_KEY="${authKey}"
SERVER_URL="${serverUrl}"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "\${RED}ERROR: Homebrew is not installed\${NC}"
    echo -e "\${YELLOW}Please install Homebrew first: https://brew.sh\${NC}"
    exit 1
fi

echo -e "\${GREEN}[1/3] Installing Tailscale...\${NC}"
if ! command -v tailscale &> /dev/null; then
    brew install tailscale
    if [ $? -ne 0 ]; then
        echo -e "\${RED}ERROR: Failed to install Tailscale\${NC}"
        exit 1
    fi
else
    echo "Tailscale already installed"
fi

echo -e "\${GREEN}[2/3] Starting Tailscale service...\${NC}"
sudo brew services start tailscale
sleep 3

echo -e "\${GREEN}[3/3] Connecting to Connext network...\${NC}"
sudo tailscale up --login-server="$SERVER_URL" --authkey="$AUTH_KEY" --accept-routes --reset

if [ $? -eq 0 ]; then
    echo ""
    echo -e "\${GREEN}========================================"
    echo "  Successfully connected to Connext!"
    echo "========================================\${NC}"
    echo ""
    echo "Your device is now part of the secure network."
    echo "You can check your status with: tailscale status"
else
    echo -e "\${RED}ERROR: Failed to connect to network\${NC}"
    exit 1
fi`;
        filename = "install-connext.sh";
      } else {
        // Linux
        script = `#!/bin/bash
# Connext Network Auto-Installer (Linux)
# This script will install Tailscale and connect you to the Connext network

echo "========================================"
echo "  Connext Network Client Installer"
echo "========================================"
echo ""

AUTH_KEY="${authKey}"
SERVER_URL="${serverUrl}"

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "\${RED}ERROR: This script must be run as root\${NC}"
    echo -e "\${YELLOW}Please run: sudo bash $0\${NC}"
    exit 1
fi

echo -e "\${GREEN}[1/3] Installing Tailscale...\${NC}"
if ! command -v tailscale &> /dev/null; then
    curl -fsSL https://tailscale.com/install.sh | sh
    if [ $? -ne 0 ]; then
        echo -e "\${RED}ERROR: Failed to install Tailscale\${NC}"
        exit 1
    fi
else
    echo "Tailscale already installed"
fi

echo -e "\${GREEN}[2/3] Starting Tailscale service...\${NC}"
systemctl enable --now tailscaled
sleep 2

echo -e "\${GREEN}[3/3] Connecting to Connext network...\${NC}"
tailscale up --login-server="$SERVER_URL" --authkey="$AUTH_KEY" --accept-routes --reset

if [ $? -eq 0 ]; then
    echo ""
    echo -e "\${GREEN}========================================"
    echo "  Successfully connected to Connext!"
    echo "========================================\${NC}"
    echo ""
    echo "Your device is now part of the secure network."
    echo "You can check your status with: tailscale status"
else
    echo -e "\${RED}ERROR: Failed to connect to network\${NC}"
    exit 1
fi`;
        filename = "install-connext.sh";
      }

      // Download the script
      const blob = new Blob([script], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to generate installer:", err);
      setError("Failed to generate installer. Please try again.");
    }

    setGenerating(false);
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedCommand(id);
    setTimeout(() => setCopiedCommand(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <SectionHeader
        title="Download Connext Client"
        subtitle="One-click installer to connect your devices to the network"
        center={false}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Quick Start Banner */}
      <div className="bg-gradient-to-br from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          🚀 Quick Start
        </h3>
        <p className="text-white/80 mb-4">
          Download the installer for your platform and run it. Your device will automatically connect to the network in under 60 seconds.
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-400" />
            No technical knowledge required
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-400" />
            Automatic setup
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-400" />
            Secure connection
          </span>
        </div>
      </div>

      {/* Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Windows */}
        <button
          onClick={() => generateInstaller('windows')}
          disabled={generating}
          className="group relative p-8 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
          <div className="relative">
            <WindowsLogo className="w-16 h-16 mb-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <h3 className="text-white font-semibold text-xl mb-1">Windows</h3>
            <p className="text-white/60 text-sm mb-6">Windows 10/11 (64-bit)</p>
            <div className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300">
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium">Download Installer</span>
            </div>
          </div>
        </button>

        {/* macOS */}
        <button
          onClick={() => generateInstaller('mac')}
          disabled={generating}
          className="group relative p-8 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-gray-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-500/10 rounded-full blur-3xl group-hover:bg-gray-500/20 transition-all" />
          <div className="relative">
            <AppleLogo className="w-16 h-16 mb-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
            <h3 className="text-white font-semibold text-xl mb-1">macOS</h3>
            <p className="text-white/60 text-sm mb-6">macOS 11+ (Intel & Apple Silicon)</p>
            <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300">
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium">Download Installer</span>
            </div>
          </div>
        </button>

        {/* Linux */}
        <button
          onClick={() => generateInstaller('linux')}
          disabled={generating}
          className="group relative p-8 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />
          <div className="relative">
            <LinuxLogo className="w-16 h-16 mb-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
            <h3 className="text-white font-semibold text-xl mb-1">Linux</h3>
            <p className="text-white/60 text-sm mb-6">Ubuntu, Debian, Fedora, RHEL</p>
            <div className="flex items-center gap-2 text-yellow-400 group-hover:text-yellow-300">
              <Download className="w-5 h-5" />
              <span className="text-sm font-medium">Download Installer</span>
            </div>
          </div>
        </button>
      </div>

      {/* Installation Instructions */}
{/* Installation Instructions */}
<div className="bg-white/5 border border-white/10 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
    <Terminal className="w-5 h-5" />
    Installation Instructions
  </h3>
  
{/* Windows */}
<div className="mb-6">
  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
    <WindowsLogo className="w-5 h-5 text-blue-400" />
    Windows
  </h4>
  <p className="text-white/70 text-sm mb-3">
    <strong className="text-white">Option 1:</strong> Double-click method
  </p>
  <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside mb-4">
    <li>Download the PowerShell script (.ps1 file) above</li>
    <li><strong className="text-white">Right-click the file → "Run as Administrator"</strong></li>
    <li>If prompted by Windows Defender, click "More info" → "Run anyway"</li>
    <li>Wait for installation to complete</li>
  </ol>
  
  <p className="text-white/70 text-sm mb-2">
    <strong className="text-white">Option 2:</strong> Command line (if right-click doesn't work)
  </p>
  <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside mb-2">
    <li>Search for "PowerShell" in Windows Start menu</li>
    <li>Right-click "Windows PowerShell" → "Run as Administrator"</li>
    <li>Copy and paste this command:</li>
  </ol>
  <div className="mt-2 bg-black/30 rounded-lg p-3 flex items-center justify-between">
    <code className="text-white/80 text-sm font-mono">
      Set-ExecutionPolicy Bypass -Scope Process -Force; cd $env:USERPROFILE\Downloads; .\install-connext.ps1
    </code>
    <button
      onClick={() => copyToClipboard("Set-ExecutionPolicy Bypass -Scope Process -Force; cd $env:USERPROFILE\\Downloads; .\\install-connext.ps1", "windows")}
      className="ml-2 p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
    >
      {copiedCommand === "windows" ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-white/40" />
      )}
    </button>
  </div>
</div>

  {/* macOS */}
  <div className="mb-6">
    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
      <AppleLogo className="w-5 h-5 text-gray-400" />
      macOS
    </h4>
    <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside">
      <li>Download the shell script (.sh file) above</li>
      <li>Open Terminal and run:</li>
    </ol>
    <div className="mt-2 bg-black/30 rounded-lg p-3 flex items-center justify-between">
      <code className="text-white/80 text-sm font-mono">chmod +x ~/Downloads/install-connext.sh && sudo bash ~/Downloads/install-connext.sh</code>
      <button
        onClick={() => copyToClipboard("chmod +x ~/Downloads/install-connext.sh && sudo bash ~/Downloads/install-connext.sh", "mac")}
        className="ml-2 p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
      >
        {copiedCommand === "mac" ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/40" />
        )}
      </button>
    </div>
  </div>

  {/* Linux */}
  <div>
    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
      <LinuxLogo className="w-5 h-5 text-yellow-400" />
      Linux
    </h4>
    <ol className="space-y-2 text-white/70 text-sm list-decimal list-inside">
      <li>Download the shell script (.sh file) above</li>
      <li>Open Terminal and run:</li>
    </ol>
    <div className="mt-2 bg-black/30 rounded-lg p-3 flex items-center justify-between">
      <code className="text-white/80 text-sm font-mono">chmod +x ~/Downloads/install-connext.sh && sudo bash ~/Downloads/install-connext.sh</code>
      <button
        onClick={() => copyToClipboard("chmod +x ~/Downloads/install-connext.sh && sudo bash ~/Downloads/install-connext.sh", "linux")}
        className="ml-2 p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
      >
        {copiedCommand === "linux" ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/40" />
        )}
      </button>
    </div>
  </div>
</div>

      {/* Verification */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Verify Connection
        </h4>
        <p className="text-white/70 text-sm">
          After installation, run <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs">tailscale status</code> or check the Nodes page to see your connected device.
        </p>
      </div>
    </div>
  );
}