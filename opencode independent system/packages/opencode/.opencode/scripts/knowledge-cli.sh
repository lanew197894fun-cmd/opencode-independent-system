#!/bin/bash
#
# ═══════════════════════════════════════════════════════════════════════════
# ║  OpenCode 知識庫 CLI - 一鍵儲存並推送到 GitHub                           ║
# ═══════════════════════════════════════════════════════════════════════════
#
# 使用方法：
#   ./knowledge-cli.sh fact "問題.原因.解決"
#   ./knowledge-cli.sh decision "原則.觸發" 
#   ./knowledge-cli.sh fact "內容" --no-sync
#   ./knowledge-cli.sh -l
#   ./knowledge-cli.sh -s
#
# 選項：
#   fact      - 儲存 fact (問題.原因.解決)
#   decision  - 儲存 decision (原則.觸發)
#   --no-sync - 僅儲存本地，不推送到 GitHub
#   -l        - 列出所有知識
#   -s        - 手動同步到 GitHub
#   -h        - 顯示說明
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE="${1:-.}"
MEMORY_DIR="$WORKTREE/.opencode/memory/topics"
KNOWLEDGE_FILE="$MEMORY_DIR/知識.md"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

show_help() {
    echo "OpenCode 知識庫 CLI"
    echo ""
    echo "使用方式："
    echo "  $0 fact \"問題.原因.解決\"           儲存 fact 並同步"
    echo "  $0 decision \"原則.觸發\"         儲存 decision 並同步"
    echo "  $0 fact \"內容\" --no-sync        僅儲存本地"
    echo "  $0 -l                            列出知識"
    echo "  $0 -s                            手動同步到 GitHub"
    echo ""
}

list_knowledge() {
    if [ ! -f "$KNOWLEDGE_FILE" ]; then
        log_warn "尚無知識記錄"
        return
    fi
    
    echo "## 知識庫內容"
    cat "$KNOWLEDGE_FILE"
}

sync_github() {
    if [ ! -d "$WORKTREE/.git" ]; then
        log_error "不是 Git 倉庫，無法同步"
        return
    fi
    
    cd "$WORKTREE"
    
    if [ -f "$KNOWLEDGE_FILE" ]; then
        git add .opencode/memory/topics/知識.md 2>/dev/null
        git commit -m "knowledge: sync $(date +%Y%m%d-%H%M%S)" 2>/dev/null
        
        if git push origin main 2>/dev/null || git push origin master 2>/dev/null; then
            log_info "已推送到 GitHub"
        else
            log_warn "已 commit 但未推送 (請手動 git push)"
        fi
    else
        log_warn "無知識可同步"
    fi
}

add_knowledge() {
    local type="$1"
    shift
    local content="$*"
    local sync=true
    
    if [ "$content" = "--no-sync" ]; then
        sync=false
        content=""
    elif [[ "$*" == *"--no-sync"* ]]; then
        sync=false
        content="${*%%--no-sync}"
    fi
    
    content="${content//\"/\\\"}"
    
    if [ -z "$content" ]; then
        log_error "請輸入內容"
        return 1
    fi
    
    mkdir -p "$MEMORY_DIR"
    
    local timestamp=$(date +%Y-%m-%d)
    local formatted="## $type $timestamp\n$content"
    
    if [ -f "$KNOWLEDGE_FILE" ]; then
        echo "" >> "$KNOWLEDGE_FILE"
        echo "$formatted" >> "$KNOWLEDGE_FILE"
    else
        echo "$formatted" > "$KNOWLEDGE_FILE"
    fi
    
    log_info "已儲存知識 ($type)"
    
    if [ "$sync" = true ]; then
        sync_github
    else
        log_info "🔒 已禁止上傳 (僅本地儲存)"
    fi
}

case "${1:-}" in
    -h|--help)
        show_help
        ;;
    -l|--list)
        list_knowledge
        ;;
    -s|--sync)
        sync_github
        ;;
    fact|decision)
        add_knowledge "$@"
        ;;
    *)
        show_help
        ;;
esac