# ═══════════════════════════════════════════════════════════════════════
# ║  🦞 OpenCode Windows 快速啟動腳本                              ║
# ║  最省資源 • 一鍵啟動 • 狀態監控                                  ║
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$OPENCLAW_DIR = "$env:USERPROFILE\openclaw"
$PORT = 18789

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "[✗] $m" -ForegroundColor Red }

# 檢查 Bun
function Test-Bun {
    $bun = Get-Command bun -ErrorAction SilentlyContinue
    return $null -ne $bun
}

# 檢查 OpenCode 目錄
function Test-OpenCode {
    return Test-Path $OPENCLAW_DIR
}

# 獲取 Gateway PID
function Get-GatewayPID {
    $conn = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) { $conn.OwningProcess } else { $null }
}

# 檢查是否運行中
function Test-Running {
    $pid = Get-GatewayPID
    return $null -ne $pid
}

# 啟動 Gateway
function Start-Gateway {
    Write-Info "正在啟動 OpenCode Gateway..."

    if (-not (Test-OpenCode)) {
        Write-Info "正在下載 OpenCode..."
        git clone https://github.com/openclaw/openclaw.git $OPENCLAW_DIR
    }

    Set-Location $OPENCLAW_DIR
    Write-Info "安裝依賴..."
    bun install

    Write-Info "啟動 Gateway (背景執行)..."
    Start-Process -FilePath "bun" -ArgumentList "run","openclaw.mjs","gateway","start" -WindowStyle Hidden

    Start-Sleep 3

    if (Test-Running) {
        $pid = Get-GatewayPID
        Write-Info "Gateway 啟動成功！ (PID: $pid)"
        Write-Info "訪問 http://localhost:$PORT"
    } else {
        Write-Err "啟動失敗，請檢查日誌"
    }
}

# 停止 Gateway
function Stop-Gateway {
    $pid = Get-GatewayPID
    if ($pid) {
        Write-Info "正在停止 Gateway (PID: $pid)..."
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Start-Sleep 1
        Write-Info "已停止"
    } else {
        Write-Warn "Gateway 未運行"
    }
}

# 顯示狀態
function Show-Status {
    Write-Host ""
    if (Test-Running) {
        $pid = Get-GatewayPID
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        $mem = [math]::Round($proc.WorkingSet64 / 1MB, 1)
        Write-Info "狀態: 執行中"
        Write-Info "PID: $pid"
        Write-Info "記憶體: $mem MB"
        Write-Info "訪問: http://localhost:$PORT"
    } else {
        Write-Warn "狀態: 已停止"
    }
    Write-Host ""
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗"
    Write-Host "║     🦞 OpenCode Windows 啟動器        ║"
    Write-Host "╠══════════════════════════════════════════╣"
    Write-Host "║  1. 啟動服務                          ║"
    Write-Host "║  2. 停止服務                          ║"
    Write-Host "║  3. 查看狀態                          ║"
    Write-Host "║  4. 重新啟動                         ║"
    Write-Host "║  0. 離開                             ║"
    Write-Host "╚══════════════════════════════════════════╝"
    Write-Host ""
}

# 檢查 Bun
if (-not (Test-Bun)) {
    Write-Err "Bun 未安裝！"
    Write-Info "請先安裝 Bun: winget install oven-bun.bun"
    exit 1
}

# 主迴圈
while ($true) {
    Show-Menu

    if (Test-Running) {
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
}
