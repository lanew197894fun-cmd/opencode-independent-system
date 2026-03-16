---
name: security-auto
description: 通用安全自動化系統 - VPN、24H防禦、沙盤模擬、依賴風險、回滾整合（適用於任何專案）
color: "#E74C3C"
autoLoad: false
---

## 功能說明

**通用安全自動化系統** - 整合五大安全模組，適用於任何類型的專案（網頁應用、遊戲伺服器、桌面程式等），按需啟動與執行。

---

## 適用場景

| 專案類型   | 支援功能                         |
| ---------- | -------------------------------- |
| 網頁應用   | 依賴風險分析、部署前沙盤測試     |
| 遊戲伺服器 | 配置檔案模擬、資源讀取測試       |
| 桌面程式   | 執行檔安全檢測、系統路徑存取審查 |
| 微服務     | API 呼叫模擬、服務間依賴分析     |
| 任何專案   | 通用安全防護、風險評估、自動回報 |

---

## 快速啟動

### 啟動所有服務

```
/security-start
```

### 停止所有服務

```
/security-stop
```

### 查看服務狀態

```
/security-status
```

---

## 個別服務

### VPN Security Hub (8080)

```
/vpn-start      # 啟動
/vpn-status     # 狀態
/vpn-connect    # 連線測試
```

### 24H Defense (8081)

```
/defense-start    # 啟動
/defense-status   # 狀態
/defense-check    # 操作檢查
```

### Sandbox System (8082)

```
/sandbox-start    # 啟動
/sandbox-run      # 執行模擬
/sandbox-issues   # 查看問題
```

### Dependency Risk (8084)

```
/dep-analyze      # 分析依賴風險
/dep-strategies   # 緩解策略
```

### Rollback Manager (8085)

```
/rollback-backup  # 建立備份
/rollback-list    # 備份列表
/rollback-exec    # 執行回滾
```

---

## 使用情境

### 1. 更新依賴前

```
1. /dep-analyze react 18.2.0 19.0.0
2. /rollback-backup "before-react-update"
3. /sandbox-run update react 19.0.0
4. 若失敗 → /rollback-exec <backup-id>
```

### 2. 發現問題時

```
1. /sandbox-issues
2. 自動偵測循環和風險
3. 提供修復建議
```

### 3. 定期安全檢查

```
/security-check
```

---

## 服務端口

| 服務             | 端口 | 說明         |
| ---------------- | ---- | ------------ |
| VPN Security Hub | 8080 | VPN 連線管理 |
| 24H Defense      | 8081 | 六層智能防禦 |
| Sandbox System   | 8082 | 沙盤模擬測試 |
| Dependency Risk  | 8084 | 依賴風險分析 |
| Rollback Manager | 8085 | 備份與回滾   |

---

## 自動觸發條件

| 情境              | 自動執行     |
| ----------------- | ------------ |
| 修改 package.json | 依賴風險分析 |
| 發現循環問題      | 沙盤模擬修復 |
| 高風險操作        | 自動建立備份 |
| 更新失敗          | 提示回滾選項 |

---

## 注意事項

- 服務按需啟動，不會佔用資源
- 環境問題（如 WireGuard 未安裝）會跳過但不影響其他功能
- 所有操作都有日誌記錄
