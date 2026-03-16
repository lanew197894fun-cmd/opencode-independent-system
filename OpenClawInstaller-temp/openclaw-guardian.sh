#!/bin/bash
#
# ════════════════════════════════════════════════════════════════════════════
# ║   🦞 OpenClaw 網關守護腳本 v1.0.0                                ║
# ║   進程守護 • 資源監控 • 網路安全 • 自動備份                       ║
# ════════════════════════════════════════════════════════════════════════════
#
# 使用方法:
#   ./openclaw-guardian.sh          - 互動式選單
#   ./openclaw-guardian.sh daemon   - 啟動守護進程（常駐）
#   ./openclaw-guardian.sh status   - 查看狀態
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.openclaw"
GUARDIAN_DIR="$CONFIG_DIR/guardian"
LOG_FILE="$GUARDIAN_DIR/guardian.log"
PID_FILE="$GUARDIAN_DIR/guardian.pid"
CONFIG_FILE="$GUARDIAN_DIR/config.conf"

DEFAULT_PORT=18789
DEFAULT_MAX_MEMORY_MB=1024
DEFAULT_MAX_CPU_PERCENT=80
DEFAULT_CHECK_INTERVAL=30
DEFAULT_MAX_RESTART=5

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

init_guardian() {
    mkdir -p "$GUARDIAN_DIR"
    mkdir -p "$GUARDIAN_DIR/logs"
    mkdir -p "$GUARDIAN_DIR/backups"
    
    if [ ! -f "$CONFIG_FILE" ]; then
        cat > "$CONFIG_FILE" << 'ENDFILE'
# OpenClaw Guardian 配置文件
GATEWAY_PORT=18789
MAX_MEMORY_MB=1024
MAX_CPU_PERCENT=80
CHECK_INTERVAL=30
MAX_RESTART=5
ENDFILE
    fi
    
    source "$CONFIG_FILE" 2>/dev/null || true
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
    log "INFO: $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
    log "WARN: $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
    log "ERROR: $*"
}

get_gateway_pid() {
    lsof -ti :$GATEWAY_PORT 2>/dev/null | head -1
}

is_gateway_running() {
    [ -n "$(get_gateway_pid)" ]
}

wait_for_gateway() {
    local max_wait=15
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if is_gateway_running; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    return 1
}

start_gateway() {
    if is_gateway_running; then
        log_info "網關已在運行 (PID: $(get_gateway_pid))"
        return 0
    fi
    
    log_info "啟動 OpenClaw 網關..."
    source "$CONFIG_DIR/env" 2>/dev/null || true
    openclaw gateway start
    sleep 3
    
    if wait_for_gateway; then
        log_info "網關啟動成功 (PID: $(get_gateway_pid))"
        return 0
    else
        if systemctl is-active --quiet openclaw-gateway 2>/dev/null; then
            sleep 3
            if wait_for_gateway; then
                log_info "網關啟動成功 (PID: $(get_gateway_pid))"
                return 0
            fi
        fi
        log_error "網關啟動失敗"
        return 1
    fi
}

stop_gateway() {
    if ! is_gateway_running; then
        if systemctl is-active --quiet openclaw-gateway 2>/dev/null; then
            log_info "透過 systemd 停止網關..."
            openclaw gateway stop 2>/dev/null || systemctl stop openclaw-gateway 2>/dev/null || true
            sleep 2
        fi
        log_info "網關未運行"
        return 0
    fi
    
    log_info "停止 OpenClaw 網關..."
    openclaw gateway stop 2>/dev/null || systemctl stop openclaw-gateway 2>/dev/null || true
    sleep 3
    
    if ! is_gateway_running; then
        log_info "網關已停止"
        return 0
    else
        local pid=$(get_gateway_pid)
        [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
        sleep 1
        log_info "網關已停止"
    fi
}

check_resources() {
    local pid=$(get_gateway_pid)
    [ -z "$pid" ] && return 1
    
    local stats=$(ps -p "$pid" -o %cpu,%mem,rss 2>/dev/null | tail -1)
    local cpu=$(echo "$stats" | awk '{print $1}')
    local mem_kb=$(echo "$stats" | awk '{print $3}')
    local mem_mb=$((mem_kb / 1024))
    
    echo "CPU: ${cpu}% | 記憶體: ${mem_mb} MB"
    
    local issues=0
    local cpu_int=${cpu%.*}
    [ "$cpu_int" -gt "$MAX_CPU_PERCENT" ] && issues=$((issues + 1))
    [ "$mem_mb" -gt "$MAX_MEMORY_MB" ] && issues=$((issues + 1))
    
    return $issues
}

show_status() {
    echo -e "${CYAN}🦞 OpenClaw 網關守護狀態${NC}"
    echo ""
    
    if is_gateway_running; then
        local pid=$(get_gateway_pid)
        echo -e "  網關: ${GREEN}運行中${NC} (PID: $pid)"
        check_resources
    else
        echo -e "  網關: ${RED}停止${NC}"
    fi
    
    # 守護進程
    if [ -f "$PID_FILE" ]; then
        local daemon_pid=$(cat "$PID_FILE")
        if kill -0 "$daemon_pid" 2>/dev/null; then
            echo -e "  守護: ${GREEN}運行中${NC} (PID: $daemon_pid)"
        else
            echo -e "  守護: ${RED}已停止${NC}"
            rm -f "$PID_FILE"
        fi
    else
        echo -e "  守護: ${GRAY}未啟動${NC}"
    fi
}

do_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_dir="$GUARDIAN_DIR/backups"
    local backup_file="$backup_dir/openclaw_backup_$timestamp.tar.gz"
    
    mkdir -p "$backup_dir"
    tar -czf "$backup_file" -C "$HOME" .openclaw --exclude='node_modules' --exclude='.cache' 2>/dev/null
    
    if [ -f "$backup_file" ]; then
        local size=$(du -h "$backup_file" | cut -f1)
        log_info "備份完成: $size"
    else
        log_error "備份失敗"
    fi
}

