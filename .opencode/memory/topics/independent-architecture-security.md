## 獨立架構安全中心 - 消息真假度驗證

### 新增功能 (2026-03-24)

1. **來源真假度驗證** `verifySource()`
   - 域名年齡檢測（新域名風險高）
   - 點擊誘饵分數（震驚式標題）
   - 操控意圖分數（煽動政治、恐懼散播）
   - 來源信譽評估

2. **CLI 命令** `scam`
   - `scam msg <訊息>` - 檢測訊息是否為詐騙
   - `scam url <網址>` - 檢測網址是否為釣魚
   - `scam email <內容>` - 檢測郵件是否為詐騙
   - `scam verify <內容>` - 驗證消息真假度
   - `scam news <內容>` - 查核新聞真實性
   - `scam monitor start/stop` - 自動監控

### 驗證維度

| 維度 | 說明 |
|------|------|
| 域名年齡 | <30天 = 高風險 |
| 點擊誘饵 | 震驚式標題、病毒傳播誘導 |
| 操控意圖 | 煽動政治、恐懼散播、假冒專家 |
| 來源信譽 | 知名媒體 vs 未知來源 |

### 檔案位置

- `/independent-architecture/cli-v2/unified-security-center.ts`
- `/independent-architecture/cli-v2/commands.ts`
