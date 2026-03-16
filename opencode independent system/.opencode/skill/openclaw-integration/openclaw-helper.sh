#!/bin/bash
# openclaw-helper.sh - OpenClaw 指令幫手腳本

# OpenClaw 路徑
OPENCLAW_PATH="/home/reamaster/opencode-claw/openclaw main"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 切換到 OpenClaw 目錄
cd_openclaw() {
    if [ -d "$OPENCLAW_PATH" ]; then
        cd "$OPENCLAW_PATH" || return 1
    else
        echo -e "${RED}錯誤：OpenClaw 目錄不存在: $OPENCLAW_PATH${NC}"
        return 1
    fi
}

# 檢查 OpenClaw 是否可用
check_openclaw() {
    cd_openclaw || return 1
    if ! command -v openclaw &> /dev/null; then
        echo -e "${RED}錯誤：openclaw 命令不可用${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ OpenClaw 可用${NC}"
    return 0
}

# 顯示幫助
show_help() {
    echo -e "${BLUE}=== OpenClaw 指令幫手 ===${NC}"
    echo ""
    echo "用法: $0 <指令> [參數]"
    echo ""
    echo "指令:"
    echo -e "  ${GREEN}search <查詢>${NC}      搜尋記憶"
    echo -e "  ${GREEN}list [limit]${NC}        列出記憶"
    echo -e "  ${GREEN}status${NC}              查看狀態"
    echo -e "  ${GREEN}sessions${NC}            列出對話"
    echo -e "  ${GREEN}session-search <關鍵字>${NC}  搜尋對話"
    echo -e "  ${GREEN}health${NC}              健康檢查"
    echo ""
    echo "範例:"
    echo "  $0 search TypeScript error"
    echo "  $0 list 10"
    echo "  $0 sessions"
}

# 搜尋記憶
cmd_search() {
    check_openclaw || return 1
    local query="$*"
    if [ -z "$query" ]; then
        echo -e "${RED}錯誤：請輸入搜尋關鍵字${NC}"
        return 1
    fi
    echo -e "${BLUE}搜尋: $query${NC}"
    openclaw memory search "$query"
}

# 列出記憶
cmd_list() {
    check_openclaw || return 1
    local limit="${1:-10}"
    echo -e "${BLUE}列出記憶 (limit: $limit)${NC}"
    openclaw memory list --limit "$limit"
}

# 狀態
cmd_status() {
    check_openclaw || return 1
    echo -e "${BLUE}記憶狀態:${NC}"
    openclaw memory status
}

# 列出對話
cmd_sessions() {
    check_openclaw || return 1
    local limit="${1:-10}"
    echo -e "${BLUE}對話列表 (limit: $limit)${NC}"
    openclaw sessions list --limit "$limit"
}

# 搜尋對話
cmd_session_search() {
    check_openclaw || return 1
    local query="$*"
    if [ -z "$query" ]; then
        echo -e "${RED}錯誤：請輸入搜尋關鍵字${NC}"
        return 1
    fi
    echo -e "${BLUE}搜尋對話: $query${NC}"
    openclaw sessions search "$query"
}

# 健康檢查
health_check() {
    echo -e "${BLUE}=== OpenClaw 健康檢查 ===${NC}"
    echo ""
    
    # 檢查目錄
    if [ -d "$OPENCLAW_PATH" ]; then
        echo -e "${GREEN}✓ OpenClaw 目錄: $OPENCLAW_PATH${NC}"
    else
        echo -e "${RED}✗ OpenClaw 目錄不存在${NC}"
        return 1
    fi
    
    cd_openclaw || return 1
    echo ""
    
    # 檢查 openclaw 命令
    if command -v openclaw &> /dev/null; then
        echo -e "${GREEN}✓ openclaw 命令可用${NC}"
        openclaw --version
    else
        echo -e "${RED}✗ openclaw 命令不可用${NC}"
    fi
    echo ""
    
    # 檢查記憶狀態
    echo -e "${YELLOW}記憶狀態:${NC}"
    openclaw memory status 2>/dev/null || echo "無法取得記憶狀態"
}

# 主程式
case "${1:-help}" in
    search)
        shift
        cmd_search "$@"
        ;;
    list)
        cmd_list "${2:-10}"
        ;;
    status)
        cmd_status
        ;;
    sessions)
        cmd_sessions "${2:-10}"
        ;;
    session-search)
        shift
        cmd_session_search "$@"
        ;;
    health|check)
        health_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}未知指令: $1${NC}"
        show_help
        exit 1
        ;;
esac
