#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 本地備份
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="$HOME"
BACKUP_DIR="$HOME_DIR/.openclaw/backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              💾 本地備份                           ║"
echo "╚══════════════════════════════════════════════════════╝"

mkdir -p "$BACKUP_DIR"

timestamp=$(date '+%Y%m%d_%H%M%S')
backup_file="$BACKUP_DIR/openclaw_backup_$timestamp.tar.gz"

log_info "正在備份..."

tar -czf "$backup_file" -C "$HOME_DIR" .openclaw \
    --exclude='node_modules' \
    --exclude='.cache' \
    --exclude='backups' \
    --exclude='logs' \
    --exclude='*.log' 2>/dev/null

if [ -f "$backup_file" ]; then
    backup_size=$(du -h "$backup_file" | cut -f1)
    log_info "本地備份完成!"
    echo ""
    echo "備份位置: $backup_file"
    echo "備份大小: $backup_size"
    
    # 清理舊備份（保留最近 5 個）
    cd "$BACKUP_DIR" && ls -t openclaw_backup_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm 2>/dev/null
    
    backup_count=$(ls -1 openclaw_backup_*.tar.gz 2>/dev/null | wc -l)
    log_info "本地備份數量: $backup_count"
else
    log_error "備份失敗"
    exit 1
fi