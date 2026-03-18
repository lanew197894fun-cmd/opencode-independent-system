#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Telegram Skill - Telegram 機器人管理
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

get_token() {
    grep -o '"botToken"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONFIG" 2>/dev/null | cut -d'"' -f4
}

case "$CMD" in
  status)
    TOKEN=$(get_token)
    if [ -n "$TOKEN" ]; then
      log_info "Telegram 已設定"
      echo "Token: ${TOKEN:0:10}..."
    else
      log_warn "Telegram 未設定"
    fi
    ;;
  test)
    TOKEN=$(get_token)
    if [ -z "$TOKEN" ]; then
      log_error "請先設定 Bot Token"
      exit 1
    fi
    log_info "測試 Telegram 連線..."
    curl -s "https://api.telegram.org/bot$TOKEN/getMe" | jq -r '.result.username // .description' 2>/dev/null || log_error "連線失敗"
    ;;
  set)
    TOKEN="$2"
    if [ -z "$TOKEN" ]; then
      log_error "請提供 Token"
      echo "用法: $0 set <BOT_TOKEN>"
      exit 1
    fi
    log_info "設定 Token..."
    # 更新配置
    sed -i "s/\"botToken\": \"[^\"]*\"/\"botToken\": \"$TOKEN\"/" "$CONFIG"
    log_info "Token 已設定"
    ;;
  *)
    echo "用法: $0 {status|test|set}"
    echo ""
    echo "指令:"
    echo "  status      查看狀態"
    echo "  test        測試連線"
    echo "  set <token> 設定 Token"
    ;;
esac
