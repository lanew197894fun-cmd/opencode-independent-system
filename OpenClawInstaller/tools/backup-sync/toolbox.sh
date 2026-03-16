#!/bin/bash
#
# ═══════════════════════════════════════════════════════════════════════
# ═  OpenClaw 備份同步工具箱                                    ║
# ║  可複製到 USB/外接硬碟執行                                  ║
# ║                                                            ║
# ║  作者: OpenClaw + OpenCode                                  ║
# ║  版本: 1.0.0                                               ║
# ═══════════════════════════════════════════════════════════════════════
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

# 顯示主選單
show_menu() {
    while true; do
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║        📦 OpenClaw 備份同步工具箱                 ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║  1. 檢測外接儲存裝置                              ║"
        echo "║  2. 同步 OpenClaw 配置到外接                     ║"
        echo "║  3. 從外接儲存還原                               ║"
        echo "║  4. 列出已存在的備份                             ║"
        echo "║  5. 本地備份                                     ║"
        echo "║  6. 查看配置狀態                                 ║"
        echo "║  ─────────────────────────────────────────────    ║"
        echo "║  7. 自定義項目同步（其他專案）                    ║"
        echo "║  8. 同步多個專案到外接                           ║"
        echo "║  0. 離開                                          ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo ""
        echo -n "請選擇 [0-8]: "
        read choice
        
        case $choice in
            1) source "$SCRIPT_DIR/detect-storage.sh" ;;
            2) source "$SCRIPT_DIR/sync-to-storage.sh" "$SCRIPT_DIR/select-storage.sh" ;;
            3) source "$SCRIPT_DIR/restore-backup.sh" ;;
            4) source "$SCRIPT_DIR/list-backups.sh" ;;
            5) source "$SCRIPT_DIR/local-backup.sh" ;;
            6) source "$SCRIPT_DIR/check-status.sh" ;;
            7) source "$SCRIPT_DIR/sync-project.sh" menu ;;
            8) source "$SCRIPT_DIR/sync-project.sh" sync_multiple ;;
            0) exit 0 ;;
            *) log_error "無效選擇" ;;
        esac
        
        echo ""
        echo -n "按 Enter 繼續..."
        read
    done
}

# 顯示使用方法
show_help() {
    echo ""
    echo "OpenClaw 備份同步工具箱"
    echo ""
    echo "使用方法:"
    echo "  $0               互動選單"
    echo "  $0 detect        檢測外接儲存"
    echo "  $0 sync <路徑>  同步到指定路徑"
    echo "  $0 restore <路徑> 從備份還原"
    echo "  $0 list          列出備份"
    echo "  $0 local         本地備份"
    echo "  $0 status        查看狀態"
    echo "  $0 project       自定義項目同步"
    echo ""
    echo "範例:"
    echo "  $0 detect"
    echo "  $0 sync /media/reamaster/USB"
    echo "  $0 restore /media/reamaster/USB/OpenClaw_20260317"
    echo "  $0 project"
    echo ""
}

# 主程式
case "${1:-menu}" in
    detect)    source "$SCRIPT_DIR/detect-storage.sh" ;;
    sync)      source "$SCRIPT_DIR/sync-to-storage.sh" "$2" ;;
    restore)   source "$SCRIPT_DIR/restore-backup.sh" "$2" ;;
    list)      source "$SCRIPT_DIR/list-backups.sh" ;;
    local)     source "$SCRIPT_DIR/local-backup.sh" ;;
    status)    source "$SCRIPT_DIR/check-status.sh" ;;
    project)   source "$SCRIPT_DIR/sync-project.sh" menu ;;
    projects)  source "$SCRIPT_DIR/sync-project.sh" sync_multiple ;;
    help|-h|--help) show_help ;;
    *)         show_menu ;;
esac