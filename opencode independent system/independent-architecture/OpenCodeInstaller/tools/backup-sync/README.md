# OpenCode 備份同步工具箱

可複製到 USB/外接硬碟使用的獨立備份工具。

## 目錄結構

```
tools/backup-sync/
├── toolbox.sh              # 主程式（互動選單）
├── detect-storage.sh       # 檢測外接儲存裝置
├── sync-to-storage.sh      # 同步 OpenCode 配置到外接儲存
├── restore-backup.sh       # 從備份還原
├── local-backup.sh         # 本地備份
├── list-backups.sh         # 列出備份
├── check-status.sh         # 查看狀態
├── sync-project.sh         # 自定義項目同步（其他專案）
└── README.md               # 說明文件
```

## 使用方法

### 1. 互動選單（推薦）

```bash
cd /path/to/backup-sync
./toolbox.sh
```

### 2. 命令列

```bash
# 檢測外接儲存裝置
./toolbox.sh detect

# 同步 OpenCode 配置到外接儲存
./toolbox.sh sync /media/reamaster/USB

# 從外接儲存還原
./toolbox.sh restore /media/reamaster/USB/OpenCode_Backup_20260317

# 本地備份
./toolbox.sh local

# 列出所有備份
./toolbox.sh list

# 查看狀態
./toolbox.sh status
```

### 3. 自定義項目同步

```bash
# 列出可用專案
./sync-project.sh list

# 同步單一專案
./sync-project.sh /home/reamaster/openclaw-manager/openclaw /media/USB/backup

# 互動選單
./sync-project.sh menu

# 同步多個專案
./sync-project.sh sync_multiple
```

## 功能說明

| 功能     | 說明                                |
| -------- | ----------------------------------- |
| detect   | 自動檢測已掛載的 USB/外接硬碟       |
| sync     | 同步 .openclaw 目錄到外接儲存       |
| restore  | 從外接儲存的備份還原到本機          |
| local    | 建立本地備份（~/.openclaw/backups） |
| list     | 列出本機和外接儲存的所有備份        |
| status   | 查看目前的配置狀態                  |
| project  | 自定義項目同步（可指定任意專案）    |
| projects | 一次同步多個專案到外接儲存          |

## 可同步的專案

| 專案             | 路徑                                           | 大小  |
| ---------------- | ---------------------------------------------- | ----- |
| OpenCode Manager | ~/openclaw-manager                             | ~8.8G |
| OpenCode 龍蝦    | ~/openclaw-manager/openclaw                    | ~2.7G |
| OpenCode 開發    | ~/openclaw-manager/opencode independent system | ~2.1G |
| OpenCode 配置    | ~/.opencode                                    | ~144M |
| OpenCode 配置    | ~/.openclaw                                    | ~450M |

## 攜帶版使用方法

1. 複製整個 `backup-sync` 資料夾到 USB
2. 在任何 Linux/Mac 系統上執行
3. 需要確保有存取 ~/ 的權限

## 依賴

- bash
- tar（預設）
- rsync（可選，有則使用）

## 注意事項

- 備份會排除 node_modules, .cache, logs 等大型資料
- 還原前會自動備份目前的配置
- 建議定期同步到外接儲存確保資料安全
