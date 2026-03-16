#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 從外接儲存還原
# 用法: restore-backup.sh <備份路徑>
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_PATH="${1:-}"
HOME_DIR="$HOME"
TARGET_DIR="$HOME_DIR/.openclaw"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ♻️  從備份還原                        ║"
echo "╚══════════════════════════════════════════════════════╝"

# 檢查備份路徑
if [ -z "$BACKUP_PATH" ]; then
    log_error "請指定備份路徑"
    echo ""
    echo "用法: $0 <備份路徑>"
    echo ""
    echo "可用備份:"
    
    # 搜尋備份
    for base in /media /mnt /run/media; do
        if [ -d "$base" ]; then
            find "$base" -maxdepth 4 -type d -name "*OpenClaw*" 2>/dev/null | head -10 | while read path; do
                echo "  $path"
            done
        fi
    done
    exit 1
fi

if [ ! -d "$BACKUP_PATH" ]; then
    # 可能是 tar 檔案
    if [ -f "$BACKUP_PATH" ]; then
        log_info "偵測到 tar 封存檔: $BACKUP_PATH"
        echo ""
        log_warn "tar 還原功能尚未實作"
        echo "請手動解壓縮:"
        echo "  tar -xzf $BACKUP_PATH -C $HOME"
        exit 1
    fi
    log_error "備份不存在: $BACKUP_PATH"
    exit 1
fi

echo ""
log_warn "即將還原備份!"
echo ""
echo "備份: $BACKUP_PATH"
echo "目標: $TARGET_DIR"
echo ""

# 確認
echo -n "確認還原? 這會覆蓋目前配置 (yes/no): "
read confirm

if [ "$confirm" != "yes" ]; then
    log_info "已取消還原"
    exit 0
fi

# 備份當前配置
current_backup="$HOME_DIR/.openclaw_backup_$(date '+%Y%m%d_%H%M%S')"
log_info "備份當前配置到: $current_backup"

if [ -d "$TARGET_DIR" ]; then
    mkdir -p "$current_backup"
    cp -r "$TARGET_DIR"/* "$current_backup/" 2>/dev/null || true
fi

# 還原
log_info "正在還原..."
rm -rf "$TARGET_DIR"
cp -r "$BACKUP_PATH" "$TARGET_DIR"

if [ $? -eq 0 ]; then
    log_info "還原完成!"
    echo ""
    echo "請重啟 OpenClaw Gateway:"
    echo "  openclaw gateway restart"
else
    log_error "還原失敗"
    log_info "正在恢復原始配置..."
    rm -rf "$TARGET_DIR"
    cp -r "$current_backup" "$TARGET_DIR"
    exit 1
fi