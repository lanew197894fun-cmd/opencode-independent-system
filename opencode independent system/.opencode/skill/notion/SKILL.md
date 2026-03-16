---
name: notion
description: Notion API - 建立與管理頁面、資料庫、區塊
homepage: https://developers.notion.com
metadata:
  openclaw:
    emoji: "📝"
    requires:
      env: ["NOTION_API_KEY"]
    primaryEnv: "NOTION_API_KEY"
---

# Notion 操作

使用 Notion API 建立/讀取/更新頁面、資料庫、區塊。

---

## 觸發關鍵字

| 關鍵字        | 動作            |
| ------------- | --------------- |
| Notion 頁面   | 建立/取得頁面   |
| Notion 資料庫 | 建立/查詢資料庫 |
| Notion 更新   | 更新區塊內容    |

---

## 設定

1. 在 https://notion.so/my-integrations 建立整合
2. 複製 API Key（開頭為 `ntn_` 或 `secret_`）
3. 儲存：

```bash
mkdir -p ~/.config/notion
echo "ntn_your_key_here" > ~/.config/notion/api_key
```

4. 分享目標頁面/資料庫給整合（點「...」→「Connect to」→ 整合名稱）

---

## API 基本

```bash
NOTION_KEY=$(cat ~/.config/notion/api_key)
curl -X GET "https://api.notion.com/v1/..." \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -H "Content-Type: application/json"
```

---

## 常用操作

### 搜尋頁面與資料庫

```bash
curl -X POST "https://api.notion.com/v1/search" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{"query": "page title"}'
```

### 取得頁面

```bash
curl "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 取得頁面內容（區塊）

```bash
curl "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03"
```

### 在資料庫中建立頁面

```bash
curl -X POST "https://api.notion.com/v1/pages" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{
    "parent": {"database_id": "xxx"},
    "properties": {
      "Name": {"title": [{"text": {"content": "New Item"}}]},
      "Status": {"select": {"name": "Todo"}}
    }
  }'
```

### 查詢資料庫

```bash
curl -X POST "https://api.notion.com/v1/data_sources/{data_source_id}/query" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{
    "filter": {"property": "Status", "select": {"equals": "Active"}},
    "sorts": [{"property": "Date", "direction": "descending"}]
  }'
```

### 建立資料庫

```bash
curl -X POST "https://api.notion.com/v1/data_sources" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{
    "parent": {"page_id": "xxx"},
    "title": [{"text": {"content": "My Database"}}],
    "properties": {
      "Name": {"title": {}},
      "Status": {"select": {"options": [{"name": "Todo"}, {"name": "Done"}]}},
      "Date": {"date": {}}
    }
  }'
```

### 更新頁面屬性

```bash
curl -X PATCH "https://api.notion.com/v1/pages/{page_id}" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{"properties": {"Status": {"select": {"name": "Done"}}}}'
```

### 新增區塊

```bash
curl -X PATCH "https://api.notion.com/v1/blocks/{page_id}/children" \
  -H "Authorization: Bearer $NOTION_KEY" \
  -H "Notion-Version: 2025-09-03" \
  -d '{
    "children": [
      {"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"text": {"content": "Hello"}}]}}
    ]
  }'
```

---

## 屬性類型

| 類型         | 格式                                               |
| ------------ | -------------------------------------------------- |
| Title        | `{"title": [{"text": {"content": "..."}}]}`        |
| Rich text    | `{"rich_text": [{"text": {"content": "..."}}]}`    |
| Select       | `{"select": {"name": "Option"}}`                   |
| Multi-select | `{"multi_select": [{"name": "A"}, {"name": "B"}]}` |
| Date         | `{"date": {"start": "2024-01-15"}}`                |
| Checkbox     | `{"checkbox": true}`                               |
| Number       | `{"number": 42}`                                   |
| URL          | `{"url": "https://..."}`                           |

---

## 2025-09-03 版重要差異

- **資料庫 → Data Sources**：使用 `/data_sources/` 端點
- **兩個 ID**：
  - `database_id`：建立頁面時使用
  - `data_source_id`：查詢時使用
- **搜尋結果**：資料庫回傳 `"object": "data_source"`

---

## 注意事項

- 頁面/資料庫 ID 為 UUID
- API 無法設定資料庫視圖篩選（僅 UI 可用）
- 速率限制：每秒約 3 請求
- 每次最多新增 100 個區塊
