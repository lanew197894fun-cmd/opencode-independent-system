---
name: skill-creator
description: 建立、編輯、改善、審計 AgentSkills
---

# 技能建立

建立與管理 AgentSkills 的指引。

---

## 觸發關鍵字

| 關鍵字   | 動作         |
| -------- | ------------ |
| 建立技能 | 建立新技能   |
| 改善技能 | 改善現有技能 |
| 審計技能 | 審計技能     |

---

## 技能結構

```
skill-name/
├── SKILL.md (必填)
│   ├── YAML frontmatter (name, description)
│   └── Markdown 說明
├── scripts/ (可選) - 執行碼
├── references/ (可選) - 參考文檔
└── assets/ (可選) - 輸出資源
```

---

## 建立流程

1. **理解需求** - 確認功能與使用場景
2. **規劃內容** - scripts、references、assets
3. **初始化技能** - 執行 init_skill.py
4. **編輯技能** - 實作資源與 SKILL.md
5. **打包技能** - 執行 package_skill.py
6. **迭代優化** - 根據使用反饋改進

---

## SKILL.md 撰寫原則

### Frontmatter

```yaml
---
name: skill-name
description: 技能描述，包含用途與觸發時機
---
```

### Body

- 簡潔為主，不超過 500 行
- 優先提供程式碼範例
- 詳細資訊放 references/

### 命名規範

- 小寫字母、數字、連字符
- 優先使用短動詞
- 不超過 64 字元

---

## 參考資源

| 類型        | 說明     | 時機               |
| ----------- | -------- | ------------------ |
| scripts/    | 執行碼   | 需確定性可靠性     |
| references/ | 參考文檔 | Codex 需參考時載入 |
| assets/     | 輸出資源 | 最終輸出使用       |

---

## 打包驗證

```bash
scripts/package_skill.py <skill-folder>
```

驗證項目：

- YAML frontmatter 格式
- 命名規範
- 描述完整性
- 檔案組織

---

## 核心原則

1. **簡潔優先** - 只添加 Codex 不知道的資訊
2. **適當自由度** - 根據任務脆弱度調整詳細程度
3. **漸進揭露** - 分層載入資訊
4. **不建文件** - 勿建立額外 README、CHANGELOG 等
