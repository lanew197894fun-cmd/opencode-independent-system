---
name: system-optimizer
description: 系統自主優化 - 自動偵測系統問題、執行優化、發出通知
color: "#00BCD4"
---

## 功能說明

OpenCode 自主監控並優化使用者系統，在發現問題或完成優化時發出通知。

---

## 監控項目

### 記憶體優化

| 檢測項目     | 閾值  | 優化動作           |
| ------------ | ----- | ------------------ |
| 記憶體使用率 | > 80% | 清理快取、執行 GC  |
| Node 記憶體  | > 4GB | 重啟服務、調整限制 |
| 殭屍程序     | 存在  | 清理殭屍程序       |

### CPU 優化

| 檢測項目   | 閾值     | 優化動作               |
| ---------- | -------- | ---------------------- |
| CPU 使用率 | > 90%    | 降低並發、終止高耗程序 |
| 負載過高   | > 核心數 | 調整排程、延遲任務     |
| 過熱風險   | 溫度過高 | 降頻建議               |

### 磁碟優化

| 檢測項目     | 閾值  | 優化動作       |
| ------------ | ----- | -------------- |
| 磁碟使用率   | > 85% | 清理暫存、日誌 |
| inode 使用率 | > 80% | 清理小檔案     |
| 碎片化       | 嚴重  | 建議重組       |

### 網路優化

| 檢測項目 | 閾值    | 優化動作           |
| -------- | ------- | ------------------ |
| 連線數   | > 1000  | 清理閒置連線       |
| DNS 延遲 | > 500ms | 切換 DNS、清除快取 |
| 封包遺失 | > 5%    | 通知網路問題       |

---

## 自動優化動作

### Linux/macOS

```bash
# 清理系統快取
sudo sync && sudo sysctl -w vm.drop_caches=3

# 清理暫存檔案
rm -rf /tmp/* 2>/dev/null
rm -rf ~/.cache/* 2>/dev/null

# 清理日誌
sudo journalctl --vacuum-time=7d
find /var/log -name "*.log" -mtime +7 -delete

# 清理 npm/bun 快取
bun pm cache rm
npm cache clean --force

# 清理 Docker
docker system prune -f
docker volume prune -f

# 終止高耗資程序
pkill -f "chrome.*--type=renderer"
```

### Windows

```powershell
# 清理系統暫存
Remove-Item -Path "$env:TEMP\*" -Recurse -Force -ErrorAction SilentlyContinue

# 清理 Windows Update 快取
Dism.exe /online /Cleanup-Image /StartComponentCleanup

# 清理資源回收筒
Clear-RecycleBin -Force -ErrorAction SilentlyContinue

# 磁碟清理
cleanmgr /sagerun:1

# 清理事件日誌
wevtutil el | ForEach-Object { wevtutil cl "$_" }
```

### WSL

```bash
# 壓縮 WSL 虛擬磁碟 (Windows PowerShell)
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited*\LocalState\ext4.vhdx" -Mode Full

# 清理 WSL 暫存
rm -rf ~/.cache/*
rm -rf /tmp/*
```

---

## 通知機制

### 通知類型

| 類型     | 圖示 | 說明     |
| -------- | ---- | -------- |
| info     | ℹ️   | 資訊通知 |
| success  | ✅   | 成功通知 |
| warning  | ⚠️   | 警告通知 |
| error    | ❌   | 錯誤通知 |
| optimize | 🔧   | 優化通知 |

### 通知管道

```bash
# 桌面通知 (Linux)
notify-send "OpenCode 優化" "已清理 2GB 快取"

# 桌面通知 (Windows PowerShell)
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$toast = [Windows.UI.Notifications.ToastNotification]::new($template)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("OpenCode").Show($toast)

# macOS
osascript -e 'display notification "已清理 2GB 快取" with title "OpenCode 優化"'

# 終端通知
echo "🔔 [OpenCode] 已清理 2GB 快取"

# 聲音提示
paplay /usr/share/sounds/freedesktop/stereo/message.oga 2>/dev/null
```

### API 通知

```bash
# 發送通知到 OpenCode API
curl -X POST http://localhost:8080/api/notification \
  -H "Content-Type: application/json" \
  -d '{
    "type": "optimize",
    "title": "系統優化完成",
    "message": "已釋放 2.5GB 磁碟空間",
    "actions": [
      {"label": "查看詳情", "action": "show-report"},
      {"label": "忽略", "action": "dismiss"}
    ]
  }'
```

