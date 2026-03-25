---
name: independent-architecture
description: 獨立架構自主Debug - 閒置時自動偵測與修復
color: "#FF6B6B"
---

## 核心功能

**獨立架構閒置時自動進入 Debug 模式，主動偵測並修復問題。**

---

## 觸發條件

| 觸發類型 | 條件                      | 行為                    |
| -------- | ------------------------- | ----------------------- |
| 自動觸發 | 閒置 **3 分鐘**           | 執行健康檢查            |
| 深度檢測 | 閒置 **5 分鐘**           | 執行完整診斷 + 自動修復 |
| 手動觸發 | 「AI_DEBUG」/「自我修復」 | 立即執行                |

---

## 自動檢測項目

### 1. 系統健康（快速）

```
✅ 記憶體使用率
✅ CPU 使用率
✅ 磁碟空間
✅ 網路連線
```

### 2. 核心服務（標準）

```
✅ OpenCode 服務狀態
✅ Skill 載入狀態
✅ Plugin 運行狀態
✅ Database 連線
```

### 3. 安全防護（深度）

```
✅ VPN 連線狀態
✅ 24小時防禦狀態
✅ 審計日誌異常
✅ 異常登入偵測
```

---

## 閒置偵測機制

### 配置參數

```json
{
  "idle_timeout": 180,
  "deep_scan_interval": 300,
  "auto_fix_enabled": true,
  "notification_enabled": true
}
```

### 偵測流程

```
1. 記錄最後互動時間 (last_active)
2. 計時器每 30 秒檢查一次
3. 如果 (現在 - last_active) > 閾值：
   → 觸發 Debug 模式
   → 執行檢測清單
   → 發現問題 → 嘗試修復
   → 生成報告 → 通知用戶
```

---

## 自動修復項目

| 問題       | 修復動作 |
| ---------- | -------- |
| 記憶體過高 | 清理快取 |
| 服務異常   | 重啟服務 |
| 連線中斷   | 重新連線 |
| 依賴過時   | 更新依賴 |

---

## 報告格式

```
[獨立系統 Debug] 🤖 自動健康檢查

📊 系統狀態: 正常 ⚠️
- 記憶體: 62%
- CPU: 15%
- 磁碟: 45%

🔧 檢測項目:
- [✓] OpenCode 運行中
- [✓] Skill 已載入 (81個)
- [✓] Plugin 正常
- [✓] Database 連線正常
- [⚠] VPN 需重新檢查

🔄 已修復: 0 項
📝 建議: 檢查 VPN 連線

執行時間: 2.3s
```

---

## 快取策略

| 檢查類型 | TTL  | 說明     |
| -------- | ---- | -------- |
| 快速檢查 | 60s  | 避免頻繁 |
| 標準檢查 | 180s | 3分鐘    |
| 深度檢查 | 600s | 10分鐘   |

---

## 配置檔案

建立 `.opencode/skill/independent-debug/config.json`:

```json
{
  "enabled": true,
  "idle_minutes": 3,
  "deep_scan_minutes": 5,
  "auto_fix": true,
  "notify_on_complete": true,
  "checks": {
    "system": true,
    "services": true,
    "security": true,
    "performance": true
  }
}
```

---

## 使用命令

```bash
# 手動觸發
AI_DEBUG
自我修復
執行 Debug

# 配置
openclaw debug config
openclaw debug enable
openclaw debug disable
```

Base directory for this skill: .opencode/skill/independent-architecture
