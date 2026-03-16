#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 自定義項目同步/備份
# 用法: sync-project.sh <來源路徑> <目標路徑> [選項]
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_PATH="${1:-}"
TARGET_DIR="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
log_info() { echo -e "${GREEN}[✓]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $*"; }
log_error() { echo -e "${RED}[✗]${NC} $*"; }

show_menu() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║        📁 自定義項目同步/備份                    ║"
    echo "╠══════════════════════════════════════════════════════╣"
    echo "║  1. 列出可用項目                                ║"
    echo "║  2. 同步 OpenCode 專案                          ║"
    echo "║  3. 同步 OpenClaw Manager                       ║"
    echo "║  4. 同步自訂目錄                                ║"
    echo "║  5. 同步多個專案                                ║"
    echo "║  0. 離開                                         ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    echo -n "請選擇 [0-5]: "
    read choice
    
    case $choice in
        1) list_projects ;;
        2) sync_opencode ;;
        3) sync_openclaw_manager ;;
        4) sync_custom ;;
        5) sync_multiple ;;
        0) exit 0 ;;
        *) log_error "無效選擇" ;;
    esac
}

list_projects() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║              📋 可用項目                          ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    
    local projects=(
        "$HOME/openclaw-manager:OpenClaw Manager 主程式"
        "$HOME/openclaw-manager/openclaw:OpenClaw 龍蝦系統"
        "$HOME/openclaw-manager/opencode independent system:OpenCode 開發環境"
        "$HOME/.opencode:OpenCode 配置"
        "$HOME/.openclaw:OpenClaw 配置"
    )
    
    for p in "${projects[@]}"; do
        path="${p%%:*}"
        desc="${p##*:}"
        
        if [ -d "$path" ]; then
            size=$(du -sh "$path" 2>/dev/null | cut -f1)
            echo -e "  ${CYAN}$path${NC}"
            echo "     $desc"
            echo "     大小: $size"
            echo ""
        else
            echo -e "  ${RED}$path${NC} (不存在)"
            echo "     $desc"
            echo ""
        fi
    done
    
    echo "使用方式:"
    echo "  $SCRIPT_DIR/sync-project.sh <來源> <目標>"
    echo ""
    echo "範例:"
    echo "  $SCRIPT_DIR/sync-project.sh /home/reamaster/openclaw-manager/openclaw /media/reamaster/USB/backup"
    echo ""
}

sync_opencode() {
    SOURCE_PATH="$HOME/openclaw-manager/opencode independent system"
    TARGET_DIR="$HOME/OpenClaw_Backups/opencode_dev"
    do_sync
}

sync_openclaw_manager() {
    SOURCE_PATH="$HOME/openclaw-manager"
    TARGET_DIR="$HOME/OpenClaw_Backups/openclaw_manager"
    do_sync
}

sync_custom() {
    echo ""
    echo "請輸入來源路徑:"
    read SOURCE_PATH
    
    if [ ! -d "$SOURCE_PATH" ]; then
        log_error "路徑不存在: $SOURCE_PATH"
        return 1
    fi
    
    echo "請輸入目標路徑:"
    read TARGET_DIR
    
    if [ -z "$TARGET_DIR" ]; then
        log_error "請輸入目標路徑"
        return 1
    fi
    
    do_sync
}

