# ═══════════════════════════════════════════════════════════════
# OpenCode 同步腳本 (PowerShell)
# 用於 WSL/Linux 同步到 Windows
# ═══════════════════════════════════════════════════════════════

param(
    [string]$Source = "",
    [string]$Destination = "",
    [switch]$All = $false,
    [switch]$OpenCode = $false,
    [switch]$OpenCode = $false,
    [switch]$Manager = $false,
    [switch]$Watch = $false
)

$ErrorActionPreference = "Stop"

# 顏色
function Write-Color { param($Text, $Color = "Green")
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Cyan" = [ConsoleColor]::Cyan
    }
    Write-Host $Text -ForegroundColor $colors[$Color]
}

Write-Color "`n╔══════════════════════════════════════════════════════╗" Cyan
Write-Color "║           🔄 OpenCode 同步工具 (PowerShell)        ║" Cyan
Write-Color "╚══════════════════════════════════════════════════════╝`n" Cyan

# 路徑配置
$Paths = @{
    # WSL/Linux 來源
    "WSLSource" = "\\wsl.localhost\Ubuntu-24.04\home\reamaster\openclaw-manager"
    "WSLHome" = "\\wsl.localhost\Ubuntu-24.04\home\reamaster"
    
    # Windows 目標
    "OpenCodeWin" = "C:\Users\ReaMasTer\.openclaw"
    "OpenCodeWin" = "C:\Users\ReaMasTer\.opencode"
    "ManagerWin" = "C:\Users\ReaMasTer\openclaw-manager"
}

# 顯示路徑
function Show-Paths {
    Write-Color "`n📁 預設路徑:" Yellow
    Write-Host "  WSL 來源:   $($Paths.WSLSource)"
    Write-Host "  Win OpenCode: $($Paths.OpenCodeWin)"
    Write-Host "  Win OpenCode: $($Paths.OpenCodeWin)"
    Write-Host "  Win Manager: $($Paths.ManagerWin)`n"
}

# 同步函數
function Sync-Folder {
    param(
        [string]$From,
        [string]$To,
        [string]$Name
    )
    
    Write-Color "正在同步: $Name" Yellow
    Write-Host "  從: $From"
    Write-Host "  到: $To`n"
    
    # 檢查來源
    if (-not (Test-Path $From)) {
        Write-Color "✗ 來源不存在: $From" Red
        return $false
    }
    
    # 建立目標目錄
    $toParent = Split-Path $To -Parent
    if (-not (Test-Path $toParent)) {
        New-Item -ItemType Directory -Path $toParent -Force | Out-Null
    }
    
    # 使用 robocopy 同步 (含隱藏檔)
    $args = @(
        $From,
        $To,
        "/E",           # 複製子目錄
        "/COPYALL",     # 複製所有屬性 (含隱藏檔)
        "/R:3",         # 重試 3 次
        "/W:2",         # 等待 2 秒
        "/MT:8",        # 多線程
        "/NP",          # 不顯示百分比
        "/NFL",         # 不顯示檔案
        "/NDL"          # 不顯示目錄
    )
    
    $result = & robocopy @args
    
    if ($LASTEXITCODE -lt 8) {
        Write-Color "✓ 同步完成: $Name" Green
        return $true
    } else {
        Write-Color "✗ 同步失敗: $Name (代碼: $LASTEXITCODE)" Red
        return $false
    }
}

# 顯示幫助
function Show-Help {
    Write-Host @"
用法:
  .\sync.ps1 -Manager              同步 openclaw-manager (WSL -> Windows)
  .\sync.ps1 -OpenCode             同步 .openclaw 配置
  .\sync.ps1 -OpenCode              同步 .opencode 配置
  .\sync.ps1 -All                   同步全部
  .\sync.ps1 -Source <路徑> -Dest <路徑>  自訂路徑
  .\sync.ps1 -Watch                 監看模式 (即時同步)

範例:
  .\sync.ps1 -Manager               同步整個專案
  .\sync.ps1 -OpenCode              同步 OpenCode 配置
  .\sync.ps1 -All                   同步所有
  .\sync.ps1 -Source "\\wsl.localhost\Ubuntu-24.04\home\reamaster" -Dest "C:\Users\ReaMasTer"

"@ -ForegroundColor White
}

# 主程式
Show-Paths

if ($All) {
    Write-Color "==> 同步全部`n" Cyan
    
    # 同步 Manager
    Sync-Folder -From $Paths.WSLSource -To $Paths.ManagerWin -Name "openclaw-manager"
    
    # 同步 OpenCode 配置
    $openclawSource = "$($Paths.WSLHome)\.openclaw"
    if (Test-Path $openclawSource) {
        Sync-Folder -From $openclawSource -To $Paths.OpenCodeWin -Name "OpenCode 配置"
    }
    
    # 同步 OpenCode 配置
    $opencodeSource = "$($Paths.WSLHome)\.opencode"
    if (Test-Path $opencodeSource) {
        Sync-Folder -From $opencodeSource -To $Paths.OpenCodeWin -Name "OpenCode 配置"
    }
    
} elseif ($Manager) {
    Write-Color "==> 同步 openclaw-manager`n" Cyan
    Sync-Folder -From $Paths.WSLSource -To $Paths.ManagerWin -Name "openclaw-manager"
    
} elseif ($OpenCode) {
    Write-Color "==> 同步 OpenCode 配置`n" Cyan
    $openclawSource = "$($Paths.WSLHome)\.openclaw"
    if (Test-Path $openclawSource) {
        Sync-Folder -From $openclawSource -To $Paths.OpenCodeWin -Name "OpenCode 配置"
    } else {
        Write-Color "✗ WSL 來源不存在: $openclawSource" Red
    }
    
} elseif ($OpenCode) {
    Write-Color "==> 同步 OpenCode 配置`n" Cyan
    $opencodeSource = "$($Paths.WSLHome)\.opencode"
    if (Test-Path $opencodeSource) {
        Sync-Folder -From $opencodeSource -To $Paths.OpenCodeWin -Name "OpenCode 配置"
    } else {
        Write-Color "✗ WSL 來源不存在: $opencodeSource" Red
    }
    
} elseif ($Source -and $Destination) {
    Write-Color "==> 自訂同步`n" Cyan
    Sync-Folder -From $Source -To $Destination -Name "自訂"
    
} elseif ($Watch) {
    Write-Color "==> 監看模式 (Ctrl+C 停止)`n" Cyan
    Write-Host "使用 robocync /MON 監看..."
    Write-Host "此功能需要進階設定，請手動執行:"
    Write-Host "  robocopy `"$($Paths.WSLSource)`" `"$($Paths.ManagerWin)`" /E /COPYALL /MON:1 /MOT:1`n"
    
} else {
    Show-Help
}

Write-Color "`n✓ 完成!`n" Green