---

## 優化排程

### 定期檢查

```bash
# 每 5 分鐘檢查一次
*/5 * * * * /path/to/opencode-optimizer.sh --quick

# 每小時輕度優化
0 * * * * /path/to/opencode-optimizer.sh --light

# 每日深度優化
0 3 * * * /path/to/opencode-optimizer.sh --deep

# 每週完整清理
0 4 * * 0 /path/to/opencode-optimizer.sh --full
```

### OpenCode 內建排程

```javascript
// 每 30 秒快速檢查
Scheduler.register({
  id: "optimizer.quick-check",
  interval: 30000,
  scope: "global",
  run: async () => {
    // 檢查記憶體、CPU
    if (memoryUsage > 85 || cpuUsage > 90) {
      await notify({ type: "warning", message: "系統資源緊張" })
      await runOptimization("light")
    }
  },
})

// 每 5 分鐘中度檢查
Scheduler.register({
  id: "optimizer.medium-check",
  interval: 300000,
  scope: "global",
  run: async () => {
    await runOptimization("medium")
  },
})
```

---

## 優化報告

### 即時報告

```bash
# 查看優化報告
curl http://localhost:8080/api/optimizer/report
```

### 報告格式

```json
{
  "timestamp": "2026-02-18T20:00:00Z",
  "before": {
    "memory": 85,
    "cpu": 45,
    "disk": 78
  },
  "after": {
    "memory": 62,
    "cpu": 30,
    "disk": 65
  },
  "actions": [
    {
      "action": "clear-cache",
      "freed": "1.2GB",
      "success": true
    },
    {
      "action": "clean-logs",
      "freed": "800MB",
      "success": true
    },
    {
      "action": "gc",
      "freed": "500MB",
      "success": true
    }
  ],
  "totalFreed": "2.5GB",
  "duration": "3.2s"
}
```

---

## 通知設定

### 配置檔案

```json
{
  "notifications": {
    "enabled": true,
    "channels": ["desktop", "terminal", "sound"],
    "quietHours": {
      "start": "22:00",
      "end": "08:00"
    },
    "levels": {
      "info": true,
      "success": true,
      "warning": true,
      "error": true
    }
  },
  "optimization": {
    "autoRun": true,
    "aggressiveLevel": "medium",
    "excludePaths": ["/important-data"],
    "maxFreedPerRun": "5GB"
  }
}
```

---

## 使用方式

### 自動觸發

```
OpenCode 自動監控並優化
- 每 30 秒快速檢查
- 每 5 分鐘中度優化
- 發現問題立即通知
```

### 手動觸發

```
「優化系統」           → 執行中度優化
「深度清理」           → 執行完整清理
「檢查系統效能」       → 產生效能報告
「關閉自動優化」       → 停止自動優化
「開啟通知」           → 啟用桌面通知
```

---

## 安全機制

### 優化前檢查

```
1. 確認無重要程序執行中
2. 檢查磁碟寫入權限
3. 驗證空間足夠
4. 備份重要設定
```

### 保護清單

```bash
# 不清理的路徑
/home/user/projects/
/etc/
/var/lib/docker/
```

### 回復機制

```bash
# 優化前建立還原點
/opt/opencode/restore-points/

# 回復到上一個還原點
opencode-restore --last
```

---

## AI 自主決策

### 決策流程

```
1. 偵測系統狀態
   ↓
2. 評估是否需要優化
   ↓
3. 選擇優化策略
   ├─ 輕度: 清理快取
   ├─ 中度: 清理暫存 + 日誌
   └─ 重度: 完整清理 + 程序管理
   ↓
4. 執行優化
   ↓
5. 發送通知
   ↓
6. 記錄日誌
```

### 智能判斷

```javascript
function decideOptimization(stats) {
  const { memory, cpu, disk, time } = stats

  // 工作時間不執行重度優化
  if (isWorkingHours(time)) {
    return memory > 90 ? "medium" : "light"
  }

  // 閒置時間可執行深度優化
  if (isIdleTime(time)) {
    return "deep"
  }

  // 緊急情況立即處理
  if (memory > 95 || cpu > 95 || disk > 95) {
    return "emergency"
  }

  return "light"
}
```
