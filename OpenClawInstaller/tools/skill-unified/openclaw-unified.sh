#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# OpenClaw Unified Skill - 統一網關管理
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
OPENCLAW="$HOME/.local/bin/openclaw"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         🦞 OpenClaw 統一網關管理                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

case "$CMD" in
  status)
    echo -e "${CYAN}═══ 網關狀態 ═══${NC}"
    $OPENCLAW gateway status 2>&1 | head -20
    echo ""
    echo -e "${CYAN}═══ 頻道狀態 ═══${NC}"
    $OPENCLAW channels status 2>&1
    ;;
  start)
    log_info "啟動網關..."
    $OPENCLAW gateway start
    ;;
  stop)
    log_info "停止網關..."
    $OPENCLAW gateway stop
    ;;
  restart)
    log_info "重啟網關..."
    $OPENCLAW gateway restart
    ;;
  health)
    $OPENCLAW health
    ;;
  logs)
    $OPENCLAW logs "${2:-50}"
    ;;
  install)
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    echo "安裝路徑: $SCRIPT_DIR"
    echo ""
    log_info "請將此腳本加入 PATH 或建立別名"
    ;;
  *)
    echo "用法: $0 {status|start|stop|restart|health|logs}"
    echo ""
    echo "指令:"
    echo "  status      查看網關和頻道狀態"
    echo "  start       啟動網關"
    echo "  stop        停止網關"
    echo "  restart     重啟網關"
    echo "  health      健康檢查"
    echo "  logs [行數] 查看日誌"
    ;;
esac
