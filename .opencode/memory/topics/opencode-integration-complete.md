## OpenCode 系統管理工具箱整合
date:2026-03-24
source:OpenClawInstaller 移植優化

### 已建立插件
1. backup-sync.ts - 8 個工具
2. service-manager.ts - 8 個工具  
3. channel.ts - 9 個工具

### 工具總數
- 服務管理: start/stop/status/health/logs/restart/web/terminal
- 備份同步: detect/list/local/sync/restore/status/sync_project/list_projects
- 通訊渠道: telegram_setup/status, discord_setup/status, line_setup/status, list, disable, test

### 特色
- 全部使用 TypeScript，無外部依賴
- 與 OpenCode 深度整合
- 支援多渠道 (Telegram/Discord/LINE)
- 完整備份還原流程