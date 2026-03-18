## bun-check Skill 新增 (多平台支援)

### 日期
2026-03-19

### 來源
自製 (基於 Bun 官方文檔)

### 新增內容

| 檔案 | 功能 | 測試狀態 |
|------|------|----------|
| SKILL.md | Skill 說明文件 | ✅ |
| scripts/bun-check.mjs | 主腳本（多平台） | ✅ |

### 功能

- 版本檢查：當前版本 vs 最新版本
- 硬體相容性：CPU 指令集偵測 (AVX/AVX2/AVX512/SSE4/BMI/AES)
- 升級管理：自動升級 + CPU 相容性檢查
- 版本歷史：記錄最近 10 個版本
- 回滾功能：支援回滾到指定版本
- 多平台支援：Linux / macOS / Windows

### 支援平台

| 平台 | CPU 偵測方式 |
|------|-------------|
| Linux | /proc/cpuinfo |
| macOS | sysctl (Intel & Apple Silicon) |
| Windows | wmic |

### 使用方式

```bash
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs        # 基本檢查
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --json # JSON 輸出
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --upgrade # 升級
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --rollback # 回滾
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --history # 版本歷史
```

### 放置位置
~/.opencode/skill/bun-check/