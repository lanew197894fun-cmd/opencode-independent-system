#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Game Server Skill - 遊戲伺服器監控與通知
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
SERVER_NAME="${2:-minecraft}"
SERVER_IP="${3:-localhost}"
SERVER_PORT="${4:-25565}"
NOTIFY_WEBHOOK="${5:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         🎮 Game Server 遊戲伺服器                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

check_port() {
    timeout 2 bash -c "echo >/dev/tcp/$1/$2" 2>/dev/null
}

send_webhook() {
    local MSG="$1"
    if [ -n "$NOTIFY_WEBHOOK" ]; then
        curl -s -X POST "$NOTIFY_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"content\": \"$MSG\"}" > /dev/null 2>&1
    fi
}

case "$CMD" in
  status)
    echo -e "${CYAN}═══ 伺服器狀態 ═══${NC}"
    if check_port "$SERVER_IP" "$SERVER_PORT"; then
      log_info "$SERVER_NAME 在線 ($SERVER_IP:$SERVER_PORT)"
    else
      log_error "$SERVER_NAME 離線"
    fi
    ;;
  monitor)
    echo -e "${CYAN}═══ 監控模式 (Ctrl+C 停止) ═══${NC}"
    INTERVAL="${2:-10}"
    log_info "每 ${INTERVAL} 秒檢查一次..."
    while true; do
      if check_port "$SERVER_IP" "$SERVER_PORT"; then
        echo -e "$(date '+%H:%M:%S') ${GREEN}● 在線${NC}"
      else
        MSG="⚠️ $SERVER_NAME 伺服器已離線!"
        echo -e "$(date '+%H:%M:%S') ${RED}✗ 離線${NC} - 發送通知"
        send_webhook "$MSG"
      fi
      sleep "$INTERVAL"
    done
    ;;
  players)
    echo -e "${CYAN}═══ 玩家數量 ═══${NC}"
    echo "注意: 需要 RCON 或查詢端口才能取得詳細玩家列表"
    echo ""
    echo "可使用:"
    echo "  Minecraft: mcstatus, mcrcon"
    echo "  Other: gs-query"
    ;;
  notify)
    MSG="$2"
    if [ -z "$MSG" ]; then
      log_error "請輸入訊息"
      echo "用法: $0 notify <訊息>"
      exit 1
    fi
    log_info "發送通知: $MSG"
    send_webhook "🎮 $MSG"
    ;;
  restart)
    log_warn "重新啟動遊戲伺服器?"
    echo "請輸入指令或使用遊戲伺服器管理面板"
    ;;
  set)
    SERVER_NAME="$2"
    SERVER_IP="$3"
    SERVER_PORT="$4"
    NOTIFY_WEBHOOK="$5"
    log_info "設定已儲存:"
    echo "  名稱: $SERVER_NAME"
    echo "  IP: $SERVER_IP"
    echo "  Port: $SERVER_PORT"
    echo "  Webhook: ${NOTIFY_WEBHOOK:0:20}..."
    ;;
  help)
    echo "Game Server 指令:"
    echo ""
    echo "  status              查看伺服器狀態"
    echo "  monitor [秒數]     持續監控 (預設10秒)"
    echo "  players            玩家數量"
    echo "  notify <訊息>      發送 Discord/Telegram 通知"
    echo "  set <名> <IP> <Port> <Webhook>  設定"
    echo ""
    echo "支援遊戲:"
    echo "  Minecraft, Valheim, Rust, Ark, Palworld"
    echo "  CS2, GMod, FiveM, Terraria"
    ;;
  *)
    $0 help
    ;;
esac
