# Lineage 天堂 - 農怪/練功管理

管理伺服器練功點、刷怪點、怪物刷新。

## 地圖練功點

| 地圖ID | 地圖名稱    | 練功等級 | 怪物     |
| ------ | ----------- | -------- | -------- |
| 4      | 龍之谷      | 50-70    | 火龍     |
| 5      | 龍之谷      | 50-70    | 水龍     |
| 6      | 傲慢之塔 1F | 30-40    | 巨蟻     |
| 7      | 傲慢之塔 2F | 35-45    | 洞穴怪   |
| 8      | 傲慢之塔 3F | 40-50    | 異眼     |
| 4x     | 火龍窟      | 60-80    | 火龍     |
| 100    | 荒廢之城    | 45-60    | 黑暗妖精 |
| 200    | 銀色騎士團  | 50-65    | 騎士團   |
| 300    | 肯特小屋    | 1-10     | 初期怪物 |
| 400    | 妖魔城      | 35-55    | 妖魔     |

## 管理指令

```bash
# 查看怪物資料
lineage farming mob <mob_id>

# 查看地圖怪物
lineage farming map <map_id>

# 查詢練功點
lineage farming spots [--level N] [--map N]

# 怪物統計
lineage farming stats <map_id>

# 刷新地圖怪物
lineage farming respawn <map_id>

# 查詢王區
lineage farming bosses

# 練功建議
lineage farming suggest <level>
```

## 怪物分類

### 初期 (1-10級)

- 鹿、羊、狐狸、狼崽

### 中期 (20-40級)

- 殭屍、毒蜘蛛、骷髅、哥布林

### 後期 (45-65級)

- 黑暗妖精、巨人、龍骨

### 終期 (70+級)

- 火焰龍、水龍、龍王

## 資料來源

- 怪物資料: `data/mob.txt`
- 地圖資料: `maps/*.txt`
- 刷怪設定: `data/spawn*.dat`
