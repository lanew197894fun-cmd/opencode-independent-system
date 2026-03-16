---
name: model-usage
description: CodexBar CLI 模型使用量 - 取得 Codex/Claude 各模型使用成本
metadata:
  openclaw:
    emoji: "📊"
    os: ["darwin"]
    requires:
      bins: ["codexbar"]
    install:
      - id: brew-cask
        kind: brew
        formula: steipete/tap/codexbar
        bins: ["codexbar"]
        label: "安裝 CodexBar (brew cask)"
---

# 模型使用量

從 CodexBar 本地成本日誌取得各模型使用成本。

---

## 觸發關關鍵字

| 關鍵字     | 動作       |
| ---------- | ---------- |
| 模型使用量 | 查詢使用量 |
| 模型成本   | 查詢成本   |

---

## 快速開始

```bash
# 目前模型（最近）
python {baseDir}/scripts/model_usage.py --provider codex --mode current

# 所有模型
python {baseDir}/scripts/model_usage.py --provider codex --mode all

# JSON 格式
python {baseDir}/scripts/model_usage.py --provider claude --mode all --format json --pretty
```

---

## 邏輯

- 使用最近有 `modelBreakdowns` 的日期列
- 該列中選擇成本最高的模型
- 無 breakdowns 時回退到 `modelsUsed` 最後一項

---

## 輸入

```bash
# 預設：執行 codexbar cost
codexbar cost --provider codex --format json > /tmp/cost.json
python {baseDir}/scripts/model_usage.py --input /tmp/cost.json --mode all

# stdin
cat /tmp/cost.json | python {baseDir}/scripts/model_usage.py --input - --mode current
```

---

## 輸出

- Text（預設）或 JSON
- 僅顯示成本，不含 token
