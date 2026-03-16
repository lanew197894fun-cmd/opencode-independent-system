---
name: modular
description: 功能模組化 - 按需載入減少資源佔用
---

# 功能模組化

## 現有架構

| 類型    | 載入方式          | 狀態      |
| ------- | ----------------- | --------- |
| Plugins | 動態 npm/路徑載入 | ✅        |
| Skills  | 啟動時掃描目錄    | ⚠️ 可優化 |
| Routes  | lazy() 延遲       | ✅        |

## 技能插件化

技能已經是模組化的：

```
skill/
├── ai-debug/        → SKILL.md
├── ai-memory/       → SKILL.md
├── lesson/          → SKILL.md
└── user-rules/      → SKILL.md
```

### 現有流程

1. 啟動時掃描所有 SKILL.md
2. 解析 frontmatter（name, description）
3. 觸發關鍵字時載入完整內容

### 可優化：延遲掃描

```typescript
// 改為首次存取時才掃描
const skillCache = new Map<string, SkillInfo>()

export async function getSkill(name: string) {
  if (skillCache.has(name)) return skillCache.get(name)

  // 只掃描一次，用完快取
  await scanSkills()
  return skillCache.get(name)
}
```

## 檔案結構建議

```
.opencode/
├── skill/
│   ├── ai-debug/         # Debug 功能
│   │   ├── SKILL.md
│   │   └── references/   # 詳細資訊
│   ├── ai-memory/        # 記憶功能
│   │   └── SKILL.md
│   ├── lesson/           # 學習功能
│   │   └── SKILL.md
│   └── user-rules/       # 用戶規則
│       └── SKILL.md
└── config.json           # 技能設定
```

## 檢查清單

- [ ] 技能保持獨立 Markdown 格式
- [ ] 詳細資訊放 references/
- [ ] SKILL.md 維持 < 100 行
