---
name: workspace-manager
description: 工作區管理 - 設定與切換專案工作路徑
color: "#00CED1"
autoLoad: false
---

## 用途

讓你可以指定並管理工作區路徑，所有檔案操作都會在指定的工作區內執行。

## 觸發方式

1. **手動觸發**：

   ```
   /workspace
   ```

2. **語義觸發**：
   - 「設定工作區」
   - 「切換工作區」
   - 「設定工作路徑」
   - 「指定專案路徑」

## 使用方式

### 設定工作區

```
/workspace /path/to/your/project
```

或使用相對路徑：

```
/workspace ~/projects/my-app
```

### 查看當前工作區

```
/workspace
```

### 常用工作區快捷設定

| 指令                  | 路徑                                                        |
| --------------------- | ----------------------------------------------------------- |
| `/workspace opencode` | `/home/reamaster/opencode-claw/opencode independent system` |
| `/workspace home`     | `~`                                                         |
| `/workspace projects` | `~/projects`                                                |

## 執行流程

1. **驗證路徑**：確認路徑存在且可存取
2. **顯示資訊**：
   - 路徑資訊
   - 目錄結構（前 20 個項目）
   - Git 狀態（如果是 git 倉庫）
   - 專案類型（Node.js, Python, Rust 等）
3. **設定環境**：將此路徑設為後續操作的預設工作目錄

## 實際命令

```bash
# 驗證路徑
[ -d "<WORKSPACE_PATH>" ] && echo "路徑存在" || echo "路徑不存在"

# 顯示目錄結構
ls -la "<WORKSPACE_PATH>" | head -20

# 檢查 Git 狀態
cd "<WORKSPACE_PATH>" && git status --short 2>/dev/null || echo "非 Git 倉庫"

# 檢查專案類型
[ -f "<WORKSPACE_PATH>/package.json" ] && echo "Node.js 專案"
[ -f "<WORKSPACE_PATH>/Cargo.toml" ] && echo "Rust 專案"
[ -f "<WORKSPACE_PATH>/pyproject.toml" ] && echo "Python 專案"
[ -f "<WORKSPACE_PATH>/go.mod" ] && echo "Go 專案"
```

## 注意事項

- 設定的工作區只在當前對話有效
- 路徑必須是絕對路徑或可解析的家目錄路徑
- 如果路徑不存在，會提示錯誤

---

**載入時間**: 手動觸發時載入
**更新方式**: 修改此檔案後立即生效
