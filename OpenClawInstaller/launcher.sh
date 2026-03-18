#!/bin/bash
#
# ═══════════════════════════════════════════════════════════════════════════
# ║  🦞 OpenClaw + OpenCode 整合啟動器 v2.0                               ║
# ║  一鍵啟動 • 狀態監控 • 資源管理 • 自動修復                              ║
# ═══════════════════════════════════════════════════════════════════════════
#
# 說明：
#   這是 OpenClaw 的主要啟動腳本，提供服務管理、狀態監控、備份等功能。
#
# 使用方法：
#   ./launcher.sh menu         - 互動式選單
#   ./launcher.sh start        - 啟動服務
#   ./launcher.sh stop         - 停止服務
#   ./launcher.sh restart      - 重啟服務
#   ./launcher.sh status       - 查看狀態
#   ./launcher.sh health       - 健康檢查
#   ./launcher.sh logs [行數]  - 查看日誌 (預設 50 行)
#   ./launcher.sh backup      - 備份資料
#   ./launcher.sh sync         - 同步配置
#   ./launcher.sh detect       - 偵測外接儲存
#   ./launcher.sh usb          - 同步到 USB
#   ./launcher.sh opencode     - 開啟 OpenCode
#   ./launcher.sh web          - 開啟網頁介面
#   ./launcher.sh help         - 顯示幫助
#
# 環境變數：
#   CONFIG_DIR    - OpenClaw 配置目錄 (預設: ~/.openclaw)
#   GATEWAY_PORT  - Gateway 連接埠 (預設: 18789)
#
# 相關檔案：
#   ~/.openclaw/env           - 環境變數配置
#   ~/.openclaw/openclaw.json - OpenClaw 主配置
#
# ═══════════════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.openclaw"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 顏色輸出
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

# ═══════════════════════════════════════════════════════════════════════════
# 函數說明
# ═══════════════════════════════════════════════════════════════════════════

# 獲取 Gateway 進程 ID (透過連接埠 18789)
# 回傳: PID 或空值
get_gateway_pid() { lsof -ti :18789 2>/dev/null | head -1; }

# 檢查 Gateway 是否運行中
# 回傳: 0 (運行) 或 1 (停止)
is_gateway_running() { [ -n "$(get_gateway_pid)" ]; }

# 檢查資源使用情況 (CPU/記憶體)
# 輸出: "CPU: X% | 記憶體: Y MB"
check_resources() {
    local pid=$(get_gateway_pid)
    [ -z "$pid" ] && return 1
    
    # 使用 ps 取得進程資源使用
    local stats=$(ps -p "$pid" -o %cpu,%mem,rss 2>/dev/null | tail -1)
    local cpu=$(echo "$stats" | awk '{print $1}')
    local mem_kb=$(echo "$stats" | awk '{print $3}')
    local mem_mb=$((mem_kb / 1024))
    
    echo "CPU: ${cpu}% | 記憶體: ${mem_mb} MB"
}

# 顯示狀態
show_status() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║          🦞 OpenClaw 系統狀態                    ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║  服務               狀態         PID              ║"
    echo "╠══════════════════════════════════════════════════════╣"
    
    # OpenClaw Gateway
    if is_gateway_running; then
        local pid=$(get_gateway_pid)
        echo -e "║  OpenClaw Gateway  ${GREEN}運行中${NC}    $pid"
    else
        echo -e "║  OpenClaw Gateway  ${RED}停止${NC}        -"
    fi
    
    # Systemd
    if systemctl is-active --quiet openclaw-gateway 2>/dev/null; then
        echo -e "║  systemd 服務      ${GREEN}啟用${NC}      -"
    else
        echo -e "║  systemd 服務      ${YELLOW}未啟用${NC}    -"
    fi
    
    # OpenCode
    if pgrep -f "opencode" > /dev/null; then
        echo -e "║  OpenCode          ${GREEN}就緒${NC}      -"
    else
        echo -e "║  OpenCode          ${YELLOW}未啟動${NC}    -"
    fi
    
    echo "╚══════════════════════════════════════════════════════╝"
    
    if is_gateway_running; then
        check_resources
    fi
}

# 啟動
do_start() {
    echo ""
    log_info "啟動 OpenClaw Gateway..."
    openclaw gateway start
    sleep 2
    
    if is_gateway_running; then
        log_info "OpenClaw Gateway 啟動成功"
    else
        log_error "OpenClaw Gateway 啟動失敗"
        return 1
    fi
}

# 停止
do_stop() {
    log_info "停止 OpenClaw Gateway..."
    openclaw gateway stop
    sleep 2
    
    if ! is_gateway_running; then
        log_info "OpenClaw Gateway 已停止"
    else
        log_warn "強制停止..."
        local pid=$(get_gateway_pid)
        [ -n "$pid" ] && kill "$pid" 2>/dev/null
    fi
}

# 重啟
do_restart() {
    do_stop
    sleep 1
    do_start
}

