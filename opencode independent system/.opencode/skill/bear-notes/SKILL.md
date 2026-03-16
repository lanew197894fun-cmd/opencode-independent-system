---
name: bear-notes
description: Bear Notes 管理 - 透過 grizzly CLI 建立、搜尋、管理筆記
homepage: https://bear.app
metadata:
  openclaw:
    emoji: "🐻"
    os: ["darwin"]
    requires:
      bins: ["grizzly"]
    install:
      - id: go
        kind: go
        module: github.com/tylerwince/grizzly/cmd/grizzly@latest
        bins: ["grizzly"]
        label: "安裝 grizzly (go)"
---

# Bear Notes 操作

使用 `grizzly` 管理 Bear 筆記。

---

## 觸發關鍵字

| 關鍵字    | 動作     |
| --------- | -------- |
| 新增筆記  | 建立筆記 |
| Bear 搜尋 | 搜尋筆記 |

---

## 需求

- 需安裝並執行 Bear app
- 部分操作需 Bear token（存於 `~/.config/grizzly/token`）

---

## 取得 Token

1. 開啟 Bear → Help → API Token → 複製 Token
2. 儲存：`echo "YOUR_TOKEN" > ~/.config/grizzly/token`

---

## 常用指令

### 建立筆記

```bash
echo "Note content here" | grizzly create --title "My Note" --tag work
grizzly create --title "Quick Note" --tag inbox < /dev/null
```

### 開啟/讀取筆記

```bash
grizzly open-note --id "NOTE_ID" --enable-callback --json
```

### 附加文字

```bash
echo "Additional content" | grizzly add-text --id "NOTE_ID" --mode append --token-file ~/.config/grizzly/token
```

### 列表標籤

```bash
grizzly tags --enable-callback --json --token-file ~/.config/grizzly/token
```

### 搜尋筆記

```bash
grizzly open-tag --name "work" --enable-callback --json
```

---

## 常用參數

| 參數              | 說明                |
| ----------------- | ------------------- |
| --dry-run         | 預覽 URL 不執行     |
| --print-url       | 顯示 x-callback-url |
| --enable-callback | 等待 Bear 回應      |
| --json            | JSON 輸出           |
| --token-file      | Token 檔案路徑      |

---

## 設定

優先順序：

1. CLI 參數
2. 環境變數
3. `.grizzly.toml`
4. `~/.config/grizzly/config.toml`

---

## 注意事項

- Bear 需在執行狀態
- 需使用 `--enable-callback` 讀取資料
