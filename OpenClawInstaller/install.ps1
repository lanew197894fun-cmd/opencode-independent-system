# ═══════════════════════════════════════════════════════════════════════
# ║  🦞 OpenClaw 安裝腳本 v2.0 (PowerShell)                         ║
# ║  自動檢測環境 • 一鍵安裝 • 跨平台支援                              ║
# ═══════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 OpenClaw 的 Windows 安裝精靈，協助檢測環境並完成安裝。
#   支援 Windows PowerShell 5.x 和 PowerShell 7。
#
# 使用方法：
#   .\install.ps1 - 啟動互動選單
#
# 功能選項：
#   [1] 檢測環境    - 檢查管理員權限、Bun、Docker
#   [2] 安裝依賴   - 安裝 OpenCode 和 OpenClaw 依賴
#   [3] 啟動服務   - 啟動 launcher.ps1
#   [4] 完整安裝   - 執行全部步驟
#   [0] 離開
#
# 環境檢測：
#   - 管理員權限 (建議)
#   - Bun (必要)
#   - Docker (可選)
#
# 安裝說明：
#   1. 首次使用，建議選擇 [4] 完整安裝
#   - 會自動檢測環境、安裝依賴、啟動服務
#   2. 如果環境已有 Bun，可選 [2] 安裝依賴
#
# 依賴：
#   - PowerShell 5.1+ 或 7+
#   - Bun (必要) - 安裝: winget install oven-bun
#   - Docker Desktop (可選)
#
# 參考：
#   Bun 安裝: https://bun.sh
#   Docker: https://docker.com
#
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Error { param($m) Write-Host "[✗] $m" -ForegroundColor Red }

# 檢查管理員權限
function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# 檢查 Bun
function Get-BunPath {
    $bun = Get-Command bun -ErrorAction SilentlyContinue
    if ($bun) { return $bun.Source }
    
    # 嘗試常見路徑
    $paths = @(
        "$env:LOCALAPPDATA\bun\bun.exe",
        "$env:PROGRAMFILES\bun\bun.exe",
        "$env:USERPROFILE\.bun\bun.exe"
    )
    foreach ($p in $paths) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# 檢查 Docker
function Test-Docker {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    return ($null -ne $docker)
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗"
    Write-Host "║     🦞 OpenClaw 安裝精靈 v2.0                       ║"
    Write-Host "╠══════════════════════════════════════════════════════╣"
    Write-Host "║  1. 檢測環境                                        ║"
    Write-Host "║  2. 安裝依賴                                        ║"
    Write-Host "║  3. 啟動服務                                        ║"
    Write-Host "║  4. 完整安裝                                        ║"
    Write-Host "║  0. 離開                                           ║"
    Write-Host "╚══════════════════════════════════════════════════════╝"
    Write-Host ""
}

# 環境檢測
function Check-Environment {
    Write-Host ""
    Write-Host "═══ 環境檢測 ═══" -ForegroundColor Cyan
    
    # 管理員
    $isAdmin = Test-Admin
    if ($isAdmin) {
        Write-Info "管理員權限: 是"
    } else {
        Write-Warn "管理員權限: 否 (建議使用管理員執行)"
    }
    
    # Bun
    $bunPath = Get-BunPath
    if ($bunPath) {
        Write-Info "Bun: 已安裝 ($bunPath)"
    } else {
        Write-Error "Bun: 未安裝"
        Write-Host "  安裝: winget install oven-bun"
    }
    
    # Docker
    if (Test-Docker) {
        Write-Info "Docker: 已安裝"
    } else {
        Write-Warn "Docker: 未安裝 (可選)"
    }
    
    Write-Host ""
    Read-Host "按 Enter 繼續"
}

# 安裝依賴
function Install-Dependencies {
    Write-Host ""
    Write-Host "═══ 安裝依賴 ═══" -ForegroundColor Cyan
    
    $bunPath = Get-BunPath
    if (-not $bunPath) {
        Write-Error "請先安裝 Bun"
        return
    }
    
    # 安裝 OpenCode
    Write-Info "正在安裝 OpenCode..."
    & $bunPath install
    
    # 安裝 OpenClaw 依賴
    if (Test-Path "$SCRIPT_DIR/openclaw/package.json") {
        Write-Info "正在安裝 OpenClaw 依賴..."
        Push-Location "$SCRIPT_DIR/openclaw"
        & $bunPath install
        Pop-Location
    }
    
    Write-Info "依賴安裝完成"
    Write-Host ""
    Read-Host "按 Enter 繼續"
}

# 啟動服務
function Start-Services {
    Write-Host ""
    Write-Host "═══ 啟動服務 ═══" -ForegroundColor Cyan
    
    $launcher = Join-Path $SCRIPT_DIR "launcher.ps1"
    if (Test-Path $launcher) {
        Write-Info "正在啟動..."
        Start-Process powershell.exe -ArgumentList "-NoExit", "-File", $launcher
    } else {
        Write-Error "找不到啟動腳本"
    }
}

# 主程式
while ($true) {
    Show-Menu
    $choice = Read-Host "請選擇 [0-4]"
    
    switch ($choice) {
        "1" { Check-Environment }
        "2" { Install-Dependencies }
        "3" { Start-Services }
        "4" { Check-Environment; Install-Dependencies; Start-Services }
        "0" { Write-Info "再見！"; break }
        default { Write-Warn "無效選項" }
    }
}
