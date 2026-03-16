---
name: clawhub
description: ClawHub CLI - 搜尋、安裝、更新、發布技能
metadata:
  openclaw:
    requires:
      bins: ["clawhub"]
    install:
      - id: node
        kind: node
        package: clawhub
        bins: ["clawhub"]
        label: "安裝 ClawHub CLI (npm)"
---

# ClawHub 操作

使用 clawhub 管理技能。

---

## 觸發關鍵字

| 關鍵字   | 動作              |
| -------- | ----------------- |
| 安裝技能 | 安裝 ClawHub 技能 |
| 更新技能 | 更新技能版本      |
| 發布技能 | 發布新技能        |

---

## 安裝

```bash
npm i -g clawhub
```

---

## 驗證

```bash
clawhub login
clawhub whoami
```

---

## 常用指令

### 搜尋

```bash
clawhub search "postgres backups"
```

### 安裝

```bash
clawhub install my-skill
clawhub install my-skill --version 1.2.3
```

### 更新

```bash
clawhub update my-skill
clawhub update my-skill --version 1.2.3
clawhub update --all
clawhub update my-skill --force
```

### 列表

```bash
clawhub list
```

### 發布

```bash
clawhub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

---

## 注意事項

- 預設 registry：`https://clawhub.com`
- 預設 workdir：cwd
- 預設安裝目錄：./skills
