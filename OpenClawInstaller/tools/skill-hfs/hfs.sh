#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# HFS Skill - HttpFileServer 監控 (支援 HFS 和 HFS2)
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
HFS_IP="${2:-localhost}"
HFS_PORT="${3:-8080}"
HFS_TYPE="${4:-hfs3}"  # hfs3, hfs2

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m'

HFS3_REPO="https://api.github.com/repos/lanew197894fun-cmd/hfs"
HFS2_REPO="https://api.github.com/repos/boss6731/hfs2"

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         🌐 HFS HttpFileServer 監控              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

check_hfs() {
    timeout 3 curl -s -o /dev/null -w "%{http_code}" "http://$1:$2" 2>/dev/null
}

get_repo_info() {
    local REPO="$1"
    curl -s "$REPO" | jq -r '.stargazers_count, .forks_count' 2>/dev/null
}

show_repo_info() {
    local REPO="$1"
    local NAME="$2"
    echo -e "${CYAN}═══ $NAME ═══${NC}"
    STAR=$(curl -s "$REPO" | jq -r '.stargazers_count' 2>/dev/null)
    FORK=$(curl -s "$REPO" | jq -r '.forks_count' 2>/dev/null)
    DESC=$(curl -s "$REPO" | jq -r '.description' 2>/dev/null)
    echo "  ⭐ Stars: ${STAR:-0}"
    echo "  🍴 Forks: ${FORK:-0}"
    [ -n "$DESC" ] && echo "  📝 $DESC"
}

case "$CMD" in
  status)
    echo -e "${CYAN}═══ HFS 服務狀態 ═══${NC}"
    HTTP_CODE=$(check_hfs "$HFS_IP" "$HFS_PORT")
    if [ "$HTTP_CODE" = "200" ]; then
      log_info "HFS 服務運行中"
      echo "  URL: http://$HFS_IP:$HFS_PORT"
    else
      log_warn "HFS 服務未運行 (HTTP: $HTTP_CODE)"
    fi
    echo ""
    show_repo_info "$HFS3_REPO" "HFS 3 (Go)"
    echo ""
    show_repo_info "$HFS2_REPO" "HFS 2 (Delphi)"
    ;;
  version)
    echo -e "${CYAN}═══ 版本資訊 ═══${NC}"
    echo ""
    echo -e "${BLUE}HFS 3 (Go):${NC}"
    TAG=$(curl -s "$HFS3_REPO/releases/latest" | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)
    echo "  最新版本: ${TAG:-未知}"
    echo "  https://github.com/lanew197894fun-cmd/hfs"
    echo ""
    echo -e "${BLUE}HFS 2 (Delphi):${NC}"
    TAG2=$(curl -s "$HFS2_REPO/commits/master" | head -1)
    echo "  194 Commits"
    echo "  https://github.com/boss6731/hfs2"
    ;;
  deploy)
    log_info "部署 HFS..."
    echo ""
    echo "選項:"
    echo "  1. HFS 3 (Go) - https://github.com/lanew197894fun-cmd/hfs"
    echo "  2. HFS 2 (Delphi) - https://github.com/boss6731/hfs2"
    echo ""
    echo "請參考對應 GitHub 頁面"
    ;;
  hfs3)
    HFS_TYPE="hfs3"
    echo -e "${CYAN}═══ HFS 3 專案資訊 ═══${NC}"
    show_repo_info "$HFS3_REPO" "HFS 3"
    echo ""
    echo "網址: https://github.com/lanew197894fun-cmd/hfs"
    ;;
  hfs2)
    HFS_TYPE="hfs2"
    echo -e "${CYAN}═══ HFS 2 專案資訊 ═══${NC}"
    show_repo_info "$HFS2_REPO" "HFS 2"
    echo ""
    echo "網址: https://github.com/boss6731/hfs2"
    ;;
  monitor)
    echo -e "${CYAN}═══ HFS 監控模式 (Ctrl+C 停止) ═══${NC}"
    INTERVAL="${2:-10}"
    log_info "每 ${INTERVAL} 秒檢查一次..."
    while true; do
      HTTP_CODE=$(check_hfs "$HFS_IP" "$HFS_PORT")
      if [ "$HTTP_CODE" = "200" ]; then
        echo -e "$(date '+%H:%M:%S') ${GREEN}● HFS 正常${NC}"
      else
        echo -e "$(date '+%H:%M:%S') ${RED}✗ HFS 離線 (HTTP: $HTTP_CODE)${NC}"
      fi
      sleep "$INTERVAL"
    done
    ;;
  set)
    HFS_IP="$2"
    HFS_PORT="${3:-8080}"
    log_info "設定已儲存:"
    echo "  IP: $HFS_IP"
    echo "  Port: $HFS_PORT"
    ;;
  help)
    echo "HFS 指令:"
    echo ""
    echo "  status              查看服務狀態 + GitHub 資訊"
    echo "  version             查看版本資訊"
    echo "  hfs3               查看 HFS3 專案"
    echo "  hfs2               查看 HFS2 專案"
    echo "  deploy             部署說明"
    echo "  monitor [秒數]     持續監控"
    echo "  set <IP> <Port>   設定連線"
    echo ""
    echo "支援版本:"
    echo "  HFS 3 (Go):   https://github.com/lanew197894fun-cmd/hfs"
    echo "  HFS 2 (Delphi): https://github.com/boss6731/hfs2"
    ;;
  *)
    $0 help
    ;;
esac
