#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 同步到外接儲存裝置
# 用法: sync-to-storage.sh <目標路徑>
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-}"
HOME_DIR="$HOME"
SOURCE_DIR="$HOME_DIR/.openclaw"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              📦 同步到外接儲存                    ║"
echo "╚══════════════════════════════════════════════════════╝"

# 檢查目標目錄
if [ -z "$TARGET_DIR" ]; then
    log_error "請指定目標路徑"
    echo ""
    echo "用法: $0 <目標路徑>"
    echo "範例: $0 /media/reamaster/USB"
    exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
    log_error "目錄不存在: $TARGET_DIR"
    exit 1
fi

if [ ! -w "$TARGET_DIR" ]; then
    log_error "目錄不可寫入: $TARGET_DIR"
    exit 1
fi

# 檢查來源目錄
if [ ! -d "$SOURCE_DIR" ]; then
    log_error "來源目錄不存在: $SOURCE_DIR"
    exit 1
fi

# 計算空間
source_size=$(du -sh "$SOURCE_DIR" 2>/dev/null | cut -f1)
target_available=$(df -h "$TARGET_DIR" 2>/dev/null | tail -1 | awk '{print $4}')

echo ""
echo "來源: $SOURCE_DIR (大小: $source_size)"
echo "目標: $TARGET_DIR"
echo "可用空間: $target_available"
echo ""

# 創建備份目錄
timestamp=$(date '+%Y%m%d_%H%M%S')
backup_path="$TARGET_DIR/OpenClaw_Backup_$timestamp"
mkdir -p "$backup_path"

# 排除清單
exclude_args=(
    --exclude='node_modules'
    --exclude='.cache'
    --exclude='backups'
    --exclude='logs'
    --exclude='*.log'
)

log_info "正在同步..."

# 使用 rsync 或 tar
if command -v rsync &> /dev/null; then
    rsync -avh --progress "${exclude_args[@]}" "$SOURCE_DIR/" "$backup_path/" 2>&1
    result=$?
else
    tar -czvhf "$backup_path/openclaw.tar.gz" -C "$HOME_DIR" .openclaw "${exclude_args[@]}" 2>&1
    result=$?
fi

if [ $result -eq 0 ]; then
    backup_size=$(du -sh "$backup_path" 2>/dev/null | cut -f1)
    log_info "同步完成!"
    echo ""
    echo "備份位置: $backup_path"
    echo "備份大小: $backup_size"
    
    # 建立 latest 連結
    ln -sfn "$backup_path" "$TARGET_DIR/OpenClaw_Latest" 2>/dev/null
    log_info "最新備份連結: $TARGET_DIR/OpenClaw_Latest"
    
    # 建立 index
    {
        echo "OpenClaw 備份索引"
        echo "================="
        echo "日期: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "來源: $SOURCE_DIR"
        echo "大小: $backup_size"
    } > "$TARGET_DIR/OpenClaw_Backups/INDEX.txt"
    
    mkdir -p "$TARGET_DIR/OpenClaw_Backups"
    {
        echo "OpenClaw 備份索引"
        echo "================="
        echo "更新: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "最新: $backup_path"
    } > "$TARGET_DIR/OpenClaw_Backups/INDEX.txt"
    
    echo ""
    log_info "備份完成!"
else
    log_error "同步失敗"
    rm -rf "$backup_path"
    exit 1
fi