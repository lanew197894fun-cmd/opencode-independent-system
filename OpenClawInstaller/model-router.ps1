# ════════════════════════════════════════════════════════════════════════════
# ║  🧠 OpenClaw 智慧模型路由器 (PowerShell)                           ║
# ║  自動根據問題類型選擇合適的模型                                     ║
# ║  與 PS5/PS7 相容                                                  ║
# ════════════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 OpenClaw 的智慧模型路由器 PowerShell 版本，根據用戶輸入的
#   問題類型和複雜度，自動選擇最適合的 Ollama 模型。
#
# 使用方法：
#   .\model-router.ps1 - 啟動互動選單
#
# 功能選項：
#   [1] 顯示狀態   - 查看模型配置與 Ollama 狀態
#   [2] 測試模型選擇 - 輸入測試訊息看如何選擇模型
#   [3] 設定預設模型 - 顯示配置說明
#   [4] 測試訊息分析 - 顯示偵測到的意圖與複雜度
#   [0] 離開
#
# 模型配置：
#   code    → qwen2.5:14b     (程式碼專家)
#   general → llama3.1        (一般對話)
#   fast    → qwen2.5:7b      (快速回應)
#   large   → qwen2.5:72b     (複雜問題)
#
# 偵測邏輯：
#   1. 意圖偵測：分析關鍵詞判斷問題類型
#      - 程式碼關鍵詞：code, 程式, function, class, bug, sql 等
#      - 一般對話：天氣, 新聞, 幫我, 什麼是 等
#   2. 複雜度分析：根據訊息長度與字數
#      - high:    >500 字元 或 >50 詞
#      - medium: >100 字元 或 >20 詞
#      - low:     其他
#
# 選擇模式：
#   auto   - 根據意圖選擇 (預設)
#   fast   - 始終使用快速模型
#   smart  - 根據複雜度選擇
#
# 依賴：
#   - PowerShell 5.1+ 或 7+
#   - Ollama 服務運行中 (localhost:11434)
#   - 已下載相關模型
#
# ════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

$CONFIG_DIR = "$env:USERPROFILE\.openclaw"
$JSON_FILE = "$CONFIG_DIR\openclaw.json"

# 模型配置 - 改用對話模型
$Models = @{
    "code" = "qwen2.5:14b"           # 程式碼
    "general" = "llama3.1"            # 一般對話
    "fast" = "qwen2.5:7b"             # 快速回應
    "large" = "qwen2.5:72b"           # 複雜問題
}

# 關鍵詞映射
$CodeKeywords = @("code", "程式", "代碼", "function", "class", "def", "var", "import", "export", "bug", "error", "fix", "sql", "python", "javascript", "java", "html", "css", "json", "docker", "git", "建置", "編譯", "開發")
$GeneralKeywords = @("天氣", "新聞", "你好", "早安", "晚安", "幫我", "什麼是", "怎麼", "如何", "為什麼", "介紹", "說明", "解釋", "天氣預報", "匯率", "計算", "翻譯", "hello", "help", "what", "how", "why", "weather")

# 檢測問題類型
function Get-Intent {
    param([string]$Message)
    
    $lower = $Message.ToLower()
    
    # 檢測程式碼相關
    foreach ($kw in $CodeKeywords) {
        if ($lower -match $kw) {
            return "code"
        }
    }
    
    # 檢測一般對話
    foreach ($kw in $GeneralKeywords) {
        if ($lower -match $kw) {
            return "general"
        }
    }
    
    return "fast"  # 預設使用快速模型
}

# 複雜度分析
function Get-Complexity {
    param([string]$Message)
    
    $length = $Message.Length
    $words = ($Message -split '\s+').Count
    
    # 長度超過 500 字或 50 個詞視為複雜
    if ($length -gt 500 -or $words -gt 50) {
        return "high"
    }
    elseif ($length -gt 100 -or $words -gt 20) {
        return "medium"
    }
    
    return "low"
}

# 選擇模型
function Select-Model {
    param(
        [string]$Message,
        [string]$Mode = "auto"  # auto, fast, balanced, smart
    )
    
    $intent = Get-Intent -Message $Message
    $complexity = Get-Complexity -Message $Message
    
    switch ($Mode) {
        "fast" {
            return $Models["fast"]
        }
        "smart" {
            # 複雜問題用大模型
            if ($complexity -eq "high") {
                return $Models["large"]
            }
            elseif ($complexity -eq "medium") {
                return $Models["general"]
            }
            return $Models["fast"]
        }
        default {  # auto
            return $Models[$intent]
        }
    }
}

# 測試模型
function Test-Model {
    param([string]$Model)
    
    Write-Host "測試模型: $Model" -ForegroundColor Cyan
    
    # 測試對話
    $result = Invoke-Ollama -Model $Model -Message "你好，請用一般對話方式回答"
    Write-Host $result
    
    return $true
}

# 調用 Ollama
function Invoke-Ollama {
    param(
        [string]$Model,
        [string]$Message
    )
    
    $systemPrompt = @"
你是一個友善的AI助手。請用一般對話方式回答問題，不要只給程式碼。
除非用戶明確要求，否則不要主動提供程式碼。
回答要簡單明瞭，用日常語言。
"@
    
    $body = @{
        model = $Model
        messages = @(
            @{ role = "system"; content = $systemPrompt }
            @{ role = "user"; content = $Message }
        )
        stream = $false
    } | ConvertTo-Json -Depth 5
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/chat" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 60
        
        return $response.message.content
    }
    catch {
        Write-Err "調用失敗: $_"
        return $null
    }
}

# 顯示配置
function Show-Config {
    Write-Host ""
    Write-Host " 當前模型配置" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($key in $Models.Keys) {
        Write-Host "  $key : $($Models[$key])"
    }
    
    Write-Host ""
}

# 顯示狀態
function Show-Status {
    Show-Config
    
    # 檢查 Ollama
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Host "Ollama: 執行中" -ForegroundColor Green
        $response.models | ForEach-Object { Write-Host "  - $($_.name)" }
    }
    catch {
        Write-Host "Ollama: 未執行" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     🧠 智慧模型路由器                ║" -ForegroundColor Cyan
    Write-Host "╠══════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║  1. 顯示狀態                        ║"
    Write-Host "║  2. 測試模型選擇                   ║"
    Write-Host "║  3. 設定預設模型                   ║"
    Write-Host "║  4. 測試訊息分析                   ║"
    Write-Host "║  0. 離開                           ║"
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# 主程式
while ($true) {
    Show-Menu
    
    $choice = Read-Host "請選擇 [0-4]"
    
    switch ($choice) {
        "1" { Show-Status; Read-Host "按 Enter 繼續" }
        "2" {
            $testMsg = Read-Host "輸入測試訊息"
            $model = Select-Model -Message $testMsg -Mode "smart"
            Write-Host "選擇的模型: $model" -ForegroundColor Green
            Read-Host "按 Enter 繼續"
        }
        "3" {
            Show-Config
            Write-Host "請編輯 $PSCommandPath 修改模型配置" -ForegroundColor Yellow
            Read-Host "按 Enter 繼續"
        }
        "4" {
            $testMsg = Read-Host "輸入測試訊息"
            $intent = Get-Intent -Message $testMsg
            $complexity = Get-Complexity -Message $testMsg
            Write-Host "意圖: $intent" -ForegroundColor Cyan
            Write-Host "複雜度: $complexity" -ForegroundColor Cyan
            Read-Host "按 Enter 繼續"
        }
        "0" { Write-Host "再見！"; break }
        default { Write-Host "無效選項" -ForegroundColor Yellow }
    }
}
