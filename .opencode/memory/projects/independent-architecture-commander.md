## fact: 獨立架構指揮官.服務統一管理系統.CLI+Web+REST API

## decision: 指揮官架構.核心管理器+CLI+Web+REST API 三層分離

## fact: 指揮官功能
- 服務管理: 啟動/停止/重啟/自動重啟
- 健康檢查: HTTP 端點檢測/自動重啟
- 依賴管理: 自動啟動依賴服務
- 事件系統: 服務狀態變更通知
- 日誌收集: 統一查看所有服務日誌
- 配置持久化: ~/.independent-architecture/commander/

## fact: 預設服務
- opencode: OpenCode AI 服務 (端口 3000)
- openclaw: OpenClaw 系統 (端口 8080)
- ollama: Ollama 本地模型 (端口 11434)

## fact: Web 介面功能
- 狀態總覽儀表板
- 服務卡片管理
- 批量操作按鈕
- 日誌查看彈窗
- 安全中心面板
- 事件日誌列表
- 自動刷新 (30秒)

## fact: REST API 端點
- GET /api/services - 服務列表
- POST /api/service/:name/start|stop|restart
- GET /api/service/:name/health|logs
- POST /api/start-all|stop-all|restart-all
- GET /api/events|security/status

## fact: 自動化功能
- 自動重啟: 崩潰後重啟,最多3次,冷卻5秒
- 健康檢查: 每30秒檢測,失敗自動重啟
- 依賴順序: 自動按依賴關係啟動

## fact: 指揮官文件
- CLI 命令: commander-commands.ts
- 核心系統: commander.ts
- Web 伺服器: commander-web-server.ts
- 使用指南: COMMANDER_GUIDE.md

## decision: 未來發展.主腦副腦架構|集群管理|WebSocket即時更新

## fact: 與遊戲伺服器對比.獨立架構整合安全守衛/插件系統/統一管理
