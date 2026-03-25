# Lineage 天堂私服管理

管理 Lineage 天堂私服伺服器。

## 支援版本

| 版本       | 路徑                               | 類型      |
| ---------- | ---------------------------------- | --------- |
| Remastered | `/home/reamaster/REMASTER_KINGDOM` | Java JAR  |
| 385/386    | `/home/reamaster/貓神/385`         | Java 源码 |
| L1J 182    | `/home/reamaster/docker-182`       | Docker    |

## 常用指令

### 狀態

```bash
lineage status [version]
```

查看伺服器運行狀態

### 啟動/停止

```bash
lineage start [version]
lineage stop [version]
lineage restart [version]
```

### 資料庫

```bash
lineage db backup [version] [name]
lineage db restore [version] <backup_file>
lineage db list [version]
```

### 日誌

```bash
lineage log [version] [--lines N]
lineage log error [version]
```

### Docker (L1J 182)

```bash
lineage docker start
lineage docker stop
lineage docker status
lineage docker logs [--follow]
```

## 配置

版本配置存在 `~/.opencode/lineage-server/config.json`：

```json
{
  "default": "remastered",
  "servers": {
    "remastered": {
      "path": "/home/reamaster/REMASTER_KINGDOM",
      "jar": "TheDay.jar",
      "port": 7777,
      "db": "remaster_reboot_tw"
    },
    "385": {
      "path": "/home/reamaster/貓神/385",
      "bin": "bin",
      "port": 7777
    },
    "182": {
      "path": "/home/reamaster/docker-182",
      "docker_compose": "docker-compose.yml",
      "db_container": "l1j182_db"
    }
  }
}
```

## 農怪/練功管理

```bash
lineage farming spots [--level N]     # 查詢練功點
lineage farming map <map_id>          # 查看地圖怪物
lineage farming mob <mob_id>          # 查看怪物資料
lineage farming bosses                # 查詢王區
lineage farming suggest <level>       # 練功建議 (1-80)
lineage farming stats <map_id>        # 地圖統計
```

### 常見練功點

| 等級  | 地圖           | 怪物         |
| ----- | -------------- | ------------ |
| 1-10  | 肯特           | 初期怪物     |
| 25-40 | 傲慢1-2F       | 巨蟻、洞穴怪 |
| 40-55 | 傲慢3F、妖魔城 | 異眼、妖魔   |
| 50-65 | 銀色騎士團     | 騎士團       |
| 55-70 | 龍之谷         | 火龍、水龍   |
| 65-80 | 火龍窟         | 火龍王       |

### 王區

| 王名     | 地圖   | 掉落 |
| -------- | ------ | ---- |
| 安塔瑞斯 | 龍之谷 | 龍皮 |
| 弗林卡   | 水龍谷 | 龍鱗 |
| 火龍王   | 火龍窟 | 龍骨 |
| 巴爾     | 古龍丁 | 龍血 |

## 需求

- Java 17+ (Remastered, 385)
- Docker + Docker Compose (182)
- MySQL client (資料庫操作)
