#!/bin/bash
#
# ═══════════════════════════════════════════════════════════════════════════
# ║  🚀 OpenCode 統一啟動器 v1.0                                          ║
# ║  一站式管理 • 插件系統 • 技能整合                                       ║
# ═══════════════════════════════════════════════════════════════════════════
#
# 使用方法：
#   ./opencode.sh install    - 安裝 OpenCode
#   ./opencode.sh start      - 啟動服務
#   ./opencode.sh stop       - 停止服務
#   ./opencode.sh restart    - 重啟服務
#   ./opencode.sh status     - 查看狀態
#   ./opencode.sh health     - 健康檢查
#   ./opencode.sh guardian   - 守衛系統
#   ./opencode.sh tools      - 工具選單
#   ./opencode.sh help       - 顯示幫助
#
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }
log_step() { echo -e "${CYAN}[➜]${NC} $*"; }

show_banner() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════"
    echo "║         🚀 OpenCode 統一管理系統                ║"
    echo "║         獨立架構 • 插件系統 • 技能整合          ║"
    echo "═══════════════════════════════════════════════════${NC}"
}

show_help() {
    show_banner
    echo ""
    echo "用法: $0 <命令>"
    echo ""
    echo "可用命令:"
    echo "  install     安裝 OpenCode 系統"
    echo "  start       啟動 OpenCode 服務"
    echo "  stop        停止 OpenCode 服務"
    echo "  restart     重啟 OpenCode 服務"
    echo "  status      查看服務狀態"
    echo "  health      健康檢查"
    echo "  guardian    守衛系統管理"
    echo "  tools       工具選單"
    echo "  web         開啟網頁介面"
    echo "  help        顯示此幫助"
    echo ""
    echo "範例:"
    echo "  $0 install    # 安裝系統"
    echo "  $0 start      # 啟動服務"
    echo "  $0 status     # 查看狀態"
}

cmd_install() {
    log_step "執行安裝..."
    bash "$SCRIPT_DIR/install.sh"
}

cmd_start() {
    log_step "啟動服務..."
    bash "$SCRIPT_DIR/launcher.sh" start
}

cmd_stop() {
    log_step "停止服務..."
    bash "$SCRIPT_DIR/launcher.sh" stop
}

cmd_restart() {
    log_step "重啟服務..."
    bash "$SCRIPT_DIR/launcher.sh" restart
}

cmd_status() {
    bash "$SCRIPT_DIR/launcher.sh" status
}

cmd_health() {
    bash "$SCRIPT_DIR/launcher.sh" health
}

cmd_guardian() {
    bash "$SCRIPT_DIR/opencode-guardian.sh" status
}

cmd_tools() {
    bash "$SCRIPT_DIR/config-menu.sh"
}

cmd_web() {
    log_step "開啟網頁介面..."
    cd /home/reamaster/opencode-manager/opencode\ independent\ system
    ./opencode-dev-start.sh
}

case "${1:-help}" in
    install)  cmd_install ;;
    start)    cmd_start ;;
    stop)     cmd_stop ;;
    restart)  cmd_restart ;;
    status)   cmd_status ;;
    health)   cmd_health ;;
    guardian) cmd_guardian ;;
    tools)    cmd_tools ;;
    web)      cmd_web ;;
    help|--help|-h) show_help ;;
    *)        log_error "未知命令: $1"; show_help; exit 1 ;;
esac
