#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 查看配置狀態
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

HOME_DIR="$HOME"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              📊 配置狀態                          ║"
echo "╚══════════════════════════════════════════════════════╝"

echo -e "${CYAN}用戶目錄:${NC} $HOME_DIR/.openclaw"
echo -e "${CYAN}配置目錄:${NC} $HOME_DIR/.opencode"
echo ""

# 用戶技能
echo -e "${CYAN}用戶技能:${NC}"
if [ -d "$HOME_DIR/.opencode/skill" ]; then
    ls -1 "$HOME_DIR/.opencode/skill" 2>/dev/null | sed 's/^/  - /'
else
    echo "  無"
fi

echo ""

# OpenClaw 技能
echo -e "${CYAN}系統技能:${NC} /home/reamaster/openclaw-manager/openclaw/skills"
if [ -d "/home/reamaster/openclaw-manager/openclaw/skills" ]; then
    count=$(ls -1 "/home/reamaster/openclaw-manager/openclaw/skills" 2>/dev/null | wc -l)
    echo "  共 $count 個技能"
fi

echo ""

# OpenClaw 狀態
echo -e "${CYAN}OpenClaw Gateway:${NC}"
if pgrep -f "openclaw.*gateway" > /dev/null; then
    echo -e "  ${GREEN}✓ 運行中"
else
    echo -e "  ${RED}✗ 停止"
fi

echo ""

# 最近的本地備份
echo -e "${CYAN}最近的本地備份:${NC}"
if [ -d "$HOME_DIR/.openclaw/backups" ]; then
    ls -t "$HOME_DIR/.openclaw/backups/" 2>/dev/null | head -3 | while read f; do
        size=$(du -h "$HOME_DIR/.openclaw/backups/$f" 2>/dev/null | cut -f1)
        echo "  - $f ($size)"
    done
else
    echo "  無"
fi

echo ""