---
name: nano-pdf
description: PDF 編輯 - 使用自然語言指令編輯 PDF
homepage: https://pypi.org/project/nano-pdf/
metadata:
  openclaw:
    emoji: "📄"
    requires:
      bins: ["nano-pdf"]
    install:
      - id: uv
        kind: uv
        package: nano-pdf
        bins: ["nano-pdf"]
        label: "安裝 nano-pdf (uv)"
---

# PDF 編輯

使用 `nano-pdf` 以自然語言指令編輯 PDF。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 編輯 PDF | 修改 PDF |
| PDF 修改 | 編輯頁面 |

---

## 使用

```bash
nano-pdf edit deck.pdf 1 "Change the title to 'Q3 Results' and fix the typo in the subtitle"
```

---

## 注意

- 頁碼可能 0-based 或 1-based
- 輸出前務必檢查
