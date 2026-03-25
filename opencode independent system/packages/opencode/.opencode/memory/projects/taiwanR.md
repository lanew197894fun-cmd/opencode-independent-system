# 重製王國 工作清單

## 優先順序

### P1 簡單

天堂:簡單修改

### P2 編譯

編譯核心:kernel編譯

### P3 大量

重製王國:工作量比較大|路徑:/home/reamaster/REMASTER_KINGDOM|備份:外接硬碟|又稱天堂R

## 啟動問題

ServerManager.bat:Windows批次檔|用於啟動伺服器
啟動失敗原因:
javafx:全部not found|需安裝JavaFX SDK|這是UI系統
Stream:not found|需補齊JAR
lib路徑:lib\ini4j|lib\xmlapi|lib\commons-net|lib\servlet-api|lib\gson|lib\HikariCP|lib\slf4j|lib\mchange|lib\mysql-connector|lib\javolution|lib\JTattoo|lib\netty|lib\org.eclipse.swt|lib\json-simple

## 解決方案

關鍵設定:config/Synchronization.json
"Operation_Manager":true→false
說明:true=需要JavaFX UI|false=直接啟動伺服器不需UI
方法:修改第10行為false即可無UI啟動

## 研究筆記

啟動流程研究:

1. ServerManager.bat執行TheDay.jar
2. 入口點:MJFxEntry.main()
3. 檢查Config.Synchronization.Operation_Manager
4. true=launch()開啟JavaFX視窗
5. false=直接啟動Server.startGameServer()

2026-03-18發現:可透過關閉UI模式繞過JavaFX依賴問題

## 翻譯注意

翻譯編碼:
sql編碼:utf8mb4(可存繁中)
導入命令:mysql -u root -p --default-character-set=utf8mb4 remaster_reboot < xxx.sql
重要:確保sql文件本身是UTF-8編碼

## 備份位置

原始備份:/home/reamaster/REMASTER*KINGDOM/엠제이*군주*용기사*리부트\_팩/ServerDB/remaster_reboot.sql
翻譯輸出:翻譯後的sql檔案路徑

## 地圖翻譯原則

翻譯原則:按順序翻譯|勿跳號|保持ID對應
翻譯文件:mapids_raw.txt(原始)|map_translation.txt(翻譯)
替換方式:逐行替換韓文名稱為繁中
734個地圖|全部需要翻譯

## 核心系統

src目錄結構:
l1j:核心天堂伺服器代碼
MJFX:JavaFX UI介面系統
server:伺服器主程式
MJNCoinSystem:金幣系統
MJShiftObject:轉移物件系統
BITOPERATION:加密驗證模組

## 核心公用

登入系統:驗證|加密|權限
遊戲系統:角色|物品|技能|地圖
商店系統:商店|交易|拍賣
公會系統:公會|戰爭|領地
聊天系統:密語|公頻|喊話
任務系統:主線|支線|每日
副本系統:副本|首領|獎勵
管理系統:GM指令|日誌|監控

## 翻譯內容

翻譯來源:韓文→繁中|英文→繁中
翻譯目標:資料庫|地圖名稱
翻譯格式:sql

## 資料庫結構

db_type:mysql
db_charset:utf8mb4|euckr(韓文)
db_file:remaster_reboot.sql|68MB
db_tables:458個
翻譯表:mapids|armor|weapon|skill|npc|quest

## NPC與守衛

npc表結構:
npcid:NPC ID|name:名稱|type:類型(Guard/Door/Monster)|locx:X座標|locy:Y座標|mapid:地圖ID|level:等級|hp:HP|mp:MP|aggressive:攻擊性(0-2)|range:範圍
守衛類型:

- Guard:一般守衛|可對話|可攻擊
- Door:門扉|可開關|控制進出
- Merchant:商人|可交易
- Monster:怪物|主動攻擊
  守衛位置:/home/reamaster/REMASTER_KINGDOM/ServerDB/npc.sql

## 安全系統 (2026-03-25)

安全守衛:cli-v2/unified-security-guard.ts|防護內容:掃描eval/exec/spawn/子程序
防護升級:新增15種繞過檢測|新增Sandbox函式|新增行為監控
誤判:full-reference.md技術文檔|解決:加入白名單

## Lobster 工作流 (2026-03-25)

