#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 檢測外接儲存裝置
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              🔌 檢測外接儲存裝置                   ║"
echo "╚══════════════════════════════════════════════════════╝"

# 搜尋可能的掛載點
mount_points=()

# 只檢測最上層的掛載點
for base in /media /mnt /run/media; do
    if [ -d "$base" ]; then
        # 取得第一層子目錄（用戶掛載點）
        for user_dir in "$base"/*; do
            if [ -d "$user_dir" ] && [ -r "$user_dir" ] && [ -w "$user_dir" ]; then
                # 排除系統目錄
                basename=$(basename "$user_dir")
                if [[ ! "$basename" == .* ]]; then
                    mount_points+=("$user_dir")
                fi
            fi
        done
    fi
done

if [ ${#mount_points[@]} -eq 0 ]; then
    log_warn "未檢測到外接儲存裝置"
    echo ""
    echo "請確保 USB 或外接硬碟已連接並掛載"
    echo ""
    echo "常見掛載點:"
    echo "  /media/reamaster/USB_NAME"
    echo "  /mnt/USB_NAME"
    exit 1
fi

echo "找到 ${#mount_points[@]} 個儲存位置:"
echo ""

i=1
for mp in "${mount_points[@]}"; do
    size=$(df -h "$mp" 2>/dev/null | tail -1 | awk '{print $2}')
    available=$(df -h "$mp" 2>/dev/null | tail -1 | awk '{print $4}')
    echo "  $i. $mp"
    echo "     大小: $size | 可用: $available"
    echo ""
    i=$((i + 1))
done

echo "使用方法:"
echo "  $SCRIPT_DIR/toolbox.sh sync <路徑>"
echo "  # 例如: $SCRIPT_DIR/toolbox.sh sync ${mount_points[0]}"
echo ""