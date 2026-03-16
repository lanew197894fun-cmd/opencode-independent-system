#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="/tmp/opencode_web_ji.pid"
LOG_FILE="/tmp/opencode_web_ji.log"

info() { echo -e "${BLUE}ℹ $1${NC}"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

show_help() {
    echo "OpenCode Web + 計散機 啟動腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  start           啟動服務 (預設)"
    echo "  stop            停止服務"
    echo "  restart         重新啟動服務"
    echo "  status          查看服務狀態"
    echo "  -p, --port      指定連接埠 (預設: 3000)"
    echo "  -s, --password  設定伺服器密碼"
    echo "  --no-ollama     不自動啟動 Ollama"
    echo "  --open          啟動後自動開啟瀏覽器"
    echo "  --no-ji         不啟動計散機"
    echo "  -h, --help      顯示說明"
    echo ""
    echo "範例:"
    echo "  $0                    # 啟動 Web + 計算機"
    echo "  $0 -p 8080           # 使用連接埠 8080"
    echo "  $0 start             # 啟動服務"
    echo "  $0 stop              # 停止服務"
    echo "  $0 restart           # 重新啟動"
}

cleanup() {
    info "正在停止服務..."
    
    if [ -f "$PID_FILE" ]; then
        MAIN_PID=$(cat "$PID_FILE")
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            kill "$MAIN_PID" 2>/dev/null || true
            sleep 1
            kill -9 "$MAIN_PID" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    
    pkill -f "opencode serve" 2>/dev/null || true
    pkill -f "ji-san-ji" 2>/dev/null || true
    pkill -f "bun run start.js" 2>/dev/null || true
    
    success "服務已停止"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

check_status() {
    if [ -f "$PID_FILE" ]; then
        MAIN_PID=$(cat "$PID_FILE")
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            echo -e "${GREEN}● 服務執行中 (PID: $MAIN_PID)${NC}"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    echo -e "${RED}● 服務未執行${NC}"
    return 1
}

do_start() {
    if [ -f "$PID_FILE" ]; then
        MAIN_PID=$(cat "$PID_FILE")
        if kill -0 "$MAIN_PID" 2>/dev/null; then
            warn "服務已經在執行中 (PID: $MAIN_PID)"
            return 1
        else
            rm -f "$PID_FILE"
        fi
    fi

    PORT="${OPENCODE_PORT:-3000}"
    NO_OLLAMA=false
    AUTO_OPEN=false
    NO_JI=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            -s|--password)
                export OPENCODE_SERVER_PASSWORD="$2"
                shift 2
                ;;
            --no-ollama)
                NO_OLLAMA=true
                shift
                ;;
            --open)
                AUTO_OPEN=true
                shift
                ;;
            --no-ji)
                NO_JI=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         OpenCode Web + 計算機系統 v1.0.0                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    info "清理舊進程..."
    pkill -f "opencode serve" 2>/dev/null || true
    pkill -f "ji-san-ji" 2>/dev/null || true
    sleep 1

    info "檢查剪貼簿工具..."
    if ! command -v wl-copy &> /dev/null && ! command -v xclip &> /dev/null && ! command -v xsel &> /dev/null; then
        warn "缺少剪貼簿工具，安裝中..."
        sudo apt update && sudo apt install -y wl-clipboard xclip 2>/dev/null || true
    fi

    if [ "$NO_OLLAMA" = false ]; then
        if ! pgrep -x "ollama" > /dev/null; then
            info "啟動 Ollama..."
            ollama serve &
            sleep 3
        fi
        info "Ollama 可用模型:"
        ollama list 2>/dev/null | grep -v "NAME" | head -5
    fi

    info "檢查伺服器設定..."
    if [ -n "${OPENCODE_SERVER_PASSWORD:-}" ]; then
        success "密碼已設定"
    else
        warn "未設定密碼，伺服器無保護"
        echo -e "  ${YELLOW}提示: 使用 -s <密碼> 設定密碼${NC}"
    fi

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  🎯 啟動服務"
    echo "════════════════════════════════════════════════════════════"

    info "啟動 OpenCode Web 服務..."
    cd "/media/reamaster/ab0f525c-ba17-43cf-baaa-dc9f1e5148d9/opencode/opencode independent system"
    nohup opencode serve --port "$PORT" --hostname "0.0.0.0" --print-logs > /tmp/opencode.log 2>&1 &

    sleep 3

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
        success "OpenCode Web 啟動成功"
    else
        error "OpenCode Web 啟動失敗"
        tail -30 /tmp/opencode.log
        exit 1
    fi

    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  🌐 訪問地址"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo -e "  ${GREEN}本機訪問:${NC} http://localhost:$PORT"

    for ip in $(hostname -I 2>/dev/null | tr ' ' '\n'); do
        if [[ ! "$ip" =~ ^172\.(1[7-9]|2[0-9]|3[0-1])\. ]]; then
            echo -e "    http://$ip:$PORT"
        fi
    done

    TAILSCALE_IPV4=$(ip addr show tailscale0 2>/dev/null | grep inet | grep -v '::' | awk '{print $2}' | cut -d'/' -f1)
    if [ -n "$TAILSCALE_IPV4" ]; then
        echo -e "    ${CYAN}⚡ Tailscale: http://$TAILSCALE_IPV4:$PORT${NC}"
    fi

    IPV6_GLOBAL=$(ip addr show tailscale0 2>/dev/null | grep 'inet6.*global' | awk '{print $2}' | cut -d'/' -f1)
    if [ -n "$IPV6_GLOBAL" ]; then
        echo -e "    ${CYAN}⚡ IPv6: http://[$IPV6_GLOBAL]:$PORT${NC}"
    fi

    echo ""

    if [ "$NO_JI" = false ]; then
        info "啟動計算機系統..."
        cd "/media/reamaster/ab0f525c-ba17-43cf-baaa-dc9f1e5148d9/opencode/opencode independent system/ji-san-ji"
        nohup bun run start.js > /tmp/ji-san-ji.log 2>&1 &
        sleep 2
        success "計算機已啟動"
    fi

    echo ""

    if [ "$AUTO_OPEN" = true ]; then
        info "開啟瀏覽器..."
        sleep 1
        xdg-open "http://localhost:$PORT" 2>/dev/null || \
        sensible-browser "http://localhost:$PORT" 2>/dev/null || \
        echo "無法自動開啟瀏覽器，請手動訪問"
    fi

    echo ""
    echo -e "${GREEN}✅ 系統啟動完成！${NC}"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "  📋 可用功能:"
    echo "     • Web 模式支援圖片上傳和截圖"
    echo "     • Ollama 本地模型 (qwen3, deepseek-r1, moondream)"
    echo "     • 計散機知識庫搜尋"
    echo "     • 詐騙訊息偵測"
    echo "     • VPN × 24靈 安全防護"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 可停止服務${NC}"
    echo ""

    echo $$ > "$PID_FILE"

    while true; do
        sleep 1
    done
}

COMMAND="${1:-start}"
shift || true

case "$COMMAND" in
    start)
        do_start "$@"
        ;;
    stop)
        cleanup
        ;;
    restart)
        cleanup
        sleep 2
        do_start "$@"
        ;;
    status)
        check_status
        ;;
    -h|--help)
        show_help
        ;;
    *)
        error "未知選項: $COMMAND"
        show_help
        exit 1
        ;;
esac
