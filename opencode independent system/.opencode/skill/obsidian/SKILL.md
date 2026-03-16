---
name: obsidian
description: Obsidian Vault 管理 - 透過 obsidian-cli
homepage: https://help.obsidian.md
metadata:
  openclaw:
    emoji: "💎"
    requires:
      bins: ["obsidian-cli"]
    install:
      - id: brew
        kind: brew
        formula: yakitrak/yakitrak/obsidian-cli
        bins: ["obsidian-cli"]
        label: "安裝 obsidian-cli (brew)"
---

# Obsidian 操作

Obsidian vault = 普通資料夾。

---

## 觸發關鍵字

| 關鍵字        | 動作       |
| ------------- | ---------- |
| Obsidian      | 管理 vault |
| 新增筆記      | 建立筆記   |
| Obsidian 搜尋 | 搜尋內容   |

---

## Vault 結構

- 筆記：`.md` 檔案
- 設定：`.obsidian/`
- Canvas：`.canvas`
- 附件：自訂資料夾

---

## 找到 Vault

```bash
# 讀取設定
~/Library/Application Support/obsidian/obsidian.json

# 預設 vault
obsidian-cli print-default --path-only
```

---

## 常用指令

### 設定預設

```bash
obsidian-cli set-default "<vault-folder-name>"
```

### 搜尋

```bash
obsidian-cli search "query"
obsidian-cli search-content "query"
```

### 建立

```bash
obsidian-cli create "Folder/New note" --content "..." --open
```

### 移動

```bash
obsidian-cli move "old/path/note" "new/path/note"
```

### 刪除

```bash
obsidian-cli delete "path/note"
```

---

## 注意事項

- 勿寫入隱藏資料夾
- 優先直接編輯 .md 檔案
