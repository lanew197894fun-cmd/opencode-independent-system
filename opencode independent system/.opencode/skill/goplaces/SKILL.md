---
name: goplaces
description: Google Places API (New) CLI - 文字搜尋、地點詳情、評論
homepage: https://github.com/steipete/goplaces
metadata:
  openclaw:
    emoji: "📍"
    requires:
      bins: ["goplaces"]
      env: ["GOOGLE_PLACES_API_KEY"]
    primaryEnv: "GOOGLE_PLACES_API_KEY"
    install:
      - id: brew
        kind: brew
        formula: steipete/tap/goplaces
        bins: ["goplaces"]
        label: "安裝 goplaces (brew)"
---

# Google Places 查詢

使用 goplaces CLI 查詢 Google Places API。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 搜尋地點 | 搜尋地點 |
| 地點詳情 | 取得詳情 |
| 餐廳     | 搜尋餐廳 |

---

## 安裝

```bash
brew install steipete/tap/goplaces
```

---

## 設定

- 必要：`GOOGLE_PLACES_API_KEY`
- 可選：`GOOGLE_PLACES_BASE_URL`

---

## 常用指令

```bash
# 搜尋
goplaces search "coffee" --open-now --min-rating 4 --limit 5

# 位置偏重
goplaces search "pizza" --lat 40.8 --lng -73.9 --radius-m 3000

# 分頁
goplaces search "pizza" --page-token "NEXT_PAGE_TOKEN"

# 解析
goplaces resolve "Soho, London" --limit 5

# 詳情
goplaces details <place_id> --reviews

# JSON
goplaces search "sushi" --json
```

---

## 注意事項

- `--no-color` 或 `NO_COLOR` 停用 ANSI 顏色
- 價格等級：0..4（免費 → 昂貴）
- 類型篩選僅接受一個 `--type` 值
