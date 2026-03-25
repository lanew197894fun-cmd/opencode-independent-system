## fact: 獨立架構.完全自主研發的私有化AI控制中心.品牌:IA

## decision: 品牌定位
- 全名: 獨立架構 (Independent Architecture)
- 簡稱: IA
- 口號: 完全獨立，100% 自主
- 定位: 私有化 AI 控制中心

## fact: 核心模組
- Gateway: 消息路由/頻道管理/訊息監聽
- Commander: 服務管理/健康檢查/自動重啟
- SecurityGuard: 插件檢測/衝突檢測/防詐騙
- UnifiedSecurityCenter: VPN管理/RDP防護/24小時防禦
- PluginSystem: 插件管理/Hook系統/熱拔差
- Memory: 短期記憶/長期記憶/偏好學習
- Knowledge: 知識存取/語意搜尋/經驗記錄

## fact: CLI v2 結構
- gateway.ts: 網關核心
- gateway-commands.ts: 網關命令
- commander.ts: 指揮官核心
- commander-commands.ts: 指揮官命令
- commander-web-server.ts: Web UI
- unified-security-center.ts: 安全中心
- unified-security-guard.ts: 安全守衛
- ia-plugin-manager.ts: 插件管理器

## fact: 介面支援
- CLI: 終端命令列
- Web: 瀏覽器圖形介面 (port 3001)
- REST: API 端點

## fact: 預設服務
- opencode: OpenCode AI (port 3000)
- openclaw: OpenClaw 系統 (port 8080)
- ollama: 本地模型 (port 11434)

## fact: 啟動命令
- ia start: 啟動 CLI
- ia web start: 啟動 Web UI
- ia gateway: 網關模式
- ia commander: 服務管理

## fact: 品牌原則
- 不使用外部系統/拿來主義
- 100% 自己開發
- 完全可控/安全可靠
- 插件化設計/熱拔差
- 私有化部署/資料本地

## decision: 發展方向
- 主腦/副腦架構
- 集群管理
- 移動端 App
- AI 自進化系統
