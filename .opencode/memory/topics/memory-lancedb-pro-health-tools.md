## memory-lancedb-pro 健康檢查工具新增

### 日期
2026-03-19

### 來源
CortexReach/toolbox (GitHub)
- Repo: https://github.com/CortexReach/toolbox
- Path: memory-lancedb-pro-setup/scripts/

### 新增內容

| 檔案 | 功能 | 測試狀態 |
|------|------|----------|
| memory-selfcheck.mjs | 完整能力評估 (embedding/rerank/hostModel) | ✅ 正常運作 |
| probe-endpoint.mjs | 端點探測 (支援 5 種 preset) | ✅ 正常運作 |
| config-validate.mjs | 配置驗證 | ✅ 正常運作 |

### 放置位置
~/.opencode/skill/memory-lancedb-pro/scripts/

### 用途
讓 OpenCode 可以自我檢測記憶系統健康狀態，包括：
- API 端點可用性
- Embedding 向量品質
- Rerank 功能
- 配置欄位驗證
- 版本偵測與升級

### 參考
SKILL.md 已更新，包含完整使用說明