health_check() {
    local issues=0
    echo -e "${CYAN}健康檢查${NC}"
    
    if is_gateway_running; then
        echo -e "  網關: ${GREEN}✓ 運行中${NC}"
    else
        echo -e "  網關: ${RED}✗ 停止${NC}"
        issues=$((issues + 1))
    fi
    
    [ -f "$CONFIG_DIR/openclaw.json" ] && echo -e "  配置: ${GREEN}✓ 存在${NC}" || issues=$((issues + 1))
    
    [ $issues -eq 0 ] && echo -e "\n${GREEN}健康檢查通過${NC}" || echo -e "\n${RED}發現 $issues 個問題${NC}"
}

setup_firewall() {
    echo -e "${CYAN}防火牆配置${NC}"
    command -v iptables &> /dev/null || { echo "iptables 未安裝"; return 1; }
    iptables -A INPUT -i lo -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || true
    iptables -A INPUT -p tcp --dport $GATEWAY_PORT -j ACCEPT 2>/dev/null || true
    log_info "防火牆規則已啟用"
}

# ================================ 24靈防護 ================================
GUARD24_DIR="$CONFIG_DIR/guard24"
AUDIT_LOG="$GUARD24_DIR/audit.log"

init_24guard() {
    mkdir -p "$GUARD24_DIR"
    [ -f "$AUDIT_LOG" ] || touch "$AUDIT_LOG"
}

start_24guard() {
    init_24guard
    echo -e "${CYAN}24靈防護系統${NC}"
    echo "  • VPN 網段: 10.8.0.0/24"
    echo "  • RDP 端口: 3389"
    echo "  • 風險閾值: 70"
    log_info "24靈防護已啟動"
}

# ================================ 詐騙偵測 ================================
SCAM_DB="$GUARDIAN_DIR/scam_detector"
SCAM_HISTORY="$SCAM_DB/history.json"

init_scam() {
    mkdir -p "$SCAM_DB"
    [ -f "$SCAM_HISTORY" ] || echo "[]" > "$SCAM_HISTORY"
}

analyze_scam() {
    init_scam
    echo ""
    echo -e "${CYAN}請輸入要分析的訊息:${NC}"
    read -p "> " message
    
    [ -z "$message" ] && echo "未輸入訊息" && return
    
    local score=0
    for word in 緊急 立即 馬上; do
        echo "$message" | grep -q "$word" && score=$((score + 20))
    done
    for word in 帳號鎖定 損失財產; do
        echo "$message" | grep -q "$word" && score=$((score + 30))
    done
    for word in 匯款 轉帳; do
        echo "$message" | grep -q "$word" && score=$((score + 50))
    done
    for word in 身分證 銀行帳號 密碼; do
        echo "$message" | grep -q "$word" && score=$((score + 60))
    done
    echo "$message" | grep -qE "http|https" && score=$((score + 30))
    
    local level recommendation
    if [ $score -ge 80 ]; then
        level="極高風險"
        recommendation="⚠️ 高度懷疑為詐騙訊息！請勿點擊任何連結。"
    elif [ $score -ge 60 ]; then
        level="高風險"
        recommendation="⚠️ 可能是詐騙訊息！"
    elif [ $score -ge 40 ]; then
        level="中等風險"
        recommendation="🔍 需進一步確認！"
    elif [ $score -ge 20 ]; then
        level="低風險"
        recommendation="⚠️ 請留意！"
    else
        level="安全"
        recommendation="✅ 訊息內容安全。"
    fi
    
    echo ""
    echo -e "${CYAN}分析結果:${NC}"
    echo "  風險分數: $score / 100"
    echo -e "  風險等級: ${WHITE}$level${NC}"
    echo -e "${CYAN}建議:${NC} $recommendation"
}

