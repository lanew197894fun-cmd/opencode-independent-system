# ════════════════════════════════════════════════════════════════════════
# ║  🧠 Ollama 模型優化腳本 (PowerShell)                              ║
# ║  修復：回答停頓、只給程式碼、偏好回覆                              ║
# ║  與 PS5/PS7 相容                                                 ║
# ════════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 Ollama 本地模型的優化工具，解決模型常見問題：
#   - 回答停頓、不連貫
#   - 只給程式碼不解釋
#   - 回覆不符合用戶偏好
#
# 使用方法：
#   .\ollama-tuner.ps1 - 啟動互動選單
#
# 功能選項：
#   [1] 測試對話 - 輸入問題測試模型回覆
#   [2] 顯示配置 - 查看當前優化參數
#   [3] 調整參數 - 修改 temperature 等參數
#   [4] 設定用戶偏好 - 語言、風格、詳細程度
#   [5] 安裝推薦模型 - 顯示推薦模型列表
#   [0] 離開
#
# 優化參數：
#   temperature   - 回應創造度 (0-1, 預設 0.7)
#   num_predict   - 最大 tokens (預設 2048)
#   top_p         - 多樣性控制 (預設 0.9)
#   top_k         - 精確度控制 (預設 40)
#
# 系統提示詞：
#   腳本內建系統提示詞，要求模型：
#   - 先用日常語言解釋
#   - 不要直接給程式碼 (除非用戶要求)
#   - 保持對話順暢
#   - 記住用戶偏好
#
# 依賴：
#   - PowerShell 5.1+ 或 7+
#   - Ollama 服務運行中 (localhost:11434)
#   - 已安裝模型 (llama3.1, qwen2.5 等)
#
# ════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "[✗] $m" -ForegroundColor Red }
function Write-Cyan { param($m) Write-Host $m -ForegroundColor Cyan }

# 系統提示詞 - 解決只給程式碼問題
$SystemPrompt = @"
你是一個友善且有用的AI助手。請遵守以下規則：

1. 回答問題時，先用簡單的日常語言解釋
2. 不要直接給程式碼，除非用戶明確要求
3. 如果需要提供程式碼，先解釋在做什麼
4. 回答要完整，不要只給結論
5. 用戶問問題時，先理解需求再回答
6. 如果用戶只說"幫我"，請主動詢問具體需求
7. 保持對話順暢，不要突然停止
8. 用戶偏好回覆會記住並套用
"@

# 優化參數
$OllamaConfig = @{
    # 回應創造度 (0-1, 越高越有創意)
    "temperature" = 0.7
    
    # 最大 tokens
    "num_predict" = 2048
    
    # 停頓閾值
    "pause" = "<|im_end|>"
    
    # top p (多樣性)
    "top_p" = 0.9
    
    # top k (精確度)
    "top_k" = 40
}

# 調用模型
function Invoke-Model {
    param(
        [string]$Model,
        [string]$Message
    )
    
    $body = @{
        model = $Model
        messages = @(
            @{ role = "system"; content = $SystemPrompt }
            @{ role = "user"; content = $Message }
        )
        stream = $false
        temperature = $OllamaConfig.temperature
        num_predict = $OllamaConfig.num_predict
        top_p = $OllamaConfig.top_p
        top_k = $OllamaConfig.top_k
    } | ConvertTo-Json -Depth 5
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/chat" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 120
        
        return $response.message.content
    }
    catch {
        Write-Err "錯誤: $_"
        return $null
    }
}

