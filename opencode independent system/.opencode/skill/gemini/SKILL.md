---
name: gemini
description: Gemini CLI - 單次問答、摘要、生成
homepage: https://ai.google.dev/
metadata:
  openclaw:
    emoji: "♊️"
    requires:
      bins: ["gemini"]
    install:
      - id: brew
        kind: brew
        formula: gemini-cli
        bins: ["gemini"]
        label: "安裝 Gemini CLI (brew)"
---

# Gemini CLI

使用 Gemini 進行單次問答、摘要、生成。

---

## 觸發關鍵字

| 關鍵字  | 動作             |
| ------- | ---------------- |
| Gemini  | 詢問 Gemini      |
| AI 問答 | 使用 Gemini 回答 |

---

## 快速開始

```bash
# 基本使用
gemini "Answer this question..."

# 指定模型
gemini --model <name> "Prompt..."

# JSON 輸出
gemini --output-format json "Return JSON"
```

---

## 擴充功能

```bash
# 列表擴充
gemini --list-extensions

# 管理擴充
gemini extensions <command>
```

---

## 注意事項

- 需要驗證時，執行一次 `gemini` 並遵循登入流程
- 為安全起見，避免使用 `--yolo`
