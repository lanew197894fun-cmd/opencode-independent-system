# 獨立 CLI v2 研究記錄

## 日期: 2026-03-23

## 目標

援用官方 opencode 模式，建立專屬 CLI 系統，Plugin 化現有技能，整合記憶、安全、網關等功能。

## 研究成果

### 官方 opencode CLI 架構分析

```
packages/opencode/src/
├── index.ts                    # CLI 入口 (yargs)
├── cli/
│   ├── cmd/
│   │   ├── run.ts             # run 命令
│   │   ├── tui/               # TUI 介面 (Solid.js)
│   │   └── ...
│   └── bootstrap.ts
├── provider/
│   ├── provider.ts             # Provider 核心（20+ 供應商）
│   └── models.ts              # Models.dev 整合
├── plugin/
│   └── index.ts               # Plugin Hook 系統
├── agent/
│   └── agent.ts               # Agent 系統
└── session/
    └── index.ts               # Session 管理
```

### 官方 Plugin Hook 系統

```typescript
export interface Hooks {
  event?: (input) => Promise<void>
  "chat.message"?: (input, output) => Promise<void>
  "chat.params"?: (input, output) => Promise<void>
  "tool.execute.before"?: (input, output) => Promise<void>
  "tool.execute.after"?: (input, output) => Promise<void>
  "permission.ask"?: (input, output) => Promise<void>
}
```

### 官方 Provider 系統

- 支援 20+ 模型供應商
- 從 `models.dev` API 載入模型列表
- 從環境變數讀取 API Key
- 使用 AI SDK 統一介面

## 實作成果

### CLI v2 架構

```
cli-v2/
├── core.ts              # 核心：CLIState, ToolRegistry, CommandRegistry
├── plugin-system.ts     # Plugin Hook 系統（援用官方）
├── provider.ts          # Provider 模型系統（援用官方）
├── commands.ts          # 內建命令
├── repl.ts              # 互動 REPL
├── plugin-integrator.ts # 插件整合層
└── index.ts             # 入口點
```

### 援用的官方模式

| 功能          | 官方模式                            | CLI v2 實作                        |
| ------------- | ----------------------------------- | ---------------------------------- |
| Hook 系統     | `Plugin.trigger(name, input)`       | `HookManager.trigger(name, input)` |
| Plugin 結構   | `{ metadata, hooks, tools }`        | 相同結構                           |
| Provider 管理 | `Provider.get()`, `Provider.list()` | `ProviderManager` 類別             |
| 命令注册      | yargs `CommandModule`               | `CommandRegistry` 類別             |
| 狀態管理      | `Instance.state()`                  | `CLIState` 類別                    |

### 支援的 Provider

| ID         | 名稱          | 環境變數           | 免費 |
| ---------- | ------------- | ------------------ | ---- |
| groq       | Groq          | GROQ_API_KEY       | ✅   |
| together   | Together AI   | TOGETHER_API_KEY   | ✅   |
| openrouter | OpenRouter    | OPENROUTER_API_KEY | ✅   |
| deepinfra  | DeepInfra     | DEEPINFRA_API_KEY  | ✅   |
| cerebras   | Cerebras      | CEREBRAS_API_KEY   | ✅   |
| ollama     | Ollama (本地) | -                  | ✅   |
| anthropic  | Anthropic     | ANTHROPIC_API_KEY  | ❌   |
| openai     | OpenAI        | OPENAI_API_KEY     | ❌   |
| mistral    | Mistral       | MISTRAL_API_KEY    | ❌   |

### 支援的 Hook

| Hook 名稱         | 觸發時機     |
| ----------------- | ------------ |
| `cli.init`        | CLI 初始化   |
| `cli.start`       | CLI 啟動     |
| `cli.shutdown`    | CLI 關閉     |
| `cli.beforeinput` | 處理輸入前   |
| `cli.afteroutput` | 處理輸出後   |
| `chat.before`     | 聊天前       |
| `chat.after`      | 聊天後       |
| `chat.error`      | 聊天錯誤     |
| `tool.before`     | 工具執行前   |
| `tool.after`      | 工具執行後   |
| `tool.error`      | 工具錯誤     |
| `session.create`  | 建立 Session |
| `session.save`    | 保存 Session |
| `session.load`    | 載入 Session |

### 內建命令

```
help, ?          顯示幫助
exit, quit       結束程式
clear            清除畫面
history          歷史記錄
status           系統狀態
health           健康檢查
version, -v      版本資訊
models           列出可用模型
providers        列出供應商
use <model>      切換模型
provider <name>  切換供應商
plugins          列出已載入插件
hooks            列出可用 hooks
repair           維修記錄
check            API 狀態檢測
```

## 執行方式

```bash
cd ~/opencode-manager/opencode\ independent\ system/independent-architecture

# 互動模式
bun run cli-v2/index.ts

# 單次聊天
bun run cli-v2/index.ts --chat "你好"

# 單一命令
bun run cli-v2/index.ts -S "status"
bun run cli-v2/index.ts -S "providers"
bun run cli-v2/index.ts -S "check"
bun run cli-v2/index.ts -S "hooks"

# 指定模型
bun run cli-v2/index.ts -m qwen2.5:7b --chat "你好"
```

## 待完成

1. [ ] 啟動 Ollama 或設定 API Key
2. [ ] 整合現有的 memory, security 等舊插件
3. [ ] 測試聊天功能
4. [ ] 添加更多 Provider
5. [ ] 實作 Tool 系統
6. [ ] 實作 Session 持久化

## 參考文獻

- 官方 opencode CLI: `packages/opencode/src/cli/`
- 官方 Plugin: `packages/opencode/src/plugin/`
- 官方 Provider: `packages/opencode/src/provider/`
