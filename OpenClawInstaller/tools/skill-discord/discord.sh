#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Discord Skill - Discord 機器人管理
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
CONFIG="$HOME/.openclaw/openclaw.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

get_discord_token() {
    grep -o '"discord"[[:space:]]*:[[:space:]]*{[^}]*}' "$CONFIG" 2>/dev/null | grep -o '"token"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
}

case "$CMD" in
  status)
    TOKEN=$(get_discord_token)
    if [ -n "$TOKEN" ]; then
      log_info "Discord 已設定"
    else
      log_warn "Discord 未設定"
    fi
    echo ""
    echo "設定請參考: Discord Developer Portal"
    ;;
  test)
    TOKEN="$2"
    if [ -z "$TOKEN" ]; then
      log_error "請提供 Token"
      echo "用法: $0 test <BOT_TOKEN>"
      exit 1
    fi
    log_info "測試 Discord 連線..."
    curl -s -H "Authorization: Bot $TOKEN" "https://discord.com/api/v10/users/@me" | jq -r '.username // .message' 2>/dev/null || log_error "連線失敗"
    ;;
  help)
    echo "Discord 設定教學:"
    echo ""
    echo "1. 前往 https://discord.com/developers/applications"
    echo "2. 建立新應用 → Bot"
    echo "3. 取得 Token"
    echo "4. 開啟 Message Content Intent"
    echo "5. OAuth2 → URL Generator → 邀請機器人"
    ;;
  *)
    echo "用法: $0 {status|test|help}"
    ;;
esac