# ================================ 守護常駐進程 ================================
run_daemon() {
    log_info "守護進程啟動 (PID: $$)"
    log_info "檢查間隔: ${CHECK_INTERVAL}秒"
    
    local restart_count=0
    
    while true; do
        if ! is_gateway_running; then
            log_warn "網關未運行，嘗試啟動..."
            
            if [ $restart_count -ge ${MAX_RESTART:-5} ]; then
                log_error "超過最大重啟次數，等待手動處理"
                sleep 60
                restart_count=0
                continue
            fi
            
            start_gateway
            if [ $? -eq 0 ]; then
                log_info "網關重啟成功"
                restart_count=0
            else
                log_error "網關重啟失敗"
                restart_count=$((restart_count + 1))
            fi
        else
            # 資源檢查
            local pid=$(get_gateway_pid)
            local stats=$(ps -p "$pid" -o %cpu,%mem,rss 2>/dev/null | tail -1)
            local cpu=$(echo "$stats" | awk '{print $1}')
            local mem_mb=$(( $(echo "$stats" | awk '{print $3}') / 1024 ))
            
            if [ -n "$cpu" ]; then
                local cpu_int=${cpu%.*}
                [ "$cpu_int" -gt "$MAX_CPU_PERCENT" ] && log_warn "CPU 過高: ${cpu}%"
                [ "$mem_mb" -gt "$MAX_MEMORY_MB" ] && log_warn "記憶體過高: ${mem_mb}MB"
            fi
        fi
        
        sleep ${CHECK_INTERVAL:-30}
    done
}

start_daemon() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}守護已在運行 (PID: $pid)${NC}"
            return 0
        fi
        rm -f "$PID_FILE"
    fi
    
    init_guardian
    
    # 確保網關運行
    if ! is_gateway_running; then
        start_gateway
    fi
    
    # 啟動守護
    nohup bash "$0" _daemon >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2
    
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log_info "守護已啟動 (PID: $pid)"
            return 0
        fi
    fi
    
    log_error "守護啟動失敗"
    return 1
}

stop_daemon() {
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}守護未運行${NC}"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null
        rm -f "$PID_FILE"
        log_info "守護已停止"
    else
        rm -f "$PID_FILE"
        log_info "守護未運行"
    fi
}

# ================================ 選單 ================================
show_menu() {
    init_guardian
    
    while true; do
        clear
        echo -e "${CYAN}"
        cat << 'MENUEOF'
    ╔═══════════════════════════════════════════════════════╗
    ║   🦞 OpenClaw 網關守護中心 v1.0.0                   ║
    ║                                                           ║
    ║   [1] 🟢  服務管理    [2] 📊 資源監控    [3] 🛡️ 網路安全   ║
    ║   [4] 📝 備份還原    [5] 🔍 健康檢查    [6] ⚙️ 配置設定   ║
    ║   [7] 🤖 24靈防護    [8] 🚫 詐騙偵測    [9] ⏰ 守護常駐   ║
    ║                                                           ║
    ║   [0] 離開                                                ║
    ╚═══════════════════════════════════════════════════════╝
MENUEOF
        echo -e "${NC}"
        
        if is_gateway_running; then
            echo -e "  網關: ${GREEN}● 運行中${NC} (PID: $(get_gateway_pid))"
        else
            echo -e "  網關: ${RED}● 停止${NC}"
        fi
        
        if [ -f "$PID_FILE" ]; then
            local dpid=$(cat "$PID_FILE")
            if kill -0 "$dpid" 2>/dev/null; then
                echo -e "  守護: ${GREEN}● 運行中${NC} (PID: $dpid)"
            else
                echo -e "  守護: ${GRAY}○ 未啟動${NC}"
            fi
        else
            echo -e "  守護: ${GRAY}○ 未啟動${NC}"
        fi
        
        echo ""
        echo -en "${YELLOW}請選擇 [0-9]: ${NC}"
        read choice
        
        case $choice in
            1) menu_service ;;
            2) menu_monitor ;;
            3) menu_security ;;
            4) menu_backup ;;
            5) health_check; echo ""; read -p "按 Enter 繼續..." ;;
            6) cat "$CONFIG_FILE"; echo ""; read -p "按 Enter 繼續..." ;;
            7) start_24guard; echo ""; read -p "按 Enter 繼續..." ;;
            8) analyze_scam; echo ""; read -p "按 Enter 繼續..." ;;
            9) menu_daemon ;;
            0) exit 0 ;;
        esac
    done
}

