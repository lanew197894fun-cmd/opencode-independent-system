#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Line Skill - Line 機器人管理
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

get_line_token() {
    grep -o '"line"[[:space:]]*:[[:space:]]*{[^}]*}' "$CONFIG" 2>/dev/null | grep -o '"channelAccessToken"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4
}

case "$CMD" in
  status)
    TOKEN=$(get_line_token)
    if [ -n "$TOKEN" ]; then
      log_info "Line 已設定"
      echo "Token: ${TOKEN:0:15}..."
    else
      log_warn "Line 未設定"
    fi
    ;;
  test)
    TOKEN="$2"
    if [ -z "$TOKEN" ]; then
      log_error "請提供 Channel Access Token"
      echo "用法: $0 test <CHANNEL_ACCESS_TOKEN>"
      exit 1
    fi
    log_info "測試 Line 連線..."
    curl -s -H "Authorization: Bearer $TOKEN" "https://api.line.me/v2/bot/info" | jq -r '.displayName // .message' 2>/dev/null || log_error "連線失敗"
    ;;
  set)
    TOKEN="$2"
    if [ -z "$TOKEN" ]; then
      log_error "請提供 Channel Access Token"
      echo "用法: $0 set <CHANNEL_ACCESS_TOKEN>"
      exit 1
    fi
    log_info "設定 Line Token..."
    # TODO: 更新配置
    log_info "Token 已設定 (請手動加入配置)"
    ;;
  help)
    echo "Line 設定教學:"
    echo ""
    echo "1. 前往 https://developers.line.biz/"
    echo "2. 建立 Provider"
    echo "3. 建立 Messaging API 頻道"
    echo "4. 取得 Channel ID, Channel Secret"
    echo "5. 取得 Channel Access Token"
    ;;
  *)
    echo "用法: $0 {status|test|set|help}"
    ;;
esac
