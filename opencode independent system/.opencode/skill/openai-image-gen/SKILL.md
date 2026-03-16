---
name: openai-image-gen
description: OpenAI 圖片生成 - 批次生成圖片
homepage: https://platform.openai.com/docs/api-reference/images
metadata:
  openclaw:
    emoji: "🖼️"
    requires:
      bins: ["python3"]
      env: ["OPENAI_API_KEY"]
    primaryEnv: "OPENAI_API_KEY"
    install:
      - id: python-brew
        kind: brew
        formula: python
        bins: ["python3"]
        label: "安裝 Python (brew)"
---

# OpenAI 圖片生成

批次生成隨機但結構化的提示詞圖片。

---

## 觸發關鍵字

| 關鍵字      | 動作        |
| ----------- | ----------- |
| 生成圖片    | AI 圖片生成 |
| OpenAI 圖片 | 建立圖片    |

---

## 執行

```bash
python3 {baseDir}/scripts/gen.py
```

---

## 常用參數

```bash
# GPT 圖片模型
python3 {baseDir}/scripts/gen.py --count 16 --model gpt-image-1
python3 {baseDir}/scripts/gen.py --prompt "描述" --count 4
python3 {baseDir}/scripts/gen.py --size 1536x1024 --quality high

# DALL-E 3
python3 {baseDir}/scripts/gen.py --model dall-e-3 --quality hd --size 1792x1024

# DALL-E 2
python3 {baseDir}/scripts/gen.py --model dall-e-2 --size 512x512 --count 4
```

---

## 模型參數

### Size

- GPT 圖片：1024x1024, 1536x1024, 1024x1536
- DALL-E 3：1024x1024, 1792x1024, 1024x1792
- DALL-E 2：256x256, 512x512, 1024x1024

### Quality

- GPT 圖片：auto, high, medium, low
- DALL-E 3：hd, standard

---

## 輸出

- 圖片檔案
- `prompts.json`（提示詞對應）
- `index.html`（縮圖畫廊）
