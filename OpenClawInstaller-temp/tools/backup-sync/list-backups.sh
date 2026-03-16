#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 列出已存在的備份
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              📋 已存在的備份                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 本地備份
HOME_DIR="$HOME"
echo -e "${CYAN}本地備份:${NC} $HOME_DIR/.openclaw/backups/"
if [ -d "$HOME_DIR/.openclaw/backups" ]; then
    ls -lh "$HOME_DIR/.openclaw/backups/" 2>/dev/null | grep -E "^-" | awk '{print "  " $9 " (" $5 ")"}'
else
    echo "  無"
fi

echo ""

# 外接儲存備份
echo -e "${CYAN}外接儲存備份:${NC}"
found=0
for base in /media /mnt /run/media; do
    if [ -d "$base" ]; then
        while IFS= read -r -d '' path; do
            if [ -d "$path/OpenClaw_Backup_"* ] || [ -d "$path/OpenClaw_Backups" ]; then
                echo ""
                echo "  📁 $path"
                find "$path" -maxdepth 2 -type d -name "*OpenClaw*" 2>/dev/null | while read backup; do
                    size=$(du -sh "$backup" 2>/dev/null | cut -f1)
                    echo "     - $(basename "$backup") ($size)"
                done
                found=1
            fi
        done < <(find "$base" -maxdepth 3 -type d -print0 2>/dev/null)
    fi
done

if [ $found -eq 0 ]; then
    echo "  未檢測到外接儲存備份"
fi

echo ""