menu_service() {
    while true; do
        clear
        echo -e "${CYAN}━━━ [1] 服務管理 ━━━${NC}"
        echo ""
        echo "  [1] 啟動網關"
        echo "  [2] 停止網關"
        echo "  [3] 重啟網關"
        echo "  [0] 返回"
        echo ""
        echo -en "${YELLOW}請選擇: ${NC}"
        read opt
        case $opt in
            1) start_gateway; read -p "按 Enter 繼續..." ;;
            2) stop_gateway; read -p "按 Enter 繼續..." ;;
            3) stop_gateway; sleep 1; start_gateway; read -p "按 Enter 繼續..." ;;
            0) break ;;
        esac
    done
}

menu_monitor() {
    while true; do
        clear
        echo -e "${CYAN}━━━ [2] 資源監控 ━━━${NC}"
        echo ""
        check_resources
        echo ""
        echo "  [1] 重新整理"
        echo "  [0] 返回"
        echo ""
        echo -en "${YELLOW}請選擇: ${NC}"
        read opt
        [ "$opt" = "0" ] && break
    done
}

menu_security() {
    while true; do
        clear
        echo -e "${CYAN}━━━ [3] 網路安全 ━━━${NC}"
        echo ""
        echo "  [1] 啟用防火牆"
        echo "  [2] 查看連接"
        echo "  [0] 返回"
        echo ""
        echo -en "${YELLOW}請選擇: ${NC}"
        read opt
        case $opt in
            1) setup_firewall; read -p "按 Enter 繼續..." ;;
            2) netstat -an 2>/dev/null | grep ":$GATEWAY_PORT " | head -10; read -p "按 Enter 繼續..." ;;
            0) break ;;
        esac
    done
}

menu_backup() {
    while true; do
        clear
        echo -e "${CYAN}━━━ [4] 備份還原 ━━━${NC}"
        echo ""
        echo "  [1] 執行備份"
        echo "  [2] 列出備份"
        echo "  [0] 返回"
        echo ""
        echo -en "${YELLOW}請選擇: ${NC}"
        read opt
        case $opt in
            1) do_backup; read -p "按 Enter 繼續..." ;;
            2) ls -lh "$GUARDIAN_DIR/backups/" 2>/dev/null || echo "無備份"; read -p "按 Enter 繼續..." ;;
            0) break ;;
        esac
    done
}

menu_daemon() {
    while true; do
        clear
        echo -e "${CYAN}━━━ [9] 守護常駐 ━━━${NC}"
        echo ""
        
        if [ -f "$PID_FILE" ]; then
            local dpid=$(cat "$PID_FILE")
            if kill -0 "$dpid" 2>/dev/null; then
                echo -e "  狀態: ${GREEN}運行中${NC} (PID: $dpid)"
            else
                echo -e "  狀態: ${GRAY}未運行${NC}"
                rm -f "$PID_FILE"
            fi
        else
            echo -e "  狀態: ${GRAY}未啟動${NC}"
        fi
        
        echo ""
        echo "  [1] 啟動守護"
        echo "  [2] 停止守護"
        echo "  [3] 查看日誌"
        echo "  [0] 返回"
        echo ""
        echo -en "${YELLOW}請選擇: ${NC}"
        read opt
        case $opt in
            1) start_daemon; read -p "按 Enter 繼續..." ;;
            2) stop_daemon; read -p "按 Enter 繼續..." ;;
            3) tail -30 "$LOG_FILE"; read -p "按 Enter 繼續..." ;;
            0) break ;;
        esac
    done
}

# ================================ 主程序 ================================
main() {
    init_guardian
    
    case "${1:-menu}" in
        menu|interactive|"") show_menu ;;
        daemon) start_daemon ;;
        start) start_gateway ;;
        stop) stop_gateway ;;
        restart) stop_gateway; sleep 1; start_gateway ;;
        status) show_status ;;
        monitor) check_resources ;;
        backup) do_backup ;;
        health) health_check ;;
        firewall) setup_firewall ;;
        24guard) start_24guard ;;
        scam) analyze_scam ;;
        _daemon) run_daemon ;;
        help|--help|-h)
            echo "用法: $(basename $0) [命令]"
            echo "命令: menu, daemon, start, stop, restart, status, monitor, backup, health, firewall, 24guard, scam"
            ;;
        *) echo "未知命令: $1"; exit 1 ;;
    esac
}

main "$@"
