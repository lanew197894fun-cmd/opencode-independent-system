---
name: security-shield
description: VPN × 24小時 × RDP 三層安全防護系統
color: "#E91E63"
---

## 三層架構

| 層次       | 功能               |
| ---------- | ------------------ |
| VPN        | 網路通道、可信邊界 |
| 24小時防禦 | 智能防禦、時間規則 |
| RDP        | 遠端監控、會話管理 |

---

## VPN 檢查

```bash
curl http://localhost:8080/api/vpn-status
```

| 信任級別 | 權限       |
| -------- | ---------- |
| High     | 完全訪問   |
| Medium   | 大部分操作 |
| Low      | 基本瀏覽   |
| Unknown  | 最小化權限 |

---

## 24小時防禦

```bash
curl http://localhost:8080/api/sec24-report
curl http://localhost:8080/api/sec24-events?limit=20
```

| 層次   | 時間限制    |
| ------ | ----------- |
| 文官層 | 09:00-18:00 |
| 武官層 | 08:00-22:00 |
| 管理層 | 06:00-23:59 |

---

## RDP 監控

```bash
# 建立會話
curl -X POST http://localhost:8080/api/rdp-connect \
  -d '{"user":"admin","clientIP":"192.168.1.100","trustLevel":"high"}'

# 終止會話
curl -X POST http://localhost:8080/api/rdp-terminate \
  -d '{"sessionId":"xxx","reason":"管理員決定終止"}'
```

| 監控級別  | 強度     |
| --------- | -------- |
| Light     | 基本監控 |
| Standard  | 實時監控 |
| Intensive | 實時分析 |

---

## 快取優化

### 快取策略

| 項目       | TTL  | 說明          |
| ---------- | ---- | ------------- |
| VPN 狀態   | 60s  | 狀態變動快    |
| 24小時報告 | 300s | 5分鐘內不重複 |
| RDP 會話   | 30s  | 會話變動頻繁  |
| 安全風險   | 120s | 2分鐘內不重複 |

### 使用流程

```
檢查前：
→ tool_cache_get(key: "security:vpn:status")
→ 有快取：使用快取
→ 無快取：執行檢查 + 快取結果
```

---

## 系統啟動

```bash
# 完整啟動
bun run vpn-24h-rdp

# 分層啟動
bun script/vpn-security-hub.ts
bun script/sec24-defense.ts
bun script/rdp-layer.ts
```

---

## 使用方式

- 手動：「檢查系統安全」「VPN 狀態」「安全風險評估」
- 自動：閒置時執行安全檢查

---

## 安全檢查清單

- [ ] VPN 通道正常
- [ ] 防禦系統運行中
- [ ] 無高風險 RDP 會話
- [ ] 日誌正常記錄
