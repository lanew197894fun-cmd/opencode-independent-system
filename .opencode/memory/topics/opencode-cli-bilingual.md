## OpenCode CLI 雙語顯示（繁體中文 + 英文）

### 修改位置
`packages/opencode/src/index.ts`

### 修改方式
使用 yargs 的 `locale()` 和 `updateLocale()` 實現雙語顯示。

```typescript
const LOCALE: Record<string, string> = {
  "Commands:": "Commands (命令)：",
  "Positionals:": "Positionals (參數)：",
  "Options:": "Options (選項)：",
  "Required:": "Required (必填)：",
  "default:": "default (預設)：",
  "choices:": "choices (可選值)：",
  "aliases:": "aliases (別名)：",
  "Examples:": "Examples (範例)：",
  "boolean:": "boolean (布林)：",
  "string:": "string (字串)：",
  "number:": "number (數字)：",
  "array:": "array (陣列)：",
  "Show help": "Show help (顯示說明)",
  "Show version number": "Show version number (顯示版本號)",
  "print logs to stderr": "print logs to stderr (將日誌輸出到標準錯誤)",
  "log level": "log level (日誌等級)",
  "Unknown argument: %s": "Unknown argument (未知的參數)：%s",
  "Not enough non-option arguments: %s": "Not enough arguments (參數不足)：%s",
  "Missing required argument: %s": "Missing required argument (缺少必要參數)：%s",
  "Invalid values:": "Invalid values (無效的值)：",
  "%s is not a valid choice": "%s is not a valid choice (不是有效的選擇)",
}

const cli = yargs(hideBin(process.argv))
  .locale("en")
  .updateLocale(LOCALE)
```

### 關鍵點
- 先設 `.locale("en")` 使用英文基底
- 再用 `.updateLocale(LOCALE)` 覆寫為雙語格式
- yargs 18.0.0 支援此 API
