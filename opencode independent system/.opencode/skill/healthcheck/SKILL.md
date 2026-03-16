---
name: healthcheck
description: 主機安全加固與風險配置 - 安全審計、防火牆、SSH、更新強化
---

# 主機安全檢查

評估並強化執行 OpenClaw 的主機。

---

## 觸發關鍵字

| 關鍵字     | 動作         |
| ---------- | ------------ |
| 安全審計   | 執行安全審計 |
| 健康檢查   | 主機健康檢查 |
| 防火牆設定 | 設定防火牆   |
| 更新狀態   | 檢查更新     |

---

## 核心原則

1. 需使用先進模型（Opus 4.5、GPT 5.2+）
2. 任何變更前需明確批准
3. 遠端存取設定變更前需確認連線方式
4. 優先可逆的階段性變更
5. 不聲稱 OpenClaw 會修改防火牆/SSH/OS 更新
6. 格式化：選項需編號，用戶回覆單一數字即可

---

## 工作流程

### 1)

確認 建立上下文：

1. OS 與版本
2. 權限層級
3. 存取方式
4. 網路暴露
5. OpenClaw 狀態
6. 備份狀態
7. 部署環境
8. 磁碟加密狀態
9. 自動更新狀態
10. 使用模式

### 2) 執行安全審計

```bash
openclaw security audit --deep
```

### 3) 檢查版本

```bash
openclaw update status
```

### 4) 風險承受度

選項（編號）：

1. Home/Workstation Balanced（最常見）
2. VPS Hardened
3. Developer Convenience
4. Custom

### 5) 產生修復計劃

包含：

- 目標配置
- 當前狀態
- 差距分析
- 步驟命令
- 存取保護策略

### 6) 執行選項

1. 逐步引導執行
2. 僅顯示計劃
3. 僅修復關鍵問題
4. 匯出命令

---

## 必要確認

- 防火牆規則變更
- 開啟/關閉連接埠
- SSH/RDP 設定變更
- 套件安裝/移除
- 服務啟用/停用
- 使用者/群組修改
- 排程任務
- 更新原則

---

## 定期檢查

建議排程定期審計：

```bash
openclaw security audit
openclaw update status
```

---

## OpenClaw 命令

- `openclaw security audit [--deep] [--fix] [--json]`
- `openclaw status`
- `openclaw health --json`
- `openclaw update status`
- `openclaw cron add|list|runs|run`

---

## 記錄

記錄：

- Gateway 身份
- 計劃 ID 與時間戳
- 批准的步驟與命令
- 退出碼與修改的檔案

**勿記錄密鑰或完整憑證內容**
