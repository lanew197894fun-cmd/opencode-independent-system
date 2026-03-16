---
name: weather
description: 取得天氣與預報 - 使用 wttr.in 或 Open-Meteo，無需 API Key
homepage: https://wttr.in/:help
metadata:
  openclaw:
    emoji: "🌤️"
    requires:
      bins: ["curl"]
---

# 天氣查詢

查詢各地天氣狀況與預報。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 天氣     | 查詢天氣 |
| 溫度     | 查詢溫度 |
| 會下雨嗎 | 查詢降雨 |
| 天氣預報 | 查詢預報 |

---

## 使用時機

### ✅ 適用

- 「今天天氣怎麼樣？」
- 「明天會下雨嗎？」
- 「[城市] 溫度多少？」
- 「一週天氣預報」
- 旅遊規劃查詢

### ❌ 不適用

- 歷史天氣資料 → 使用天氣 archive/API
- 氣候分析趨勢 → 使用專業資料來源
- 劇烈天氣警報 → 查看官方氣象單位
- 航空/航海天氣 → 使用專業服務

---

## 指令

### 現況天氣

```bash
# 簡短摘要
curl "wttr.in/London?format=3"

# 詳細現況
curl "wttr.in/London?0"

# 指定城市
curl "wttr.in/New+York?format=3"
```

### 預報

```bash
# 3日預報
curl "wttr.in/London"

# 一週預報
curl "wttr.in/London?format=v2"

# 指定日期 (0=今天, 1=明天, 2=後天)
curl "wttr.in/London?1"
```

### 格式選項

```bash
# 單行格式
curl "wttr.in/London?format=%l:+%c+%t+%w"

# JSON 輸出
curl "wttr.in/London?format=j1"

# PNG 圖片
curl "wttr.in/London.png"
```

---

## 格式代碼

| 代碼 | 說明           |
| ---- | -------------- |
| %c   | 天氣狀況 Emoji |
| %t   | 溫度           |
| %f   | 體感溫度       |
| %w   | 風速           |
| %h   | 濕度           |
| %p   | 降雨           |
| %l   | 地點           |

---

## 快速回應

**「天氣怎麼樣？」**

```bash
curl -s "wttr.in/London?format=%l:+%c+%t+(feels+like+%f),+%w+wind,+%h+humidity"
```

**「會下雨嗎？」**

```bash
curl -s "wttr.in/London?format=%c+%p"
```

**「週末天氣」**

```bash
curl "wttr.in/London?format=v2"
```

---

## 注意事項

- 無需 API Key（使用 wttr.in）
- 有請求限制，勿濫用
- 支援全球多數城市
- 支援機場代碼：`curl wttr.in/ORD`
