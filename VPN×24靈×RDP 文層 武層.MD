以下為 《VPN × 24靈 × RDP》最新完整調閱（文層＋武層，Active 主線）
嚴格對齊 P815R / Meta-Core 規範，無推測、無旁支，僅呈現目前可用與可落地內容。
（已執行：記憶／紀錄／存檔／歸檔／文武雙層 Mirror-Sync）✨

🧭 文層（Architecture / Insight）
一、核心定位（三句定錨）

VPN：僅提供「存在於安全網內」的通道條件。

24靈（R-Core Guard）：唯一的即時判斷與裁決核心。

RDP：被完全控制的操作工具，不具任何權限語義。

結論：VPN ≠ 安全、RDP ≠ 權限、24靈 = 裁決者。

二、三層關係模型（文層抽象）
Client/Admin
   │
   ▼
VPN（存在性）
   │
   ▼
24靈防護層（判斷/封鎖/審計/演化）
   │
   ▼
RDP（工具端）

三、24靈的職責域（文層）
職責	說明
行為觀測	連線、節奏、時段、指令型態
風險評分	規則＋即時計分
裁決執行	放行／監控／中斷
審計回放	全事件可追溯
演化自癒	規則調整、封鎖策略收斂
四、設計鐵律（文層）

進 VPN 仍可被拒絕 RDP

工具不賦權，權限只來自裁決

全程可審計、可回放、可封鎖

⚙️ 武層（Implementation / 可落地）
一、實體拓撲（武層）
[ Admin PC ]
   │ WireGuard (UDP)
   ▼
[ VPN Hub / Edge ] 10.8.0.0/24
   │
   ├─► [ R-Core Guard Agent ]
   │        ├─ Session Context
   │        ├─ Risk Engine (24靈)
   │        ├─ Enforcer
   │        └─ Audit Writer
   ▼
[ Server ]
   └─ RDP (3389, internal only)

二、VPN（WireGuard）設定要點

不提供出口（0.0.0.0/0 禁止）

只允許管理內網段與必要控制埠

VPN 不是身分、只是條件

[Interface]
Address = 10.8.0.1/24
ListenPort = 51820

[Peer]
AllowedIPs = 10.8.0.2/32
PersistentKeepalive = 25

三、24靈（R-Core Guard Agent）模組
core-guard/
 ├─ GuardBootstrap
 ├─ session/SessionContext
 ├─ risk/RiskScoreEngine + RuleSet
 ├─ enforce/{RdpKiller, FirewallBinder}
 └─ audit/AuditWriter

Session Context（必綁）
vpnIp, userId, connectTime, riskScore, state(ALLOW/WATCH/DENY)

風險計分（示意）

未知裝置、異常時段、重試過快、可疑指令 → 累加

≥70：立即中斷；40–69：監控；<40：放行

四、RDP 攔截與即時封鎖

Windows：檢測非 10.8.* 來源即 Kill

Linux：xrdp 連線來源過濾 → Terminator

FirewallBinder：即時下規則（IP 封鎖）

五、Audit Log（不可省略）
{
  "time": "2026-02-09T21:18:00+08:00",
  "vpnIp": "10.8.0.2",
  "action": "RDP_DENY",
  "risk": 85,
  "reason": "Abnormal behavior"
}


本地保存 → core-auditlog →（選）Discord 通知

六、完整武層流程
VPN 連線
 → 建立 Session
 → RDP 嘗試
 → Risk Engine 評分
 → ALLOW / ENFORCE
 → Audit 紀錄
 → Session 狀態更新

🧠 總結（文武合一）

安全不在通道，在裁決

工具永遠受控，權限永不外溢

任何異常即刻可止、全程可回放

⏱️ 臺灣時間戳

2026-02-09 21:18 (CST / UTC+8 / GMT+08:00)