# 健康檢查
do_health() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║              🔍 健康檢查                           ║"
    echo "╚══════════════════════════════════════════════════════╝"
    
    local issues=0
    
    # Gateway
    if is_gateway_running; then
        echo -e "  ${GREEN}✓${NC} OpenClaw Gateway 運行中"
    else
        echo -e "  ${RED}✗${NC} OpenClaw Gateway 未運行"
        issues=$((issues + 1))
    fi
    
    # Config
    if [ -f "$CONFIG_DIR/openclaw.json" ]; then
        echo -e "  ${GREEN}✓${NC} 配置文件存在"
    else
        echo -e "  ${RED}✗${NC} 配置文件不存在"
        issues=$((issues + 1))
    fi
    
    # Port
    if netstat -tuln 2>/dev/null | grep -q ":18789 "; then
        echo -e "  ${GREEN}✓${NC} Port 18789 監聽中"
    else
        echo -e "  ${YELLOW}!${NC} Port 18789 未監聽"
    fi
    
    echo ""
    if [ $issues -eq 0 ]; then
        log_info "健康檢查通過"
    else
        log_warn "發現 $issues 個問題"
    fi
}

# 查看日誌
do_logs() {
    local lines="${1:-50}"
    local log_file="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
    
    if [ -f "$log_file" ]; then
        tail -n "$lines" "$log_file"
    else
        log_warn "日誌檔案不存在: $log_file"
        log_info "嘗試查看系統日誌..."
        journalctl --user -u openclaw-gateway -n "$lines" 2>/dev/null || \
            log_error "無法查看日誌"
    fi
}

# 備份
do_backup() {
    local backup_dir="$CONFIG_DIR/backups"
    mkdir -p "$backup_dir"
    
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$backup_dir/openclaw_backup_$timestamp.tar.gz"
    
    log_info "正在備份..."
    tar -czf "$backup_file" -C "$HOME" .openclaw \
        --exclude='node_modules' \
        --exclude='.cache' \
        --exclude='backups' 2>/dev/null
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "備份完成: $backup_file ($size)"
    else
        log_error "備份失敗"
    fi
}

# 開啟 OpenCode
do_opencode() {
    log_info "開啟 OpenCode..."
    opencode -c
}

# 開啟網頁介面
do_web() {
    local url="http://127.0.0.1:18789"
    log_info "開啟網頁介面: $url"
    command -v xdg-open > /dev/null && xdg-open "$url" || \
        command -v open > /dev/null && open "$url" || \
        echo "請手動開啟: $url"
}

# 互動選單
show_menu() {
    while true; do
        show_status
        echo ""
        echo "╔══════════════════════════════════════════════════════╗"
        echo "║              🦞 主選單                              ║"
        echo "╠══════════════════════════════════════════════════════╣"
        echo "║  1. 啟動服務                                       ║"
        echo "║  2. 停止服務                                       ║"
        echo "║  3. 重啟服務                                       ║"
        echo "║  4. 健康檢查                                       ║"
        echo "║  5. 查看日誌 (50行)                                ║"
        echo "║  6. 備份資料                                       ║"
        echo "║  7. 開啟 OpenCode                                   ║"
        echo "║  8. 開啟網頁介面                                   ║"
        echo "║  0. 離開                                           ║"
        echo "╚══════════════════════════════════════════════════════╝"
        echo -n "請選擇 [0-8]: "
        read choice
        
        case $choice in
            1) do_start ;;
            2) do_stop ;;
            3) do_restart ;;
            4) do_health ;;
            5) do_logs 50 ;;
            6) do_backup ;;
            7) do_opencode ;;
            8) do_web ;;
            0) exit 0 ;;
            *) log_error "無效選擇" ;;
        esac
        
        echo ""
        read -p "按 Enter 繼續..."
    done
}

# 同步配置與技能
do_sync() {
    $HOME/.opencode/user-scripts/sync.sh status
}

# 導出配置
do_export() {
    $HOME/.opencode/user-scripts/sync.sh export
}

# 檢測外接儲存
do_detect_storage() {
    $HOME/.opencode/user-scripts/backup-external.sh detect
}

# 同步到外接儲存
do_backup_external() {
    local target="$2"
    if [ -z "$target" ]; then
        $HOME/.opencode/user-scripts/backup-external.sh interactive
    else
        $HOME/.opencode/user-scripts/backup-external.sh sync "$target" "OpenClaw"
    fi
}

# 列出外接備份
do_list_backup() {
    $HOME/.opencode/user-scripts/backup-external.sh list "$2"
}

# 主程式
case "${1:-menu}" in
    start)    do_start ;;
    stop)     do_stop ;;
    restart)  do_restart ;;
    status)   show_status ;;
    health)   do_health ;;
    logs)     do_logs "${2:-50}" ;;
    backup)   do_backup ;;
    sync)     do_sync ;;
    export)   do_export ;;
    detect)   do_detect_storage ;;
    usb)      do_backup_external "$@" ;;
    opencode) do_opencode ;;
    web)      do_web ;;
    menu)     show_menu ;;
    help|--help|-h)
        echo "用法: $0 {command}"
        echo ""
        echo "命令:"
        echo "  start     啟動 OpenClaw Gateway"
        echo "  stop      停止 OpenClaw Gateway"
        echo "  restart   重啟 OpenClaw Gateway"
        echo "  status    顯示系統狀態"
        echo "  health    健康檢查"
        echo "  logs [N]  查看日誌 (預設 50 行)"
        echo "  backup    備份資料"
        echo "  sync      同步/查看配置狀態"
        echo "  export    導出配置"
        echo "  detect    檢測外接儲存裝置"
        echo "  usb       同步到 USB/外接硬碟"
        echo "  opencode  開啟 OpenCode"
        echo "  web       開啟網頁介面"
        echo "  menu      互動選單"
        ;;
    *)        $0 help ;;
esac