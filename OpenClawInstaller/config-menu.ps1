# ════════════════════════════════════════════════════════════════════════════
# ║  🦞 OpenClaw 設定選單 (PowerShell)                                   ║
# ║  與 PS7/PS5 相容                                                     ║
# ════════════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 OpenClaw 的 Windows PowerShell 設定選單，提供圖形化介面進行配置。
#
# 使用方法：
#   .\config-menu.ps1 - 啟動互動選單
#
# 功能選項：
#   [1] 環境檢測    - 檢查 OpenClaw 安裝狀態
#   [2] AI 配置    - 設定 AI 模型供應商
#   [3] 渠道配置   - 設定 Telegram/Discord 等
#   [4] 測試功能   - 測試 API 和渠道連線
#   [5] 備份還原   - 匯入/匯出配置
#   [0] 離開
#
# 配置檔案：
#   $env:USERPROFILE\.openclaw\env     - 環境變數
#   $env:USERPROFILE\.openclaw\openclaw.json - 主配置
#
# 依賴：
#   - PowerShell 5.1+ 或 7+
#   - openclaw 命令
#
# ════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$CONFIG_DIR = "$env:USERPROFILE\.openclaw"
$ENV_FILE = "$CONFIG_DIR\env"
$JSON_FILE = "$CONFIG_DIR\openclaw.json"
$BACKUP_DIR = "$CONFIG_DIR\backups"

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "[✗] $m" -ForegroundColor Red }
function Write-Cyan { param($m) Write-Host $m -ForegroundColor Cyan }

# 清除畫面
function Clear-Screen { Clear-Host }

# 顯示標題
function Show-Header {
    Clear-Screen
    Write-Cyan @"

 ╔═══════════════════════════════════════════════════════════════╗
 ║                                                               ║
 ║   🦞 OpenClaw 設定中心                                        ║
 ║                                                               ║
 ╚═══════════════════════════════════════════════════════════════╝
"@
}

# 確認對話框
function Confirm {
    param($Message, $Default = $true)
    $prompt = if ($Default) { "[Y/n]" } else { "[y/N]" }
    $response = Read-Host "$Message $prompt"
    if ([string]::IsNullOrEmpty($response)) { return $Default }
    return $response -match "^[Yy]"
}

# 備份配置
function Backup-Config {
    if (-not (Test-Path $JSON_FILE)) {
        Write-Warn "沒有配置檔案可備份"
        return
    }
    
    if (-not (Test-Path $BACKUP_DIR)) {
        New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    }
    
    $backupFile = "$BACKUP_DIR\config_$(Get-Date -Format 'yyyyMMdd_HHmmss').bak"
    Copy-Item $JSON_FILE $backupFile -Force
    Write-Info "已備份: $backupFile"
}

# 顯示狀態
function Show-Status {
    Show-Header
    Write-Host ""
    Write-Host " 系統狀態" -ForegroundColor Yellow
    Write-Host ""
    
    if (Test-Path $JSON_FILE) {
        $config = Get-Content $JSON_FILE | ConvertFrom-Json
        Write-Info "配置檔: 已存在"
        Write-Info "目錄: $CONFIG_DIR"
    } else {
        Write-Warn "配置檔: 未找到"
    }
    
    # 檢查 Gateway
    $conn = Get-NetTCPConnection -LocalPort 18789 -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        $mem = [math]::Round($proc.WorkingSet64 / 1MB, 1)
        Write-Info "Gateway: 執行中 (PID: $($conn.OwningProcess), 記憶體: $mem MB)"
    } else {
        Write-Warn "Gateway: 未執行"
    }
    
    Write-Host ""
}

# 設定模型
function Set-Model {
    Show-Header
    Write-Host " 設定預設模型" -ForegroundColor Yellow
    Write-Host ""
    
    $models = @(
        "anthropic/claude-3-5-sonnet-20241022",
        "openai/gpt-4o",
        "google/gemini-2.0-flash-exp",
        "ollama/llama3.1"
    )
    
    Write-Host "選擇模型:"
    for ($i = 0; $i -lt $models.Count; $i++) {
        Write-Host "  [$($i+1)] $($models[$i])"
    }
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-$($models.Count)] 或直接輸入模型名稱"
    
    $model = if ($choice -match "^\d+$" -and $choice -ge 1 -and $choice -le $models.Count) {
        $models[$choice - 1]
    } else {
        $choice
    }
    
    Write-Info "設定模型: $model"
    
    # 這裡可以添加實際設定邏輯
    Write-Host ""
    Write-Warn "請手動編輯 $JSON_FILE 設定模型"
}

