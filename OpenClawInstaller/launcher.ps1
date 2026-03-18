# ═══════════════════════════════════════════════════════════════════════
# ║  🦞 OpenClaw + OpenCode 整合啟動器 v2.0 (PowerShell)            ║
# ║  一鍵啟動 • 狀態監控 • 資源管理 • 自動修復                        ║
# ═══════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 OpenClaw 的 Windows PowerShell 啟動腳本，提供服務管理與狀態監控。
#   支援 Windows PowerShell 5.x 和 PowerShell 7。
#
# 使用方法：
#   .\launcher.ps1          - 啟動互動選單
#   .\launcher.ps1 start    - 啟動 Gateway
#   .\launcher.ps1 stop     - 停止 Gateway
#   .\launcher.ps1 status   - 查看狀態
#   .\launcher.ps1 restart  - 重啟 Gateway
#
# 功能：
#   1. 啟動/停止/重啟 OpenClaw Gateway
#   2. 查看服務狀態與 PID
#   3. 監控資源使用 (CPU/記憶體)
#   4. 互動式選單介面
#
# 環境：
#   $env:USERPROFILE\.openclaw - OpenClaw 配置目錄
#   連接埠 18789 - Gateway 服務
#
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$CONFIG_DIR = "$env:USERPROFILE\.openclaw"

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Error { param($m) Write-Host "[✗] $m" -ForegroundColor Red }

# 獲取 PID
function Get-GatewayPID {
    $proc = Get-NetTCPConnection -LocalPort 18789 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) { $proc.OwningProcess } else { $null }
}

# 服務狀態
function Test-GatewayRunning {
    $pid = Get-GatewayPID
    return $null -ne $pid
}

# 資源監控
function Get-Resources {
    $pid = Get-GatewayPID
    if (-not $pid) { return $null }
    try {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc) {
            return @{
                CPU = [math]::Round($proc.CPU, 1)
                MemoryMB = [math]::Round($proc.WorkingSet64 / 1MB, 1)
            }
        }
    } catch { }
    return $null
}

# 顯示狀態
function Show-Status {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗"
    Write-Host "║          🦞 OpenClaw 系統狀態                    ║"
    Write-Host "╠══════════════════════════════════════════════════════╣"
    Write-Host "║  服務               狀態         PID              ║"
    Write-Host "╠══════════════════════════════════════════════════════╣"
    
    $running = Test-GatewayRunning
    $pid = Get-GatewayPID
    $status = if ($running) { "執行中" } else { "已停止" }
    $pidStr = if ($pid) { $pid.ToString() } else { "-" }
    
    Write-Host ("║  OpenClaw Gateway   {0,-11} {1,-15}║" -f $status, $pidStr)
    Write-Host "╚══════════════════════════════════════════════════════╝"
    
    if ($running) {
        $res = Get-Resources
        if ($res) {
            Write-Host "CPU: $($res.CPU)% | 記憶體: $($res.MemoryMB) MB"
        }
    }
}

# 啟動 Gateway
function Start-Gateway {
    Write-Info "正在啟動 OpenClaw Gateway..."
    
    $gatewayScript = Join-Path $SCRIPT_DIR "openclaw-guardian.sh"
    if (Test-Path $gatewayScript) {
        # Try WSL or Git Bash
        $bash = Get-Command bash -ErrorAction SilentlyContinue
        if ($bash) {
            Start-Process -FilePath $bash.Source -ArgumentList $gatewayScript -NoNewWindow
            Start-Sleep 2
            if (Test-GatewayRunning) {
                Write-Info "Gateway 啟動成功 (PID: $(Get-GatewayPID))"
                return
            }
        }
        Write-Warn "無法啟動，請手動執行: bash $gatewayScript"
    } else {
        Write-Error "找不到啟動腳本"
    }
}

# 停止 Gateway
function Stop-Gateway {
    $pid = Get-GatewayPID
    if ($pid) {
        Write-Info "正在停止 Gateway (PID: $pid)..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep 1
        if (-not (Test-GatewayRunning)) {
            Write-Info "Gateway 已停止"
        }
    } else {
        Write-Warn "Gateway 未執行"
    }
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════╗"
    Write-Host "║     🦞 OpenClaw 整合啟動器 v2.0                   ║"
    Write-Host "╠══════════════════════════════════════════════════════╣"
    Write-Host "║  1. 啟動服務                                        ║"
    Write-Host "║  2. 停止服務                                        ║"
    Write-Host "║  3. 狀態查看                                        ║"
    Write-Host "║  4. 重新啟動                                        ║"
    Write-Host "║  0. 離開                                           ║"
    Write-Host "╚══════════════════════════════════════════════════════╝"
    Write-Host ""
}

# 主程式
$running = $false
while ($true) {
    Show-Menu
    $running = Test-GatewayRunning
    if ($running) {
        Write-Info "Gateway 執行中 (PID: $(Get-GatewayPID))"
    } else {
        Write-Warn "Gateway 已停止"
    }
    
    $choice = Read-Host "請選擇 [0-4]"
    
    switch ($choice) {
        "1" { Start-Gateway }
        "2" { Stop-Gateway }
        "3" { Show-Status; Read-Host "按 Enter 繼續" }
        "4" { Stop-Gateway; Start-Sleep 1; Start-Gateway }
        "0" { Write-Info "再見！"; break }
        default { Write-Warn "無效選項" }
    }
    
    if ($choice -ne "3" -and $choice -ne "0") {
        Start-Sleep 1
    }
}
