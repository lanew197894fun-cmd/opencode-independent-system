---
name: web-solver
description: 網路解決方案搜尋 - 讓獨立系統連網搜尋問題解決方案
color: "#3F51B5"
---

## 功能說明

連網搜尋問題解決方案，自動找出解決方法。

---

## 搜尋工具

```javascript
// 搜尋問題
await websearch("TypeScript generic error solution", 5)

// 獲取文檔
await webfetch("https://react.dev/reference/react/useState", "markdown")

// 搜尋程式碼範例
await codesearch("React useEffect cleanup pattern", 3000)
```

---

## 搜尋來源

| 類型   | 來源                                     |
| ------ | ---------------------------------------- |
| 文檔   | MDN, Node.js, TypeScript, React, Next.js |
| 問答   | Stack Overflow, GitHub Issues            |
| 程式碼 | GitHub                                   |

---

## 快取優化

### 快取策略

| 搜尋類型   | TTL          | 說明             |
| ---------- | ------------ | ---------------- |
| websearch  | 3600s (1h)   | 解決方案相對穩定 |
| webfetch   | 86400s (24h) | 文檔很少變動     |
| codesearch | 7200s (2h)   | 程式碼範例穩定   |

### 快取鍵命名

```
web:search:{query_hash}
web:fetch:{url_hash}
web:code:{query_hash}
```

### 使用流程

```
搜尋前：
→ tool_cache_get(key: "web:search:{hash}")
→ 有快取：直接返回
→ 無快取：執行搜尋 + 快取結果
```

---

## 何時搜尋

### 應該搜尋

- ✅ 遇到編譯/執行錯誤
- ✅ 不確定的 API 用法
- ✅ 效能優化問題
- ✅ 用戶明確要求搜尋

### 避免搜尋

- ❌ 簡單問題可用已有知識回答
- ❌ 用戶只要求思考
- ❌ 已有快取結果

---

## 搜尋策略

### 精準搜尋

```
"TypeScript error solution"
"React useEffect infinite loop fix"
"site:stackoverflow.com npm error"
```

### 廣泛搜尋

```
"React 效能優化"
"Node.js best practices 2026"
```

---

## 自動整合

### 問題 → 搜尋 → 解決

```
1. 偵測錯誤
2. 分析類型（編譯/執行時/效能）
3. 生成關鍵字
4. 搜尋解決方案
5. 提供建議
```

---

## 手動觸發

- 「搜尋解決方案：[問題]」
- 「查找 [錯誤訊息] 的解法」
- 「查詢 [技術] 文檔」

---

## 安全限制

- 不搜尋敏感資訊（API Keys、密碼）
- 優先使用可信來源（MDN、SO、GitHub）
