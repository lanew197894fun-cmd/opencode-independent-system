#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Web Monitor Skill - 網站監控
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
TARGET_URL="${2:-}"
NOTIFY_WEBHOOK="${3:-}"

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
echo "║         🌍 Web Monitor 網站監控                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

check_url() {
    timeout 10 curl -s -o /dev/null -w "%{http_code}|%{time_total}" "$1" 2>/dev/null
}

check_ssl() {
    echo | timeout 10 openssl s_client -connect "${1:8}:443" -servername "${1:8}" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null
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
    if [ -z "$TARGET_URL" ]; then
      log_error "請提供網址"
      echo "用法: $0 status <URL>"
      exit 1
    fi
    echo -e "${CYAN}═══ 網站狀態 ═══${NC}"
    RESULT=$(check_url "$TARGET_URL")
    HTTP_CODE=$(echo "$RESULT" | cut -d'|' -f1)
    TIME=$(echo "$RESULT" | cut -d'|' -f2)
    
    if [ "$HTTP_CODE" = "200" ]; then
      log_info "網站正常 (HTTP $HTTP_CODE)"
      echo "  回應時間: ${TIME}s"
    elif [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
      log_warn "重新導向 (HTTP $HTTP_CODE)"
    else
      log_error "網站異常 (HTTP $HTTP_CODE)"
    fi
    ;;
  ssl)
    if [ -z "$TARGET_URL" ]; then
      log_error "請提供網址"
      echo "用法: $0 ssl <URL>"
      exit 1
    fi
    echo -e "${CYAN}═══ SSL 憑證 ═══${NC}"
    DOMAIN=$(echo "$TARGET_URL" | sed -e 's|https://||' -e 's|/.*||')
    EXPIRY=$(echo | timeout 10 openssl s_client -connect "$DOMAIN:443" -servername "$DOMAIN" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null)
    if [ -n "$EXPIRY" ]; then
      log_info "憑證有效"
      echo "  過期日: $EXPIRY"
    else
      log_error "無法取得憑證資訊"
    fi
    ;;
  monitor)
    if [ -z "$TARGET_URL" ]; then
      log_error "請提供網址"
      echo "用法: $0 monitor <URL> [Webhook]"
      exit 1
    fi
    NOTIFY_WEBHOOK="${3:-}"
    INTERVAL="${4:-10}"
    
    echo -e "${CYAN}═══ 監控模式 (Ctrl+C 停止) ═══${NC}"
    echo "  URL: $TARGET_URL"
    echo "  間隔: ${INTERVAL}秒"
    echo ""
    
    while true; do
      RESULT=$(check_url "$TARGET_URL")
      HTTP_CODE=$(echo "$RESULT" | cut -d'|' -f1)
      TIME=$(echo "$RESULT" | cut -d'|' -f2)
      
      if [ "$HTTP_CODE" = "200" ]; then
        echo -e "$(date '+%H:%M:%S') ${GREEN}● 正常${NC} (${TIME}s) HTTP:$HTTP_CODE"
      else
        MSG="⚠️ 網站異常: $TARGET_URL (HTTP $HTTP_CODE)"
        echo -e "$(date '+%H:%M:%S') ${RED}✗ 異常${NC} HTTP:$HTTP_CODE"
        [ -n "$NOTIFY_WEBHOOK" ] && send_webhook "$MSG"
      fi
      sleep "$INTERVAL"
    done
    ;;
  help)
    echo "Web Monitor 指令:"
    echo ""
    echo "  status <URL>           查看網站狀態"
    echo "  ssl <URL>              檢查 SSL 憑證"
    echo "  monitor <URL> [Webhook] 持續監控"
    echo ""
    echo "範例:"
    echo "  $0 status https://example.com"
    echo "  $0 ssl https://example.com"
    echo "  $0 monitor https://example.com"
    ;;
  *)
    $0 help
    ;;
esac
