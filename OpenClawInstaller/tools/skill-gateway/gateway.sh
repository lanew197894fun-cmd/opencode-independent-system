#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# OpenClaw Gateway Skill - 網關管理技能
# 用法: openclaw-gateway <command>
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
OPENCLAW="$HOME/.local/bin/openclaw"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

case "$CMD" in
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
  status)
    $OPENCLAW gateway status
    ;;
  health)
    $OPENCLAW health
    ;;
  logs)
    $OPENCLAW logs "${2:-20}"
    ;;
  channels)
    $OPENCLAW channels status
    ;;
  dashboard)
    echo "Dashboard: http://127.0.0.1:18789/"
    ;;
  *)
    echo "用法: $0 {start|stop|restart|status|health|logs|channels|dashboard}"
    echo ""
    echo "指令:"
    echo "  start     啟動網關"
    echo "  stop      停止網關"
    echo "  restart   重啟網關"
    echo "  status    查看狀態"
    echo "  health    健康檢查"
    echo "  logs      查看日誌"
    echo "  channels  頻道狀態"
    echo "  dashboard 開啟儀表板"
    ;;
esac
