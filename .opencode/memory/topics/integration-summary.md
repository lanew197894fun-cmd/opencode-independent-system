## OpenCode 系統管理工具箱整合
date:2026-03-24
source:從 OpenClawInstaller 移植

### 插件總覽
| 插件 | 檔案 | 工具數 | 功能 |
|------|------|--------|------|
| clawteam | clawteam.ts | 23 | 多代理蟲群協作 (外部) |
| swarm | swarm.ts | 17 | 內建蟲群系統 |
| backup-sync | backup-sync.ts | 14 | 備份同步+上傳控制 |
| service-manager | service-manager.ts | 8 | 服務管理 |
| channel | channel.ts | 9 | 通訊渠道 (加密) |

### 跨平台支援
- Windows: D:\Tools\opencode\...
- Linux: ~/opencode-manager/...
- macOS: /Volumes/...

### 新增功能
- 知識庫自動 GitHub 同步
- 上傳加密通知
- 權杖加密儲存
- 全域上傳控制

### 資料位置
- 備份: .opencode/backup/
- 通道: .opencode/config/channels.json
- 上傳控制: .opencode/config/upload-control.json
- 備份路徑: .opencode/config/backup-paths.json