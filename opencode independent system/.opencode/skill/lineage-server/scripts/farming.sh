#!/bin/bash
set -e

SERVER_DIR="/home/reamaster/REMASTER_KINGDOM"
DOCKER_DIR="/home/reamaster/docker-182"
CACHE_DIR="${HOME}/.opencode/lineage-server/cache"
mkdir -p "$CACHE_DIR"

get_mob_data() {
  local mob_id="$1"
  echo "=== 怪物資料 #${mob_id} ==="
  
  if grep -q "^${mob_id} " "${SERVER_DIR}/data/mob.txt" 2>/dev/null; then
    grep "^${mob_id} " "${SERVER_DIR}/data/mob.txt"
  else
    echo "找不到怪物 ID: $mob_id"
  fi
}

get_map_mobs() {
  local map_id="$1"
  local map_name=""
  
  case "$map_id" in
    0)   map_name="新手村" ;;
    4)   map_name="龍之谷-地龍" ;;
    5)   map_name="龍之谷-水龍" ;;
    6)   map_name="傲慢之塔 1F" ;;
    7)   map_name="傲慢之塔 2F" ;;
    8)   map_name="傲慢之塔 3F" ;;
    100) map_name="荒廢之城" ;;
    200) map_name="銀色騎士團" ;;
    300) map_name="肯特" ;;
    400) map_name="妖魔城" ;;
    4x|41) map_name="火龍窟" ;;
    *)   map_name="地圖 ${map_id}" ;;
  esac
  
  echo "=== 地圖 ${map_id}: ${map_name} ==="
  
  if [[ -f "${SERVER_DIR}/maps/${map_id}.txt" ]]; then
    head -50 "${SERVER_DIR}/maps/${map_id}.txt"
  else
    echo "地圖文件不存在: maps/${map_id}.txt"
    echo ""
    echo "常見地圖:"
    for m in 0 4 5 6 7 8 100 200 300 400; do
      echo "  - $m"
    done
  fi
}

list_spots() {
  local level="${1:-}"
  local map="${2:-}"
  
  echo "=== 練功點列表 ==="
  
  local spots=(
    "4:龍之谷-地龍:60-75:火龍"
    "5:龍之谷-水龍:55-70:水龍"
    "6:傲慢之塔1F:30-40:巨蟻/洞穴怪"
    "7:傲慢之塔2F:35-45:洞穴怪"
    "8:傲慢之塔3F:40-50:異眼"
    "100:荒廢之城:45-60:黑暗妖精"
    "200:銀色騎士團:50-65:騎士團"
    "300:肯特:1-10:初期怪物"
    "400:妖魔城:35-55:妖魔"
    "41:火龍窟:65-80:火龍"
    "70:古龍丁:55-70:古龍"
    "3001:龍之谷:50-70:龍族"
  )
  
  for spot in "${spots[@]}"; do
    IFS=':' read -r m lvl mobs <<< "$spot"
    
    if [[ -n "$map" && "$map" != "$m" ]]; then
      continue
    fi
    
    if [[ -n "$level" ]]; then
      min_lvl="${lvl%-*}"
      max_lvl="${lvl#*-}"
      if [[ "$level" -lt "$min_lvl" || "$level" -gt "$max_lvl" ]]; then
        continue
      fi
    fi
    
    echo "地圖 $m | 等級 $lvl | 怪物: $mobs"
  done
}

map_stats() {
  local map_id="$1"
  
  echo "=== 地圖 ${map_id} 統計 ==="
  
  if [[ -f "${SERVER_DIR}/maps/${map_id}.txt" ]]; then
    local lines=$(wc -l < "${SERVER_DIR}/maps/${map_id}.txt")
    local mobs=$(grep -c "^[^#].*spawn" "${SERVER_DIR}/maps/${map_id}.txt" 2>/dev/null || echo "0")
    echo "總行數: $lines"
    echo "刷怪點: ${mobs:-未知}"
  else
    echo "地圖文件不存在"
  fi
}

list_bosses() {
  echo "=== 王區列表 ==="
  
  local bosses=(
    "4:安塔瑞斯:地龍"
    "5:弗林卡:水龍"
    "41:火龍王:火龍窟"
    "66:巴爾:古龍丁"
    "1001:死亡騎士:隱藏迷宮"
    "2001:龍騎將:龍之谷"
    "3001:龍王:龍之谷深層"
  )
  
  printf "%-8s %-15s %s\n" "地圖" "王名" "地點"
  echo "--------------------------------"
  
  for boss in "${bosses[@]}"; do
    IFS=':' read -r mid name loc <<< "$boss"
    printf "%-8s %-15s %s\n" "$mid" "$name" "$loc"
  done
}

suggest_farming() {
  local level="$1"
  
  if [[ -z "$level" ]]; then
    echo "請輸入等級: lineage farming suggest <level>"
    return
  fi
  
  echo "=== 等級 ${level} 練功建議 ==="
  echo ""
  
  local spots=()
  
  if [[ "$level" -lt 10 ]]; then
    spots=("300:肯特:1-10:初期怪物")
  elif [[ "$level" -lt 30 ]]; then
    spots=("6:傲慢之塔1F:25-40:巨蟻")
  elif [[ "$level" -lt 45 ]]; then
    spots=("7:傲慢之塔2F:35-45" "400:妖魔城:35-55")
  elif [[ "$level" -lt 60 ]]; then
    spots=("8:傲慢之塔3F:40-50" "100:荒廢之城:45-60")
  elif [[ "$level" -lt 70 ]]; then
    spots=("200:銀色騎士團:50-65" "4:龍之谷:55-70")
  else
    spots=("4:龍之谷:60-75" "41:火龍窟:65-80")
  fi
  
  echo "推薦練功點:"
  for spot in "${spots[@]}"; do
    IFS=':' read -r mid name lvl mobs <<< "$spot"
    echo "  📍 地圖 $mid ($name)"
    echo "     等級: $lvl | 怪物: $mobs"
    echo ""
  done
}

cmd_help() {
  cat << EOF
Lineage 農怪管理

用法: lineage farming <command> [args]

指令:
  mob <id>              查看怪物資料
  map <map_id>          查看地圖怪物
  spots [--level N]     查詢練功點
  stats <map_id>        地圖怪物統計
  respawn <map_id>      刷新地圖怪物
  bosses                查詢王區
  suggest <level>       練功建議

範例:
  lineage farming mob 100
  lineage farming map 4
  lineage farming spots --level 50
  lineage farming suggest 55
  lineage farming bosses
EOF
}

case "${1:-}" in
  mob)    get_mob_data "$2" ;;
  map)    get_map_mobs "$2" ;;
  spots)  list_spots "$2" "$3" ;;
  stats)  map_stats "$2" ;;
  bosses) list_bosses ;;
  suggest) suggest_farming "$2" ;;
  help|--help|-h) cmd_help ;;
  *) 
    echo "Lineage 農怪管理"
    echo ""
    echo "用法: lineage farming <command>"
    echo ""
    echo "指令:"
    echo "  mob <id>              查看怪物資料"
    echo "  map <map_id>          查看地圖怪物"
    echo "  spots [--level N]     查詢練功點"
    echo "  stats <map_id>        地圖怪物統計"
    echo "  bosses                查詢王區"
    echo "  suggest <level>       練功建議 (1-80)"
    echo ""
    echo "快速查詢:"
    echo "  lineage farming bosses"
    echo "  lineage farming suggest 55"
    ;;
esac
