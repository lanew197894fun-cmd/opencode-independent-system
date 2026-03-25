#!/usr/bin/env bash
set -eo pipefail

NO_OLLAMA="${NO_OLLAMA:-false}"
NO_JI="${NO_JI:-false}"
AUTO_OPEN="${AUTO_OPEN:-false}"
PORT="${PORT:-3000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="/tmp/opencode_web_ji.pid"

info() { echo -e "${BLUE}ℹ $1${NC}"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

show_help() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         🚀 OpenCode 啟動腳本                      ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}🎯 快速使用:${NC}"
    echo "   ./opencode-dev-start.sh web    # 網頁版 (推薦)"
    echo "   ./opencode-dev-start.sh cli    # 終端版"
    echo ""
    echo -e "${CYAN}📋 完整選項:${NC}"
    echo "   start           啟動服務 (預設)"
    echo "   stop            停止服務"
    echo "   restart         重新啟動"
    echo "   status          查看狀態"
    echo "   -p <port>       指定端口"
    echo "   -h, --help      顯示說明"
    echo ""
    echo -e "${YELLOW}💡 提示: 直接輸入 web 或 cli 即可啟動！${NC}"
    echo ""
}

cleanup() {
    info "正在停止服務..."
    pkill -f "opencode serve" 2>/dev/null || true
    pkill -f "independent-architecture" 2>/dev/null || true
    pkill -f "bun run dev:desktop" 2>/dev/null || true
    rm -f "$PID_FILE"
    success "服務已停止"
    exit 0
}

check_status() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}              📊 OpenCode 服務狀態${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    
    echo -e "${CYAN}🌐 網頁服務:${NC}"
    if pgrep -f "opencode serve" > /dev/null; then
        WEB_PID=$(pgrep -f "opencode serve" | head -1)
        echo -e "  ${GREEN}● 執行中${NC} (PID: $WEB_PID)"
    else
        echo -e "  ${RED}● 未執行${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}💻 終端服務:${NC}"
    if pgrep -f "independent-architecture" > /dev/null; then
        CLI_PID=$(pgrep -f "independent-architecture" | head -1)
        echo -e "  ${GREEN}● 執行中${NC} (PID: $CLI_PID)"
    else
        echo -e "  ${RED}● 未執行${NC}"
    fi
    echo ""
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

do_start() {
    local MODE="${1:-all}"
    local BACKGROUND="${2:-false}"
    
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         🚀 OpenCode 啟動中...                         ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if ! command -v wl-copy &> /dev/null && ! command -v xclip &> /dev/null; then
        warn "缺少剪貼簿工具"
    fi
    
    if [ "$NO_OLLAMA" != "true" ]; then
        if ! pgrep -x "ollama" > /dev/null; then
            info "啟動 Ollama..."
            ollama serve &
            sleep 3
        fi
        info "Ollama 模型:"
        ollama list 2>/dev/null | grep -v "NAME" | head -3
    fi
    
    if [ "$MODE" = "web" ] || [ "$MODE" = "all" ]; then
        echo ""
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}  🌐 啟動網頁服務${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        
        cd "$SCRIPT_DIR"
        
        # 檢查端口是否已被佔用
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            success "網頁服務已在運行中"
        else
            nohup opencode serve --port "$PORT" --hostname "0.0.0.0" > /tmp/opencode.log 2>&1 &
            sleep 3
            
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "200" ]; then
                success "網頁服務啟動成功"
            else
                error "網頁服務啟動失敗"
                echo -e "${YELLOW}💡 請先停止服務: ./opencode-dev-start.sh stop${NC}"
            fi
        fi
        echo -e "  ${GREEN}👉 http://localhost:$PORT${NC}"
    fi
    
    if [ "$MODE" = "cli" ] || [ "$MODE" = "all" ]; then
        echo ""
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        echo -e "${CYAN}  💻 啟動終端服務${NC}"
        echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
        
        cd "$SCRIPT_DIR/independent-architecture"
        nohup bun run start.js > /tmp/independent-architecture.log 2>&1 &
        sleep 2
        success "終端服務已啟動"
    fi
    
    echo ""
    echo -e "${GREEN}✅ 服務已在背景運行！${NC}"
    echo -e "   查看狀態: ./opencode-dev-start.sh status"
    echo -e "   停止服務: ./opencode-dev-start.sh stop"
    echo ""
    
    # 直接退出，讓服務在背景運行
    exit 0
}

COMMAND="${1:-help}"
MODE="all"

case "$COMMAND" in
    web) MODE="web"; COMMAND="start" ;;
    cli) MODE="cli"; COMMAND="start" ;;
    all) MODE="all"; COMMAND="start" ;;
esac

case "$COMMAND" in
    start)
        do_start "$MODE" "true"
        ;;
    stop)
        cleanup
        exit 0
        ;;
    restart)
        cleanup
        sleep 2
        do_start "$MODE"
        ;;
    status)
        check_status
        ;;
    help|-h|--help)
        show_help
        ;;
    *)
        error "未知選項: $COMMAND"
        show_help
        exit 1
        ;;
esac
