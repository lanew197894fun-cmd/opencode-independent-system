## 獨立架構命名重構記錄

### 日期
2026-03-24

### 背景
- 開發代號「計散機」(ji-san-ji) 是 獨立架構 AI 的初期命名
- 原因：開發時以「計算機」為核心功能測試，後來演變成完整 AI 系統
- 為避免混淆，正式命名為「獨立架構」(Independent Architecture)

### 更名的檔案與變更

| 類型 | 舊名稱 | 新名稱 |
|------|--------|--------|
| 資料夾 | `ji-san-ji/` | `independent-architecture/` |
| 類別 | `JiSanJiSystem` | `IndependentArchitectureSystem` |
| 類別 | `JiSanJiCLI` | `IndependentArchitectureCLI` |
| 目錄 | `~/.ji-san-ji/` | `~/.independent-architecture/` |
| Skill | `independent-debug` | `independent-architecture` |
| Skill | `ji-san-ji-debug` | `independent-architecture-debug` |
| 文檔 | `JI_SAN_JI_FRAMEWORK.md` | `INDEPENDENT_ARCHITECTURE_FRAMEWORK.md` |

### 更新的目錄結構

```
independent-architecture/
├── cli/                    # CLI 引擎
│   ├── cli-engine.ts       # IndependentArchitectureCLI
│   ├── repl.ts
│   └── i18n.ts
├── cli-v2/                # CLI v2
├── plugin-system/          # 插件系統
│   ├── index.ts           # plugin-bundle name 更新
│   └── 各 plugin         # 目錄路徑更新
├── start.js               # 啟動腳本
├── package.json           # name/main 更新
└── *.ts                  # 各模組 log service 更新

.opencode/skill/
├── independent-architecture/        # 原 independent-debug
└── independent-architecture-debug/   # 原 ji-san-ji-debug
```

### 更新後的 log service 名稱

| 模組 | 舊 log service | 新 log service |
|------|---------------|----------------|
| 主系統 | `ji-san-ji-system` | `independent-architecture-system` |
| 模型 | `ji-san-ji-model` | `independent-architecture-model` |
| 知識庫 | `ji-san-ji-knowledge` | `independent-architecture-knowledge` |
| 記憶 | `ji-san-ji-memory` | `independent-architecture-memory` |
| 監控 | `ji-san-ji-monitor` | `independent-architecture-monitor` |
| 搜尋 | `ji-san-ji-search` | `independent-architecture-search` |
| 問題求解 | `ji-san-ji-problem-solver` | `independent-architecture-problem-solver` |
| 安全 | `ji-san-ji-security` | `independent-architecture-security` |

### 未更動的引用（預期行為）

- 外部腳本可能仍有 `ji-san-ji` 引用（需個別更新）
- FIXES.md 內的歷史路徑引用（保持準確性）
- 可能的 `.ji-san-ji` 目錄（需手動遷移資料）

### 驗證方法

```bash
# 搜尋殘留引用
grep -r "ji-san-ji\|JiSanJi\|計散機\|計算機" /home/reamaster/opencode-manager/opencode\ independent\ system/

# 檢查目錄結構
ls -la /home/reamaster/opencode-manager/opencode\ independent\ system/independent-architecture/
```
