#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { echo -e "${BLUE}ℹ $1${NC}"; }
success() { echo -e "${GREEN}✓ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

show_help() {
    echo "OpenCode Web 啟動腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -p, --port <連接埠>    指定連接埠 (預設: 3000)"
    echo "  -s, --password <密碼>  設定伺服器密碼"
    echo "  --no-ollama           不自動啟動 Ollama"
    echo "  --open                啟動後自動開啟瀏覽器"
    echo "  -h, --help            顯示說明"
    echo ""
    echo "環境變數:"
    echo "  OPENCODE_SERVER_PASSWORD    伺服器密碼"
    echo "  OPENCODE_PORT              連接埠"
    echo ""
    echo "範例:"
    echo "  $0                        # 使用預設設定啟動"
    echo "  $0 -p 8080               # 使用連接埠 8080"
    echo "  $0 -s mypassword         # 設定密碼"
    echo "  $0 --open                 # 啟動後開瀏覽器"
}

# 預設值
PORT="${OPENCODE_PORT:-3000}"
NO_OLLAMA=false
AUTO_OPEN=false

# 解析參數
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            PORT="$2"
            shift 2
            ;;
        -s|--password)
            export OPENCODE_SERVER_PASSWORD="$2"
            shift 2
            ;;
        --no-ollama)
            NO_OLLAMA=true
            shift
            ;;
        --open)
            AUTO_OPEN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "未知選項: $1"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}OpenCode Web IDE${NC}"
echo "================================"
echo ""

# 清理舊進程
info "清理舊進程..."
pkill -f "opencode serve" 2>/dev/null || true
sleep 1

# 檢查剪貼簿工具
info "檢查剪貼簿工具..."
if ! command -v wl-copy &> /dev/null && ! command -v xclip &> /dev/null && ! command -v xsel &> /dev/null; then
    warn "缺少剪貼簿工具，安裝中..."
    sudo apt update && sudo apt install -y wl-clipboard xclip 2>/dev/null || true
fi

# 檢查 Ollama
if [ "$NO_OLLAMA" = false ]; then
    if ! pgrep -x "ollama" > /dev/null; then
        info "啟動 Ollama..."
        ollama serve &
        sleep 2
    fi
fi

# 顯示密碼狀態
info "檢查伺服器設定..."
if [ -n "${OPENCODE_SERVER_PASSWORD:-}" ]; then
    success "密碼已設定"
else
    warn "未設定密碼，伺服器無保護"
    echo -e "  ${YELLOW}提示: 使用 -s <密碼> 設定密碼${NC}"
fi

# 啟動服務
info "啟動 OpenCode Web 服務..."
echo ""
echo -e "${GREEN}本機訪問: ${NC}http://localhost:$PORT"

# 顯示所有網路 IP
echo -e "${GREEN}網路訪問:${NC}"

# 顯示所有 IPv4 (排除 Docker 虛擬網路)
for ip in $(hostname -I 2>/dev/null | tr ' ' '\n'); do
    if [[ ! "$ip" =~ ^172\.(1[7-9]|2[0-9]|3[0-1])\. ]]; then
        echo -e "  - http://$ip:$PORT"
    fi
done

# 顯示 Tailscale IPv4
TAILSCALE_IPV4=$(ip addr show tailscale0 2>/dev/null | grep inet | grep -v '::' | awk '{print $2}' | cut -d'/' -f1)
if [ -n "$TAILSCALE_IPV4" ]; then
    echo -e "  ${CYAN}⚡ Tailscale: http://$TAILSCALE_IPV4:$PORT${NC}"
fi

# 顯示 IPv6 (非 link-local)
IPV6_GLOBAL=$(ip addr show tailscale0 2>/dev/null | grep 'inet6.*global' | awk '{print $2}' | cut -d'/' -f1)
if [ -n "$IPV6_GLOBAL" ]; then
    echo -e "  ${CYAN}⚡ IPv6: http://[$IPV6_GLOBAL]:$PORT${NC}"
fi

echo ""

# 自動開啟瀏覽器
if [ "$AUTO_OPEN" = true ]; then
    info "開啟瀏覽器..."
    sleep 1
    xdg-open "http://localhost:$PORT" 2>/dev/null || \
    sensible-browser "http://localhost:$PORT" 2>/dev/null || \
    echo "無法自動開啟瀏覽器，請手動訪問"
fi

# 啟動 OpenCode 伺服器（背景執行）
nohup opencode serve --port "$PORT" --hostname "0.0.0.0" --print-logs > /tmp/opencode.log 2>&1 &

# 等待服務啟動
sleep 3

# 檢查服務是否啟動成功
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200"; then
    success "OpenCode 伺服器啟動成功"
else
    error "OpenCode 伺服器啟動失敗"
    tail -30 /tmp/opencode.log
    exit 1
fi
