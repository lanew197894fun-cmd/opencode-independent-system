---
name: blogwatcher
description: 部落格與 RSS/Atom 訂閱監控
homepage: https://github.com/Hyaxia/blogwatcher
metadata:
  openclaw:
    emoji: "📰"
    requires:
      bins: ["blogwatcher"]
    install:
      - id: go
        kind: go
        module: github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest
        bins: ["blogwatcher"]
        label: "安裝 blogwatcher (go)"
---

# Blog 監控

使用 `blogwatcher` 追蹤部落格與 RSS 更新。

---

## 觸發關鍵字

| 關鍵字     | 動作     |
| ---------- | -------- |
| 監控部落格 | 新增追蹤 |
| RSS 更新   | 掃描更新 |

---

## 安裝

```bash
go install github.com/Hyaxia/blogwatcher/cmd/blogwatcher@latest
```

---

## 常用指令

```bash
# 新增部落格
blogwatcher add "My Blog" https://example.com

# 列表
blogwatcher blogs

# 掃描更新
blogwatcher scan

# 列表文章
blogwatcher articles

# 標記已讀
blogwatcher read 1
blogwatcher read-all

# 移除
blogwatcher remove "My Blog"
```
