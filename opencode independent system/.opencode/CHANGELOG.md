# 修復日誌

## 2026-03-09

### 程式碼修復

#### packages/app - dialog-custom-provider.tsx

**問題：** TypeScript 類型錯誤，翻譯鍵 `provider.custom.*` 不被識別

**修復：**

1. 移除 `Dialog` 元件的 `transition` 屬性（該 prop 不存在）
2. 建立翻譯函數包裝器，使用類型断言：
   ```typescript
   const t = (key: string, params?: Record<string, any>) => language.t(key as any, params) as string
   ```
3. 更新 `ValidateArgs` 中的 `t` 參數類型為 `(key: string) => string`

**狀態：** ✅ 已修復

---

### 技能優化

#### 新增 fraud-detection 技能

- 位置：`.opencode/skill/fraud-detection/SKILL.md`
- 功能：詐騙訊息偵測
- 精簡程度：從 ~399 行減至 ~120 行

#### 優化現有技能

- ai-memory：新增快取優化章節
- tool-optimizer：新增避免過度工具呼叫章節
- important-notice：新增程式碼精簡原則
- web-solver：精簡並新增快取策略
- system-monitor：精簡並新增快取優化
- security-shield：大幅精簡（638 行 → ~100 行）
- openclaw-integration：精簡並新增快取優化
- self-learning：新增快取優化章節
- ji-san-ji-debug：新增快取優化章節
- user-rules：新增效能優化建議
