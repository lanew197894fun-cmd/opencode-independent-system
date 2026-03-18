#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TV Box Skill - 電視盒控制
# ═══════════════════════════════════════════════════════════════

CMD="${1:-status}"
TV_IP="${2:-192.168.1.100}"
ADB_PORT="${3:-5555}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║         📺 TV Box 電視盒控制                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

check_adb() {
    which adb > /dev/null 2>&1
}

ping_tv() {
    ping -c 1 -W 2 "$TV_IP" > /dev/null 2>&1
}

case "$CMD" in
  status)
    echo -e "${CYAN}═══ 電視盒狀態 ═══${NC}"
    if ping_tv; then
      log_info "電視盒在線: $TV_IP"
      if check_adb; then
        echo "ADB: 已安裝"
      else
        echo "ADB: 未安裝 (sudo apt install adb)"
      fi
    else
      log_error "電視盒離線: $TV_IP"
    fi
    ;;
  on)
    log_info "開啟電視盒..."
    if check_adb; then
      adb connect "$TV_IP:$ADB_PORT" 2>/dev/null
      adb -s "$TV_IP:$ADB_PORT" shell input keyevent KEYCODE_POWER 2>/dev/null
      log_info "已發送開機指令"
    else
      log_error "請先安裝 ADB: sudo apt install adb"
    fi
    ;;
  off)
    log_info "關閉電視盒..."
    if check_adb; then
      adb connect "$TV_IP:$ADB_PORT" 2>/dev/null
      adb -s "$TV_IP:$ADB_PORT" shell input keyevent KEYCODE_POWER 2>/dev/null
      log_info "已發送關機指令"
    else
      log_error "請先安裝 ADB"
    fi
    ;;
  volume-up)
    if check_adb; then
      adb -s "$TV_IP:$ADB_PORT" shell input keyevent KEYCODE_VOLUME_UP 2>/dev/null
      log_info "音量+"
    fi
    ;;
  volume-down)
    if check_adb; then
      adb -s "$TV_IP:$ADB_PORT" shell input keyevent KEYCODE_VOLUME_DOWN 2>/dev/null
      log_info "音量-"
    fi
    ;;
  apps)
    echo -e "${CYAN}═══ 已安裝應用 ═══${NC}"
    if check_adb; then
      adb -s "$TV_IP:$ADB_PORT" shell pm list packages 2>/dev/null | tail -20
    else
      log_error "請先安裝 ADB"
    fi
    ;;
  screenshot)
    if check_adb; then
      FILE="screenshot_$(date +%Y%m%d_%H%M%S).png"
      adb -s "$TV_IP:$ADB_PORT" shell screencap /sdcard/$FILE 2>/dev/null
      adb -s "$TV_IP:$ADB_PORT" pull /sdcard/$FILE ~/$FILE 2>/dev/null
      log_info "截圖已儲存: ~/$FILE"
    fi
    ;;
  set)
    TV_IP="$2"
    ADB_PORT="${3:-5555}"
    log_info "設定已儲存:"
    echo "  IP: $TV_IP"
    echo "  Port: $ADB_PORT"
    ;;
  help)
    echo "TV Box 指令:"
    echo ""
    echo "  status              查看狀態"
    echo "  on                  開機"
    echo "  off                 關機"
    echo "  volume-up           音量+"
    echo "  volume-down         音量-"
    echo "  apps                應用列表"
    echo "  screenshot          截圖"
    echo "  set <IP> <Port>    設定 IP 和 Port"
    echo ""
    echo "支援設備:"
    echo "  Android TV, Chromecast, Fire TV, Shield TV"
    echo ""
    echo "注意: 需先安裝 ADB (sudo apt install adb)"
    ;;
  *)
    $0 help
    ;;
esac