sync_multiple() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║              🔄 同步多個專案                       ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    
    # 檢測外接儲存
    echo "檢測外接儲存..."
    target_base=""
    
    for base in /media /mnt /run/media; do
        if [ -d "$base" ]; then
            for user_dir in "$base"/*; do
                if [ -d "$user_dir" ] && [ -w "$user_dir" ]; then
                    target_base="$user_dir"
                    break 2
                fi
            done
        fi
    done
    
    if [ -z "$target_base" ]; then
        log_error "未檢測到外接儲存"
        return 1
    fi
    
    echo "目標: $target_base"
    echo ""
    
    # 同步多個項目
    declare -A projects=(
        ["openclaw_manager"]="$HOME/openclaw-manager"
        ["opencode_dev"]="$HOME/openclaw-manager/opencode independent system"
        ["openclaw_config"]="$HOME/.openclaw"
        ["opencode_config"]="$HOME/.opencode"
    )
    
    for name in "${!projects[@]}"; do
        source="${projects[$name]}"
        if [ -d "$source" ]; then
            SOURCE_PATH="$source"
            TARGET_DIR="$target_base/Project_Backups/${name}_$(date '+%Y%m%d')"
            echo "同步: $name..."
            do_sync
        fi
    done
    
    log_info "多項目同步完成!"
}

do_sync() {
    if [ -z "$SOURCE_PATH" ] || [ -z "$TARGET_DIR" ]; then
        log_error "請指定來源和目標"
        echo "用法: $0 <來源路徑> <目標路徑>"
        return 1
    fi
    
    if [ ! -d "$SOURCE_PATH" ]; then
        log_error "來源目錄不存在: $SOURCE_PATH"
        return 1
    fi
    
    # 創建目標目錄
    mkdir -p "$TARGET_DIR"
    
    if [ ! -w "$(dirname "$TARGET_DIR")" ]; then
        log_error "目標目錄不可寫入"
        return 1
    fi
    
    # 計算空間
    source_size=$(du -sh "$SOURCE_PATH" 2>/dev/null | cut -f1)
    target_available=$(df -h "$(dirname "$TARGET_DIR")" 2>/dev/null | tail -1 | awk '{print $4}')
    
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║              📦 同步項目                          ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
    echo "來源: $SOURCE_PATH (大小: $source_size)"
    echo "目標: $TARGET_DIR"
    echo "可用空間: $target_available"
    echo ""
    
    # 排除清單
    exclude_args=(
        --exclude='node_modules'
        --exclude='.cache'
        --exclude='dist'
        --exclude='*.log'
    )
    
    log_info "正在同步..."
    
    # 使用 rsync 或 tar
    if command -v rsync &> /dev/null; then
        rsync -avh --progress "${exclude_args[@]}" "$SOURCE_PATH/" "$TARGET_DIR/" 2>&1
    else
        tar -czvhf "$TARGET_DIR.tar.gz" -C "$(dirname "$SOURCE_PATH")" "$(basename "$SOURCE_PATH")" "${exclude_args[@]}" 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        backup_size=$(du -sh "$TARGET_DIR" 2>/dev/null | cut -f1)
        log_info "同步完成!"
        echo ""
        echo "備份大小: $backup_size"
        
        # 記錄缺少的套件
        check_missing_packages "$SOURCE_PATH" "$TARGET_DIR"
    else
        log_error "同步失敗"
        return 1
    fi
}

# 檢查並記錄缺少的套件
check_missing_packages() {
    local source="$1"
    local target="$2"
    local missing_file="$target/MISSING_PACKAGES.txt"
    local has_missing=0
    
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║              📋 套件檢查報告                      ║"
    echo "╚══════════════════════════════════════════════════════╝"
    
    > "$missing_file"
    echo "========================================" >> "$missing_file"
    echo "套件檢查報告" >> "$missing_file"
    echo "同步日期: $(date '+%Y-%m-%d %H:%M:%S')" >> "$missing_file"
    echo "來源: $source" >> "$missing_file"
    echo "========================================" >> "$missing_file"
    echo "" >> "$missing_file"
    
    # 檢查 package.json (Node.js)
    if [ -f "$source/package.json" ]; then
        echo "📦 Node.js 專案檢測" >> "$missing_file"
        echo "  package.json 存在" >> "$missing_file"
        echo "  需要執行: cd $source && pnpm install" >> "$missing_file"
        
        # 檢查是否有 pnpm-lock.yaml 或 package-lock.json
        if [ -f "$source/pnpm-lock.yaml" ]; then
            echo "  建議使用: pnpm install" >> "$missing_file"
        elif [ -f "$source/package-lock.json" ]; then
            echo "  建議使用: npm install" >> "$missing_file"
        fi
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 requirements.txt (Python)
    if [ -f "$source/requirements.txt" ]; then
        echo "🐍 Python 專案檢測" >> "$missing_file"
        echo "  requirements.txt 存在" >> "$missing_file"
        echo "  需要執行: pip install -r requirements.txt" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 Cargo.toml (Rust)
    if [ -f "$source/Cargo.toml" ]; then
        echo "🦀 Rust 專案檢測" >> "$missing_file"
        echo "  Cargo.toml 存在" >> "$missing_file"
        echo "  需要執行: cargo build" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 go.mod (Go)
    if [ -f "$source/go.mod" ]; then
        echo "🐹 Go 專案檢測" >> "$missing_file"
        echo "  go.mod 存在" >> "$missing_file"
        echo "  需要執行: go mod download" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 Gemfile (Ruby)
    if [ -f "$source/Gemfile" ]; then
        echo "💎 Ruby 專案檢測" >> "$missing_file"
        echo "  Gemfile 存在" >> "$missing_file"
        echo "  需要執行: bundle install" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 composer.json (PHP)
    if [ -f "$source/composer.json" ]; then
        echo "🐘 PHP 專案檢測" >> "$missing_file"
        echo "  composer.json 存在" >> "$missing_file"
        echo "  需要執行: composer install" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 pom.xml (Java)
    if [ -f "$source/pom.xml" ]; then
        echo "☕ Java 專案檢測" >> "$missing_file"
        echo "  pom.xml 存在" >> "$missing_file"
        echo "  需要執行: mvn install" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 檢查 build.gradle (Android/Gradle)
    if [ -f "$source/build.gradle" ] || [ -f "$source/build.gradle.kts" ]; then
        echo "📱 Android 專案檢測" >> "$missing_file"
        echo "  build.gradle 存在" >> "$missing_file"
        echo "  需要執行: ./gradlew build" >> "$missing_file"
        echo "" >> "$missing_file"
        has_missing=1
    fi
    
    # 總結
    echo "========================================" >> "$missing_file"
    echo "安裝命令總結" >> "$missing_file"
    echo "========================================" >> "$missing_file"
    
    if [ -f "$source/package.json" ]; then
        echo "cd $source && pnpm install" >> "$missing_file"
    fi
    if [ -f "$source/requirements.txt" ]; then
        echo "pip install -r $source/requirements.txt" >> "$missing_file"
    fi
    if [ -f "$source/go.mod" ]; then
        echo "cd $source && go mod download" >> "$missing_file"
    fi
    if [ -f "$source/Cargo.toml" ]; then
        echo "cd $source && cargo build" >> "$missing_file"
    fi
    
    # 顯示結果
    if [ $has_missing -eq 1 ]; then
        echo ""
        log_info "套件記錄已保存: MISSING_PACKAGES.txt"
        echo ""
        cat "$missing_file"
    else
        echo "  無需額外套件" >> "$missing_file"
        log_info "無需記錄套件"
    fi
}

# 主程式
case "${1:-menu}" in
    menu) show_menu ;;
    list) list_projects ;;
    sync) do_sync ;;
    help|--help|-h)
        echo "用法: $0 {command} [參數]"
        echo ""
        echo "命令:"
        echo "  menu           互動選單"
        echo "  list           列出可用項目"
        echo "  sync           同步（需要來源和目標）"
        echo ""
        echo "範例:"
        echo "  $0 menu"
        echo "  $0 sync /path/to/project /media/USB/backup"
        ;;
    *) do_sync ;;
esac