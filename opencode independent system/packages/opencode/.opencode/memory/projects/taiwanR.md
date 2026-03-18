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

翻譯:原文翻譯|測試

### P4 種種

其他:種種任務
