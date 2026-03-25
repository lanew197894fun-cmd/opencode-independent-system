## 問題描述
- 技能自動載入：第一次發訊息無反饋，第二次才出現反饋
- 發生於 OpenCode 獨立系統

## 查證過程

### 1. 程式碼追蹤
- `src/plugin/index.ts`: INTERNAL_PLUGINS 延遲載入
- `src/plugin/skill-autoload.ts:65`: `isFirstMessage` 是全域變數（Closure），非每 session
- `src/plugin/intent-router.ts:157`: 有 `sessionLoads` Map 追蹤每 session 載入狀態

### 2. Hook 呼叫順序（src/session/prompt.ts:1295-1308）
```
Plugin.trigger("chat.message", input, output)
  → skillAutoloadPlugin.chat.message (isFirstMessage=true)
  → intentRouterPlugin.chat.message  
  → memoryProPlugin.chat.message
```

### 3. 發現的可能原因
1.  Plugin 初始化時 `isFirstMessage` 為 true
2.  第一個訊息進來時觸發載入，但 feedback 加入 output.parts 的時機可能晚於 response 輸出
3.  Session 追蹤：skill-autoload 使用全域 isFirstMessage，intent-router 使用 sessionLoads Map

## 待修復
- 確認 skill-autoload 是否應該 per-session 而非全域
- 檢查 output.parts 加入時機是否正確
- 確認 Plugin.trigger 是否為 async 正確等待