來源:https://github.com/openclaw/lobster|位置:extensions/lobster-source
功能:typed JSON pipelines|jobs|approval gates
命令:exec/run|where|pick/json|llm.invoke|approve
安全:Shell隔離|LLM審批|環境變數|審計日誌

## 翻譯辭典 (2026-03-25)

位置:/media/reamaster/REMASTER KINGDOM/翻譯辭典*官方\_20260318/
Data*台灣:825筆|Data*韓文|Data*英文:mapDesc+SpellDesc|台版:新檔
英文來源:loadragon.com/en/mapids

英文翻譯:

- mapDesc-e.tbl:527筆(地圖)
- SpellDesc-e.tbl:287筆(技能)
- itemdesc-e.tbl:道具
- npcinhouse-e.tbl:NPC

## 資料庫翻譯流程 (2026-03-25)

### 翻譯前測試

1. 先測試樣本:head -20 查看原始數據
2. 小規模測試:翻譯少量行數驗證
3. 備份:cp original.sql backup.sql

### 翻譯命令

```bash
INPUT=原始檔.sql
OUTPUT=翻譯後.sql
sed -e 's/축복받은/祝福的/g' \
    -e 's/스냅퍼/史奈普/g' \
    -e 's/마법/魔法/g' \
    -e 's/저항/抵抗/g' \
    -e 's/반지/戒指/g' \
    -e 's/마나/魔力/g' \
    -e 's/오크/歐克/g' \
    -e 's/트롤/巨魔/g' \
    -e 's/드래곤/龍/g' \
    -e 's/의/的/g' \
    "$INPUT" > "$OUTPUT"
```

### 翻譯後驗證

1. 檢查格式:head -20
2. 比對筆數:wc -l
3. 抽查翻譯:grep 關鍵詞

### 常用韓文翻譯

- 축복받은→祝福的
- 스냅퍼→史奈普
- 마법/법술→魔法/法術
- 저항→抵抗
- 반지→戒指
- 마나→魔力
- Rooms/룸티스→魯提斯
- 오크→歐克
- 트롤→巨魔
- 드래곤→龍
- 갑옷→鎧甲
- 검→劍
- 방패→盾牌
- 귀걸이→耳環
- 의→的

### 翻譯知識記錄

- 原始檔:sql-backup/remaster_reboot_tw_final_20260318_0340.sql
- 輸出檔:翻譯辭典\_官方\_20260318/remaster_reboot_tw_translated_v2.sql
- 大小:65MB|筆數:566616行

## 地圖翻譯

mapids表:458個地圖
mapid:地圖ID|name:地圖名稱(韓文)
範例:말하는 섬→說話之島|오만의 탑→傲慢之塔|안타拉斯→安塔拉斯

## 物品翻譯

### 裝備類型(armor)

CLOTH(천)→布衣|LEATHER(가죽)→皮甲|MINERAL(광물)→礦物|PAPER(종이)→紙
IRON(철)→鐵|MITHRIL(미스릴)→秘銀|ORIHARUKON(오리하루콘)→歐瑞哈康|GOLD(금)→金
SILVER(銀)|COPPER(구리)→銅|DRANIUM(드라이움)→戴mium|PLATINUM(백금)→鉑

### 裝備部位

dagger→單手劍|sword→劍|bow→弓|staff→杖
shield→盾牌|helmet→頭盔|armor→盔甲|cloak→披風
belt→腰帶|T→上衣

### 種族

오크족→獸人|요정족→妖精|인족→人類|드워프족→矮人

## 翻譯注意

翻譯時需注意對街:
javafx:全部not found|需安裝JavaFX SDK
Stream:not found|需補齊JAR
org.json:JSONObject not found|需補JSON庫
TheDay.jar:jce.jar|rt.jar|路徑/usr/lib/jvm/java-8-openjdk-amd64

## 核心依賴 (2026-03-25)

### 缺失依賴(會無法啟動)

- JavaFX:javafx.\*全部缺失
- Stream:自定義JAR未找到
- org.json:JSON庫缺失

### 解決方案

config/Synchronization.json:Operation_Manager:false(關閉UI)
這樣可跳過JavaFX依賴直接啟動伺服器

### UI決策

根據設備配備決定是否開啟UI

- 有JavaFX/足夠資源→可開啟UI
- 無JavaFX/資源有限→關閉UI(預設)

### Java路徑

/usr/lib/jvm/java-8-openjdk-amd64/jre/lib/rt.jar|jce.jar

翻譯:原文翻譯|測試

### P4 種種

其他:種種任務
