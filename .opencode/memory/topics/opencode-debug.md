## OpenCode ZodError 修復記錄

### 問題描述
- 首次執行 `opencode run "hello"` 出現 ZodError
- 錯誤內容：id, sessionID, messageID 為 undefined

### 排查過程

1. **Bun 版本檢查**
   - 原始版本：v1.3.8
   - 架構：x86_64 ✅ 支援
   - 升級後：v1.3.11

2. **OpenCode 版本**
   - 版本：1.3.2
   - 路徑：~/.opencode/bin/opencode

3. **智慧技能系統檢查**
   - skillAutoloadPlugin ✅ 已啟用
   - intentRouterPlugin ✅ 已啟用
   - resource-monitor.ts ✅ 正常運作

4. **配置檢查**
   - opencode.json: autoload: [] (空，使用預設)
   - ~/.config/opencode/ 不存在
   - 專案目錄配置正常

### 解決方法

- ZodError 為暫時性問題
- 使用 `--continue` 參數可繞過
- 重新開啟終端機後正常運作

### 智慧技能系統說明（小白適用）

**完全自動化，無需設定**

| 功能套件 | 觸發關鍵字 | 自動載入 |
|---------|-----------|---------|
| memory | 記憶、經驗 | memory-pro |
| debug | 錯誤、bug | ai-debug |
| agent | swarm、多代理 | swarm |
| system | 效能、優化 | system-optimizer |
| backup | 備份、同步 | backup-sync |

### 資源閾值

- 低於 500MB 記憶體：只載入 user-rules
- CPU 負載 > 8：限制載入
