## fact: 獨立架構插件系統.整合VPN|RDP|24小時防禦|防詐騙|衝突檢測

## decision: 插件熱拔差支援.enable/disable即時生效.無需重啟

## fact: 統一安全守衛功能
- VPN 管理: WireGuard 連線/斷線
- RDP 防護: 3389 阻擋/白名單
- 24小時防禦: fail2ban 整合
- 防詐騙檢測: 訊息分析/風險評分
- 插件衝突: 自動檢測/禁止/通知

## fact: 插件安全檢測模式
- 危險程式碼: eval|exec|child_process|process.exit
- 詐騙風險: API Key外洩|加密貨幣盜取|金融資料盜取
- 敏感 Hook: cli.shutdown|session.save
- 可疑模式: 無作者但有外部依賴

## fact: 技能安全檢測模式
- 危險操作: git push --force|DROP TABLE|rm -rf
- 詐騙風險: 假冒登入|社交工程|URL重定向
- 管道執行: curl|wget 管道下載

## fact: 衝突檢測自動禁止
- 發現衝突時立即禁止插件
- 通知用戶衝突原因
- 支援白名單例外
- 熱拔差: 無需重啟即可生效

## fact: 衝突模式定義
- builtin-logger ↔ silent-logger: 重複日誌
- builtin-memory ↔ external-memory: 記憶系統衝突
- security-vpn ↔ security-off: VPN與關閉安全衝突

## decision: 安全等級.Safe(✅)|Warning(⚠️)|Dangerous(🚨)|Blocked(⛔)

## fact: 插件管理命令
- plugin list/enabled/disabled: 列表
- plugin install/update/uninstall: 安裝管理
- plugin enable/disable/reload: 熱拔差
- plugin info/security/config: 資訊查詢
- plugin search: 搜尋
- plugin audit: 審計日誌

## fact: 通知系統.衝突/阻擋/警告/安全.自動操作:Blocked|Disabled|Ignored

## fact: 插件文件位置
- 指南: cli-v2/PLUGIN_GUIDE.md
- 源碼: cli-v2/unified-security-center.ts
- 源碼: cli-v2/ia-plugin-manager.ts
- 源碼: cli-v2/plugin-security-guard.ts

## decision: 知識庫格式.fact:事實|decision:原則|用|分隔多值
