# 獨立 CLI 翻車手冊

獨立 AI CLI 系統，繁體中文界面。

## 快速開始

```bash
cd ~/opencode-manager/opencode\ independent\ system/.independent-architecture
bun run cli/index.ts
```

## 指令一覽

| 指令                    | 說明     |
| ----------------------- | -------- |
| `help`                  | 顯示說明 |
| `exit`                  | 退出     |
| `health`                | 健康檢查 |
| `status`                | 系統狀態 |
| `models`                | 可用模型 |
| `check`                 | API 狀態 |
| `/memory recall <關鍵>` | 搜尋記憶 |
| `/memory store <內容>`  | 儲存記憶 |
| `/security status`      | 安全狀態 |
| `/hfs start`            | 啟動 HFS |
| `/channel list`         | 頻道列表 |

---

## 常見問題

### Q1: Ollama 未運行

**錯誤:**

```
[.independent-architecture-model] Failed to connect to Ollama
```

**解決:**

```bash
# 安裝 Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 啟動服務
ollama serve

# 下載模型
ollama pull qwen3
ollama pull deepseek-r1
```

### Q2: 模型回應很慢

**原因:**

- 模型太大
- 記憶體不足

**解決:**

```bash
# 使用較小的模型
ollama pull qwen2.5-coder:1.5b

# 或使用免費 API (見 Q4)
```

### Q3: 離線無法使用

**原因:**

- 沒有本地模型
- 沒有下載任何模型

**解決:**

```bash
# 離線優先需要有本地模型
ollama pull qwen3

# 或設定免費 API (推薦 Groq)
```

### Q4: 如何設定免費 API

**1. 取得 API Key**

| 服務       | 申請連結                 | 免費額度  |
| ---------- | ------------------------ | --------- |
| Groq       | https://console.groq.com | 30/分鐘   |
| Together   | https://together.ai      | $5 credit |
| OpenRouter | https://openrouter.ai    | 部分免費  |

**2. 設定環境變數**

```bash
# 永久設定 (加入 ~/.bashrc)
echo 'export GROQ_API_KEY="gsk_xxxx"' >> ~/.bashrc
source ~/.bashrc

# 或臨時設定
export GROQ_API_KEY="gsk_xxxx"

# 測試
bun run cli/index.ts -s "check"
```

**3. 驗證設定**

```bash
bun run cli/index.ts -s "check"
# 應該顯示 ✅ Groq - 已連接
```

### Q5: 記憶功能無法使用

**檢查:**

```bash
ls -la ~/..independent-architecture/opencode-memory/
```

**解決:**

```bash
# 手動建立目錄
mkdir -p ~/..independent-architecture/opencode-memory
mkdir -p ~/..independent-architecture/security

# 或執行初始化
bun run cli/index.ts --init
```

### Q6: 插件載入失敗

**錯誤:**

```
[plugin-loader] Failed to scan directory
```

**解決:**

```bash
# 建立必要目錄
mkdir -p ~/..independent-architecture/skill
mkdir -p ~/..independent-architecture/.opencode/skill
```

### Q7: 中文顯示亂碼

**原因:**

- 終端編碼設定錯誤

**解決:**

```bash
# 設定為 UTF-8
export LANG=zh_TW.UTF-8
export LC_ALL=zh_TW.UTF-8

# 或使用 iTerm2 / Windows Terminal
```

---

## 模式說明

### 離線模式 (預設)

**優點:**

- 完全免費
- 保護隱私
- 無需網路

**缺點:**

- 需要本地模型
- 模型能力有限

**啟用:**

```bash
bun run cli/index.ts --offline
```

### API 模式

**優點:**

- 更強大的模型
- 無需本地資源

**缺點:**

- 需要 API Key
- 有使用限制

**設定:**

```bash
export GROQ_API_KEY="your_key"
bun run cli/index.ts
```

### 混合模式 (推薦)

**同時使用本地 + API:**

```bash
# 本地處理簡單問題
# API 處理複雜問題
```

---

## 推薦模型

### 本地模型 (Ollama)

| 模型          | 大小  | 用途     | 記憶體 |
| ------------- | ----- | -------- | ------ |
| qwen3         | 8GB   | 通用對話 | 8GB+   |
| qwen2.5-coder | 1.5GB | 程式碼   | 4GB+   |
| deepseek-r1   | 7GB   | 推理思考 | 8GB+   |
| moondream     | 1.7GB | 圖片理解 | 4GB+   |

### API 模型 (免費)

| 服務       | 模型      | 特點   |
| ---------- | --------- | ------ |
| Groq       | llama-3.1 | 速度快 |
| Together   | Qwen      | 中文好 |
| OpenRouter | 多種      | 可比較 |

---

## 快捷鍵

| 按鍵     | 功能     |
| -------- | -------- |
| `Tab`    | 自動補全 |
| `Ctrl+C` | 取消輸入 |
| `Ctrl+L` | 清屏     |
| `↑/↓`    | 歷史記錄 |

---

## 疑難排除流程圖

```
遇到問題
    │
    ▼
┌─────────┐
│查看錯誤│
└────┬──┘
     │
     ▼
┌─────────────────┐
│ 檢查系統狀態    │
│ bun run -s "health" │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 檢查模型狀態    │
│ bun run -s "models" │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 檢查 API 狀態   │
│ bun run -s "check" │
└────┬────────────┘
     │
     ▼
  仍無法解決？
     │
     ▼
┌─────────────────┐
│ 查看本文檔       │
│ 對應章節        │
└─────────────────┘
```

---

## 緊急恢復

### 重置所有設定

```bash
rm -rf ~/..independent-architecture
bun run cli/index.ts --init
```

### 重建知識庫

```bash
rm -rf ~/..independent-architecture/opencode-memory/*
# 重啟後會自動初始化
```

### 更新系統

```bash
cd ~/opencode-manager/opencode\ independent\ system/.independent-architecture
git pull
bun install
```

---

## 聯絡與支援

- 查看說明: `help`
- 查看模型: `models`
- 查看狀態: `status`
- 健康檢查: `health`
