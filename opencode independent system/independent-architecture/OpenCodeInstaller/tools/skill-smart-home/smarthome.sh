#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Smart Home Skill - 智慧家居控制
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
HA_URL="${2:-http://homeassistant.local:8123}"
HA_TOKEN="${3:-}"

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
echo "║         🏠 Smart Home 智慧家居控制              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

case "$CMD" in
  status)
    echo -e "${CYAN}═══ Home Assistant 狀態 ═══${NC}"
    if [ -n "$HA_TOKEN" ]; then
      RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/")
      if [ "$RESPONSE" = "200" ]; then
        log_info "Home Assistant 連線正常"
      else
        log_error "連線失敗"
      fi
    else
      log_warn "請設定 Home Assistant"
      echo "用法: $0 set <HA_URL> <HA_TOKEN>"
    fi
    ;;
  lights)
    echo -e "${CYAN}═══ 燈光設備 ═══${NC}"
    if [ -n "$HA_TOKEN" ]; then
      curl -s -H "Authorization: Bearer $HA_TOKEN" \
        "$HA_URL/api/states" | jq -r '.[] | select(.entity_id | startswith("light.")) | "\(.entity_id): \(.state)"' 2>/dev/null || log_error "取得失敗"
    else
      log_warn "請先設定 Token"
    fi
    ;;
  switches)
    echo -e "${CYAN}═══ 開關設備 ═══${NC}"
    if [ -n "$HA_TOKEN" ]; then
      curl -s -H "Authorization: Bearer $HA_TOKEN" \
        "$HA_URL/api/states" | jq -r '.[] | select(.entity_id | startswith("switch.") | select(.entity_id | startswith("input_boolean") | not)) | "\(.entity_id): \(.state)"' 2>/dev/null || log_error "取得失敗"
    else
      log_warn "請先設定 Token"
    fi
    ;;
  sensors)
    echo -e "${CYAN}═══ 感測器 ═══${NC}"
    if [ -n "$HA_TOKEN" ]; then
      curl -s -H "Authorization: Bearer $HA_TOKEN" \
        "$HA_URL/api/states" | jq -r '.[] | select(.entity_id | startswith("sensor.")) | "\(.entity_id): \(.state)"' 2>/dev/null | head -20 || log_error "取得失敗"
    else
      log_warn "請先設定 Token"
    fi
    ;;
  on)
    ENTITY="$2"
    if [ -z "$ENTITY" ]; then
      log_error "請指定設備"
      echo "用法: $0 on <entity_id>"
      exit 1
    fi
    log_info "開啟: $ENTITY"
    if [ -n "$HA_TOKEN" ]; then
      curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"entity_id":"'"$ENTITY"'"}' \
        "$HA_URL/api/services/homeassistant/turn_on" | jq -r '.[] | .entity_id' 2>/dev/null
    fi
    ;;
  off)
    ENTITY="$2"
    if [ -z "$ENTITY" ]; then
      log_error "請指定設備"
      echo "用法: $0 off <entity_id>"
      exit 1
    fi
    log_info "關閉: $ENTITY"
    if [ -n "$HA_TOKEN" ]; then
      curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"entity_id":"'"$ENTITY"'"}' \
        "$HA_URL/api/services/homeassistant/turn_off" | jq -r '.[] | .entity_id' 2>/dev/null
    fi
    ;;
  set)
    HA_URL="$2"
    HA_TOKEN="$3"
    if [ -z "$HA_TOKEN" ]; then
      log_error "請提供 URL 和 Token"
      echo "用法: $0 set <HA_URL> <HA_TOKEN>"
      echo "範例: $0 set http://homeassistant.local:8123 YOUR_TOKEN"
      exit 1
    fi
    log_info "設定 Smart Home..."
    echo "URL: $HA_URL"
    echo "Token: ${HA_TOKEN:0:10}..."
    ;;
  help)
    echo "Smart Home 指令:"
    echo ""
    echo "  status           查看 Home Assistant 狀態"
    echo "  lights           列出所有燈光"
    echo "  switches         列出所有開關"
    echo "  sensors          列出感測器"
    echo "  on <設備>        開啟設備"
    echo "  off <設備>       關閉設備"
    echo "  set <URL> <Token> 設定連線"
    echo ""
    echo "範例:"
    echo "  $0 set http://homeassistant.local:8123 your_token"
    echo "  $0 lights"
    echo "  $0 on light.living_room"
    ;;
  *)
    $0 help
    ;;
esac
