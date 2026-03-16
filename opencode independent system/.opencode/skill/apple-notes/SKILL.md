---
name: apple-notes
description: Apple Notes 管理 - 透過 memo CLI 建立、檢視、編輯、刪除、搜尋筆記
homepage: https://github.com/antoniorodr/memo
metadata:
  openclaw:
    emoji: "📝"
    os: ["darwin"]
    requires:
      bins: ["memo"]
    install:
      - id: brew
        kind: brew
        formula: antoniorodr/memo/memo
        bins: ["memo"]
        label: "透過 Homebrew 安裝 memo"
---

# Apple Notes CLI

使用 `memo notes` 管理 Apple Notes。

---

## 觸發關鍵字

| 關鍵字   | 動作         |
| -------- | ------------ |
| 新增筆記 | 建立新筆記   |
| 列表筆記 | 列出所有筆記 |
| 搜尋筆記 | 搜尋筆記     |
| 刪除筆記 | 刪除筆記     |

---

## 設定

```bash
# Homebrew 安裝
brew tap antoniorodr/memo && brew install antoniorodr/memo/memo

# 手動 (pip)
pip install .
```

- 僅 macOS
- 需授予 Automation 權限給 Notes.app

---

## 常用指令

### 檢視筆記

```bash
# 列表所有筆記
memo notes

# 按資料夾篩選
memo notes -f "Folder Name"

# 模糊搜尋
memo notes -s "query"
```

### 建立筆記

```bash
# 互動式建立
memo notes -a

# 快速建立（帶標題）
memo notes -a "Note Title"
```

### 編輯筆記

```bash
memo notes -e
```

### 刪除筆記

```bash
memo notes -d
```

### 移動筆記

```bash
memo notes -m
```

### 匯出筆記

```bash
memo notes -ex
```

---

## 限制

- 無法編輯含有圖片或附件的筆記
- 互動提示可能需要終端機存取

---

## 注意事項

- 僅 macOS
- 需確保 Apple Notes.app 可存取
- 自動化權限：系統偏好設定 > 隱私權與安全性 > 自動化
