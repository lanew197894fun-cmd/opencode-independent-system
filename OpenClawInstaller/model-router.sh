#!/bin/bash
#
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                                                                           ║
# ║   🧠 OpenClaw 智慧模型路由器                                             ║
# ║   自動根據問題類型選擇合適的模型                                          ║
# ║                                                                           ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# 說明：
#   這是 OpenClaw 的智慧模型路由器腳本，根據用戶輸入的問題類型，
#   自動選擇最適合的 AI 模型處理。
#
# 功能：
#   - 意圖偵測：分析問題類型 (程式碼/一般對話/快速回覆)
#   - 模型切換：自動切換到最適合的模型
#   - 互動模式：對話式介面
#
# 使用方法：
#   ./model-router.sh <問題>           - 直接傳送問題並獲取回覆
#   ./model-router.sh --interactive    - 互動對話模式
#   ./model-router.sh --status         - 查看當前使用模型
#   ./model-router.sh --help           - 顯示幫助
#
# 模型配置：
#   code    → ollama/qwen2.5-coder:3b (程式碼專家)
#   general → ollama/llama3           (一般對話)
#   fast    → ollama/llama3:70b       (快速推理)
#
# 關鍵詞對應：
#   - 程式碼關鍵詞：代碼、程式、code、function、class、bug、sql 等
#   - 一般對話：天氣、新聞、幫我、什麼是、怎麼等
#
# 環境需求：
#   - OpenClaw 已安裝 (openclaw 命令可用)
#   - Ollama 服務運行中 (localhost:11434)
#   - 已下載相關模型
#
# ════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 配置
CONFIG_DIR="$HOME/.openclaw"
ENV_FILE="$CONFIG_DIR/env"
OPENCLAW_JSON="$CONFIG_DIR/openclaw.json"

# 可用模型配置
declare -A MODELS=(
    ["code"]="ollama/qwen2.5-coder:3b"
    ["general"]="ollama/llama3"
    ["fast"]="ollama/llama3:70b"
)

# 關鍵詞映射
CODE_KEYWORDS="代碼|程式|code|program|function|class|def|var|let|const|if|else|for|while|return|import|export|api|bug|error|fix|debug|sql|query|script|shell|bash|python|javascript|typescript|java|go|rust|html|css|json|yaml|docker|kubernetes|linux|git|deploy|建置|編譯|開發|程式設計|演算法|資料結構"
GENERAL_KEYWORDS="天氣|新聞|天|你好|早安|晚安|幫我|告訴我|什麼是|怎麼|如何|為什麼|介紹|說明|解釋|討論|聊天|推薦|建議|意見|想法|天氣預報|匯率|計算|翻譯|summary|explain|what|how|why|tell|help|weather|news|hello|hi|good|morning|evening"

# 檢測問題類型
detect_intent() {
    local message="$1"
    
    # 轉為小寫進行匹配
    local lower_message=$(echo "$message" | tr '[:upper:]' '[:lower:]')
    
    # 檢測程式碼相關
    if echo "$lower_message" | grep -qiE "$CODE_KEYWORDS"; then
        echo "code"
        return
    fi
    
    # 檢測一般對話
    if echo "$lower_message" | grep -qiE "$GENERAL_KEYWORDS"; then
        echo "general"
        return
    fi
    
    # 預設為一般對話
    echo "general"
}

# 獲取模型描述
get_model_description() {
    local model="$1"
    case "$model" in
        *qwen*)
            echo "🧠 Qwen2.5-Coder (程式碼專家)"
            ;;
        *llama3:70b*)
            echo "🦙 Llama 3 70B (快速推理)"
            ;;
        *)
            echo "🦙 Llama 3 (一般對話)"
            ;;
    esac
}

# 切換模型
switch_model() {
    local model="$1"
    
    # 載入環境變數
    [ -f "$ENV_FILE" ] && source "$ENV_FILE"
    
    # 切換模型
    if command -v openclaw &> /dev/null; then
        openclaw models set "$model" 2>/dev/null || openclaw config set models.default "$model" 2>/dev/null
    fi
    
    echo -e "${CYAN}模型已切換至: $(get_model_description "$model")${NC}"
}

# 發送訊息
send_message() {
    local message="$1"
    
    # 載入環境變數
    [ -f "$ENV_FILE" ] && source "$ENV_FILE"
    
    # 發送訊息（使用 openclaw agent）
    openclaw agent --local --message "$message" 2>&1
}

# 主流程
main() {
    echo -e "${CYAN}"
    cat << 'EOF'
    
     ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗██╗      █████╗ ██╗    ██╗
    ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██║     ██╔══██╗██║    ██║
    ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║     ██║     ███████║██║ █╗ ██║
    ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║     ██║     ██╔══██║██║███╗██║
    ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╗███████╗██║  ██║╚███╔███╔╝
     ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝   
                                                             
               🧠 智慧模型路由器 v1.0
                                             
EOF
    echo -e "${NC}"
    
    # 檢查 OpenClaw 是否安裝
    if ! command -v openclaw &> /dev/null; then
        echo -e "${RED}錯誤: OpenClaw 未安裝，請先執行 install.sh${NC}"
        exit 1
    fi
    
    # 檢查參數
    if [ -z "$1" ]; then
        echo -e "${YELLOW}用法:${NC}"
        echo "  $0 <問題>           - 直接傳送問題"
        echo "  $0 --interactive    - 互動模式"
        echo "  $0 --status         - 查看當前模型"
        echo ""
        echo -e "${YELLOW}可用模型:${NC}"
        echo "  • code    → ollama/qwen2.5-coder:3b (程式碼)"
        echo "  • general → ollama/llama3 (一般對話)"
        echo "  • fast    → ollama/llama3:70b (快速推理)"
        exit 0
    fi
    
    # 處理命令
    case "$1" in
        --status)
            echo -e "${CYAN}目前使用模型:${NC}"
            openclaw models status 2>/dev/null || openclaw config get models.default 2>/dev/null || echo "未設定"
            exit 0
            ;;
        --interactive)
            echo -e "${CYAN}進入互動模式，輸入 'exit' 結束${NC}"
            echo ""
            while true; do
                echo -en "${GREEN}You${NC}: "
                read -r message
                
                [ "$message" = "exit" ] && break
                [ -z "$message" ] && continue
                
                # 偵測意圖
                intent=$(detect_intent "$message")
                model="${MODELS[$intent]}"
                
                # 切換模型
                switch_model "$model"
                
                # 發送訊息
                echo ""
                echo -e "${BLUE}Assistant:${NC}"
                send_message "$message"
                echo ""
            done
            exit 0
            ;;
        --)
            shift
            message="$*"
            ;;
        *)
            message="$*"
            ;;
    esac
    
    # 偵測意圖並選擇模型
    intent=$(detect_intent "$message")
    model="${MODELS[$intent]}"
    
    echo -e "${YELLOW}偵測到問題類型: ${intent}${NC}"
    switch_model "$model"
    echo ""
    
    # 發送訊息
    echo -e "${BLUE}Assistant:${NC}"
    send_message "$message"
}

main "$@"