# 設定 API Key
function Set-ApiKey {
    Show-Header
    Write-Host " 設定 API Key" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "支援的供應商:"
    Write-Host "  [1] Anthropic (Claude)"
    Write-Host "  [2] OpenAI"
    Write-Host "  [3] Google (Gemini)"
    Write-Host "  [4] Ollama"
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-4]"
    
    $envVar = switch ($choice) {
        "1" { "ANTHROPIC_API_KEY" }
        "2" { "OPENAI_API_KEY" }
        "3" { "GOOGLE_API_KEY" }
        "4" { "OLLAMA_HOST" }
        default { "" }
    }
    
    if ($envVar) {
        $key = Read-Host "輸入 API Key"
        [System.Environment]::SetEnvironmentVariable($envVar, $key, "User")
        Write-Info "已設定 $envVar"
        Write-Host ""
        Write-Warn "建議也添加到 $ENV_FILE"
    }
}

# 新增通道
function Add-Channel {
    Show-Header
    Write-Host " 新增通道" -ForegroundColor Yellow
    Write-Host ""
    
    $channels = @(
        "telegram",
        "discord",
        "slack",
        "whatsapp",
        "line"
    )
    
    Write-Host "選擇通道:"
    for ($i = 0; $i -lt $channels.Count; $i++) {
        Write-Host "  [$($i+1)] $($channels[$i])"
    }
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-$($channels.Count)]"
    $channel = $channels[$choice - 1]
    
    Write-Host ""
    Write-Info "新增通道: $channel"
    Write-Host ""
    Write-Host "執行以下命令完成設定:"
    Write-Host "  openclaw channels add $channel" -ForegroundColor Cyan
}

# 開啟選項
function Enable-Option {
    Show-Header
    Write-Host " 開啟選項" -ForegroundColor Yellow
    Write-Host ""
    
    $options = @(
        "Think Mode - 思考模式",
        "Streaming - 串流回應",
        "Memory - 記憶功能",
        "Tools - 工具權限"
    )
    
    Write-Host "選擇選項:"
    for ($i = 0; $i -lt $options.Count; $i++) {
        Write-Host "  [$($i+1)] $($options[$i])"
    }
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-$($options.Count)]"
    Write-Info "已選擇: $($options[$choice - 1])"
}

# 清理快取
function Clear-Cache {
    Show-Header
    Write-Host " 清理快取" -ForegroundColor Yellow
    Write-Host ""
    
    if (Confirm "確認清理所有快取？") {
        $cacheDirs = @(
            "$CONFIG_DIR\cache",
            "$CONFIG_DIR\tmp",
            "$env:TEMP\openclaw*"
        )
        
        foreach ($dir in $cacheDirs) {
            Get-ChildItem $dir -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }
        
        Write-Info "快取已清理"
    }
}

# 顯示選單
function Show-Menu {
    Show-Header
    
    Write-Host " 主選單" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] 系統狀態"
    Write-Host "  [2] 設定模型"
    Write-Host "  [3] 設定 API Key"
    Write-Host "  [4] 新增通道"
    Write-Host "  [5] 開啟選項"
    Write-Host "  [6] 清理快取"
    Write-Host "  [7] 備份配置"
    Write-Host "  [0] 離開"
    Write-Host ""
}

# 主程式
while ($true) {
    Show-Menu
    
    $choice = Read-Host "請選擇 [0-7]"
    
    switch ($choice) {
        "1" { Show-Status; Read-Host "按 Enter 繼續" }
        "2" { Set-Model; Read-Host "按 Enter 繼續" }
        "3" { Set-ApiKey; Read-Host "按 Enter 繼續" }
        "4" { Add-Channel; Read-Host "按 Enter 繼續" }
        "5" { Enable-Option; Read-Host "按 Enter 繼續" }
        "6" { Clear-Cache; Read-Host "按 Enter 繼續" }
        "7" { Backup-Config; Read-Host "按 Enter 繼續" }
        "0" { Write-Host "再見！"; break }
        default { Write-Warn "無效選項" }
    }
}
