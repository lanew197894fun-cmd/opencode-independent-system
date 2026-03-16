#!/bin/bash
# ollama-memory-manager.sh - Ollama 模型記憶體管理腳本

THRESHOLD=${1:-85}  # 預設閾值 85%

get_memory_usage() {
    free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}'
}

check_and_optimize() {
    local usage=$(get_memory_usage)
    
    echo "=== Ollama 記憶體管理 ==="
    echo "當前記憶體使用率: ${usage}%"
    echo "閾值: ${THRESHOLD}%"
    echo ""
    
    if [ "$usage" -gt "$THRESHOLD" ]; then
        echo "⚠️  記憶體使用率過高，正在卸載模型..."
        
        # 顯示当前加载的模型
        echo ""
        echo "已載入的模型:"
        ollama list 2>/dev/null || echo "Ollama 未運行"
        echo ""
        
        # 停止 Ollama
        pkill -f "ollama serve" 2>/dev/null
        sleep 1
        
        local new_usage=$(get_memory_usage)
        echo "✅ 已釋放模型記憶體"
        echo "優化後記憶體使用率: ${new_usage}%"
    else
        echo "✅ 記憶體使用率正常"
        echo ""
        echo "已載入的模型:"
        ollama list 2>/dev/null || echo "Ollama 未運行"
    fi
}

show_help() {
    echo "用法: $0 [閾值]"
    echo ""
    echo "參數:"
    echo "  閾值     記憶體使用率閾值 (預設: 85)"
    echo ""
    echo "範例:"
    echo "  $0        # 使用預設閾值 85%"
    echo "  $0 70     # 使用自訂閾值 70%"
    echo ""
    echo "常用命令:"
    echo "  ollama list              # 查看已載入模型"
    echo "  ollama stop <model>      # 停止特定模型"
    echo "  pkill -f ollama          # 停止所有模型"
}

case "$1" in
    -h|--help|help)
        show_help
        ;;
    *)
        check_and_optimize
        ;;
esac
