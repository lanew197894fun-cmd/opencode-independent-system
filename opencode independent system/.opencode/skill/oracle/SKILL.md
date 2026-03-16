---
name: oracle
description: Oracle CLI 最佳實踐 - 提示詞與檔案打包
homepage: https://askoracle.dev
metadata:
  openclaw:
    emoji: "🧿"
    requires:
      bins: ["oracle"]
    install:
      - id: node
        kind: node
        package: "@steipete/oracle"
        bins: ["oracle"]
        label: "安裝 oracle (node)"
---

# Oracle CLI

將提示詞與檔案打包成單次請求。

---

## 觸發關鍵字

| 關鍵字  | 動作             |
| ------- | ---------------- |
| oracle  | 使用 oracle 查詢 |
| AI 分析 | 委派 AI 分析     |

---

## 快速開始

```bash
# 預覽（不花費 tokens）
oracle --dry-run summary -p "<task>" --file "src/**"

# Token 報告
oracle --dry-run summary --files-report -p "<task>" --file "src/**"

# Browser 執行（主要路徑）
oracle --engine browser --model gpt-5.2-pro -p "<task>" --file "src/**"
```

---

## 檔案附加

```bash
# 包含
--file "src/**"
--file src/index.ts

# 排除
--file "src/**" --file "!src/**/*.test.ts"
```

---

## 引擎

- `api`：使用 API
- `browser`：使用瀏覽器（預設）

---

## Sessions

```bash
# 列表
oracle status --hours 72

# 附加
oracle session <id> --render
```

---

## 提示詞模板

包含：

- 專案簡報（stack、build/test 命令）
- 檔案位置
- 確切問題 + 嘗試過的 + 錯誤訊息
- 限制條件
- 期望輸出
