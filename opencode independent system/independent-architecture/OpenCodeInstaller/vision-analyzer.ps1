# ═══════════════════════════════════════════════════════════════════════
# ║  🔍 看圖解說模型 (PowerShell)                                   ║
# ║  分析圖片並給出說明                                             ║
# ║  與 PS5/PS7 相容                                               ║
# ═══════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"

# 顏色
function Write-Info { param($m) Write-Host "[✓] $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "[!] $m" -ForegroundColor Yellow }
function Write-Err { param($m) Write-Host "[✗] $m" -ForegroundColor Red }
function Write-Cyan { param($m) Write-Host $m -ForegroundColor Cyan }

# 支援的模型
$VisionModels = @{
    "openai" = "gpt-4o"
    "anthropic" = "claude-3-5-sonnet"
    "google" = "gemini-2.0-flash-exp"
    "ollama" = "llama3.2-vision"
}

# 選擇模型供應商
function Select-Provider {
    Write-Host ""
    Write-Host " 選擇視覺模型供應商:" -ForegroundColor Yellow
    Write-Host ""
    
    $i = 1
    foreach ($key in $VisionModels.Keys) {
        Write-Host "  [$i] $key ($($VisionModels[$key]))"
        $i++
    }
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-$($VisionModels.Count)]"
    $keys = @($VisionModels.Keys)
    return $keys[$choice - 1]
}

# 分析圖片 - OpenAI
function Analyze-OpenAI {
    param($ImagePath, $ApiKey)
    
    $body = @{
        model = "gpt-4o"
        messages = @(
            @{
                role = "user"
                content = @(
                    @{ type = "text"; text = "請詳細描述這張圖片" }
                    @{ type = "image_url"; image_url = @{ url = "data:image/jpeg;base64,$( [Convert]::ToBase64String( (Get-Content $ImagePath -RawByteArray ) ) )" } }
                )
            }
        )
        max_tokens = 1000
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "https://api.openai.com/v1/chat/completions" `
        -Method Post `
        -Headers @{ "Authorization" = "Bearer $ApiKey" } `
        -ContentType "application/json" `
        -Body $body
    
    return $response.choices[0].message.content
}

# 分析圖片 - Ollama (本地)
function Analyze-Ollama {
    param($ImagePath, $Prompt = "請詳細描述這張圖片")
    
    $imageBase64 = [Convert]::ToBase64String( (Get-Content $ImagePath -RawByteArray) )
    
    $body = @{
        model = "llama3.2-vision"
        prompt = $Prompt
        images = @($imageBase64)
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
    
    return $response.response
}

# 選擇圖片
function Select-Image {
    Write-Host ""
    Write-Host " 選擇圖片分析模式:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] 選擇圖片檔案"
    Write-Host "  [2] 輸入圖片網址"
    Write-Host "  [3] 截圖分析 (剪貼簿)"
    Write-Host ""
    
    $choice = Read-Host "請選擇 [1-3]"
    
    switch ($choice) {
        "1" {
            $path = Read-Host "輸入圖片路徑"
            if (Test-Path $path) {
                return @{ type = "file"; path = $path }
            } else {
                Write-Err "檔案不存在: $path"
                return $null
            }
        }
        "2" {
            $url = Read-Host "輸入圖片網址"
            return @{ type = "url"; url = $url }
        }
        "3" {
            return @{ type = "clipboard" }
        }
    }
}

# 主選單
function Show-Menu {
    Clear-Host
    Write-Host ""
    Write-Cyan @"
 ╔═══════════════════════════════════════════════════════════════╗
 ║                                                               ║
 ║   🔍 看圖解說模型                                            ║
 ║                                                               ║
 ╚═══════════════════════════════════════════════════════════════╝
"@
    Write-Host ""
    Write-Host "  [1] 選擇圖片並分析"
    Write-Host "  [2] 設定預設模型"
    Write-Host "  [3] 測試模型連線"
    Write-Host "  [0] 離開"
    Write-Host ""
}

# 主程式
while ($true) {
    Show-Menu
    
    $choice = Read-Host "請選擇 [0-3]"
    
    switch ($choice) {
        "1" {
            $image = Select-Image
            if ($image) {
                $provider = Select-Provider
                
                Write-Host ""
                Write-Info "正在分析圖片..."
                Write-Host ""
                
                if ($provider -eq "ollama") {
                    $result = Analyze-Ollama -ImagePath $image.path
                } else {
                    Write-Warn "需要 API Key，請先設定"
                }
                
                Write-Host $result
                Write-Host ""
            }
            Read-Host "按 Enter 繼續"
        }
        "2" {
            $provider = Select-Provider
            Write-Info "已選擇: $provider ($($VisionModels[$provider]))"
            Read-Host "按 Enter 繼續"
        }
        "3" {
            # 測試 Ollama
            try {
                $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 3
                Write-Info "Ollama: 連線成功"
                $response.models | Where-Object { $_.name -match "vision" } | ForEach-Object {
                    Write-Host "  - $($_.name)"
                }
            } catch {
                Write-Err "Ollama: 未連線"
            }
            Read-Host "按 Enter 繼續"
        }
        "0" {
            Write-Host "再見！"
            break
        }
        default {
            Write-Warn "無效選項"
        }
    }
}
