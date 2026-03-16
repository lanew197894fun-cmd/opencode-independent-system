---
name: xurl
description: X (Twitter) API CLI - 發布推文、回覆、搜尋、讀取、管理粉絲、發送 DM、上傳媒體
metadata:
  openclaw:
    emoji: "𝕏"
    requires:
      bins: ["xurl"]
    install:
      - id: brew
        kind: brew
        formula: "xdevplatform/tap/xurl"
        bins: ["xurl"]
        label: "安裝 xurl (brew)"
      - id: npm
        kind: npm
        package: "@xdevplatform/xurl"
        bins: ["xurl"]
        label: "安裝 xurl (npm)"
---

# X (Twitter) 操作

使用 `xurl` CLI 操作 X API。

---

## 觸發關鍵字

| 關鍵字   | 動作     |
| -------- | -------- |
| 發布推文 | 發布推文 |
| 回覆推文 | 回覆推文 |
| 搜尋推文 | 搜尋推文 |
| 發送 DM  | 發送私訊 |

---

## 安裝

```bash
# Homebrew
brew install --cask xdevplatform/tap/xurl

# npm
npm install -g @xdevplatform/xurl
```

---

## 驗證

- 先執行 `xurl auth status` 檢查
- 需先在用戶機器上手動設定 `~/.xurl` 憑證
- **勿在 agent/LLM 工作階段中使用內聯密碼**

---

## 快速指令

| 動作     | 指令                                 |
| -------- | ------------------------------------ |
| 發布推文 | `xurl post "Hello world!"`           |
| 回覆     | `xurl reply POST_ID "Nice post!"`    |
| 引用     | `xurl quote POST_ID "My take"`       |
| 刪除     | `xurl delete POST_ID`                |
| 讀取     | `xurl read POST_ID`                  |
| 搜尋     | `xurl search "QUERY" -n 10`          |
| 我是誰   | `xurl whoami`                        |
| 查用戶   | `xurl user @handle`                  |
| 時間線   | `xurl timeline -n 20`                |
| 提及     | `xurl mentions -n 10`                |
| 喜歡     | `xurl like POST_ID`                  |
| 取消喜歡 | `xurl unlike POST_ID`                |
| 轉發     | `xurl repost POST_ID`                |
| 取消轉發 | `xurl unrepost POST_ID`              |
| 收藏     | `xurl bookmark POST_ID`              |
| 取消收藏 | `xurl unbookmark POST_ID`            |
| 追蹤     | `xurl follow @handle`                |
| 取消追蹤 | `xurl unfollow @handle`              |
| 列表追蹤 | `xurl following -n 20`               |
| 列表粉絲 | `xurl followers -n 20`               |
| 封鎖     | `xurl block @handle`                 |
| 解除封鎖 | `xurl unblock @handle`               |
| 靜音     | `xurl mute @handle`                  |
| 解除靜音 | `xurl unmute @handle`                |
| 發送 DM  | `xurl dm @handle "message"`          |
| 列表 DM  | `xurl dms -n 10`                     |
| 上傳媒體 | `xurl media upload path/to/file.mp4` |

---

## 常用流程

### 發布帶圖片推文

```bash
# 1. 上傳圖片
xurl media upload photo.jpg

# 2. 取得 media_id 後發布
xurl post "Check out this photo!" --media-id MEDIA_ID
```

### 回覆推文

```bash
# 1. 讀取推文了解上下文
xurl read https://x.com/user/status/1234567890

# 2. 回覆
xurl reply 1234567890 "Here are my thoughts..."
```

---

## 全域參數

| 參數       | 說明                   |
| ---------- | ---------------------- |
| --app      | 使用特定應用程式       |
| --auth     | 強制驗證類型           |
| --username | OAuth2 帳號            |
| --verbose  | **agent 工作階段禁用** |

---

## 原始 API 存取

```bash
# GET
xurl /2/users/me

# POST
xurl -X POST /d '{"text":"2/tweets -Hello world!"}'

# DELETE
xurl -X DELETE /2/tweets/1234567890
```

---

## 注意事項

- **速率限制**：429 錯誤時等待重試
- **權限**：403 可能需重新執行 `xurl auth oauth2`
- **Token 儲存**：`~/.xurl`（YAML 格式）
- **POST_ID**：可使用完整 URL，xurl 會自動提取 ID
- **用戶名**：開頭 `@` 可省略