# 測試對話
function Test-Chat {
    Write-Host ""
    Write-Cyan " 測試對話 - 輸入問題"
    Write-Host ""
    
    $model = Read-Host "使用模型 (直接 Enter 使用預設)"
    if ([string]::IsNullOrEmpty($model)) { $model = "llama3.1" }
    
    Write-Host ""
    Write-Host "輸入問題 (輸入 'exit' 離開):" -ForegroundColor Yellow
    
    while ($true) {
        $msg = Read-Host "你"
        
        if ($msg -eq "exit") { break }
        if ([string]::IsNullOrEmpty($msg)) { continue }
        
        Write-Host ""
        Write-Info "AI 回覆:"
        Write-Host ""
        
        $reply = Invoke-Model -Model $model -Message $msg
        
        if ($reply) {
            Write-Host $reply
        }
        
        Write-Host ""
    }
}

# 設定用戶偏好
$UserPreferences = @{
    "language" = "繁體中文"
    "style" = "friendly"
    "code_explanation" = $true
    "detail_level" = "medium"
}

# 顯示配置
function Show-Config {
    Write-Host ""
    Write-Cyan " 當前配置"
    Write-Host ""
    Write-Host " 模型溫度: $($OllamaConfig.temperature) (0-1)"
    Write-Host " 最大 tokens: $($OllamaConfig.num_predict)"
    Write-Host " Top P: $($OllamaConfig.top_p)"
    Write-Host " Top K: $($OllamaConfig.top_k)"
    Write-Host ""
    Write-Host " 用戶偏好:"
    Write-Host "  語言: $($UserPreferences.language)"
    Write-Host "  風格: $($UserPreferences.style)"
    Write-Host "  詳細程度: $($UserPreferences.detail_level)"
    Write-Host ""
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Cyan @"
 ╔═══════════════════════════════════════════════════════════════╗
 ║     🧠 Ollama 模型優化工具                                 ║
 ╚═══════════════════════════════════════════════════════════════╝
"@
    Write-Host ""
    Write-Host " [1] 測試對話"
    Write-Host " [2] 顯示配置"
    Write-Host " [3] 調整參數"
    Write-Host " [4] 設定用戶偏好"
    Write-Host " [5] 安裝推薦模型"
    Write-Host " [0] 離開"
    Write-Host ""
}

# 主程式
while ($true) {
    Show-Menu
    
    $choice = Read-Host "請選擇 [0-5]"
    
    switch ($choice) {
        "1" { Test-Chat }
        "2" { Show-Config; Read-Host "按 Enter 繼續" }
        "3" {
            Write-Host ""
            Write-Host " 調整溫度 (0-1, 預設 0.7):" -ForegroundColor Yellow
            $temp = Read-Host "輸入值"
            if ($temp -match "^\d+(\.\d+)?$" -and [double]$temp -le 1) {
                $OllamaConfig.temperature = [double]$temp
                Write-Info "已設定溫度: $temp"
            }
            Read-Host "按 Enter 繼續"
        }
        "4" {
            Write-Host ""
            Write-Host " 選擇語言:" -ForegroundColor Yellow
            Write-Host "  [1] 繁體中文"
            Write-Host "  [2] 簡體中文"
            Write-Host "  [3] English"
            $lang = Read-Host "選擇 [1-3]"
            $UserPreferences.language = @("繁體中文", "簡體中文", "English")[$lang - 1]
            Write-Info "已設定語言: $($UserPreferences.language)"
            Read-Host "按 Enter 繼續"
        }
        "5" {
            Write-Host ""
            Write-Cyan " 推薦安裝的模型:"
            Write-Host ""
            Write-Host " 對話: llama3.1, qwen2.5:7b"
            Write-Host " 程式: qwen2.5-coder:14b"
            Write-Host " 視覺: llava, qwen2-vl"
            Write-Host ""
            Write-Host " 安裝指令:"
            Write-Host "  ollama pull llama3.1" -ForegroundColor Cyan
            Write-Host "  ollama pull qwen2.5:7b" -ForegroundColor Cyan
            Write-Host "  ollama pull llava" -ForegroundColor Cyan
            Read-Host "按 Enter 繼續"
        }
        "0" { Write-Host "再見！"; break }
        default { Write-Warn "無效選項" }
    }
}
