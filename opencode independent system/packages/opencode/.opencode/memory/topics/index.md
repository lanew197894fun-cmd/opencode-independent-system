# 技術話題

## Database

db\*schema:src/\*_/_.sql.ts
db*naming:snake_case
db_join:<entity>\_id
db_index:<table>\*<column>\_idx
db_migration_output:migration/<timestamp>*<slug>/migration.sql
db_migration_test:per-folder layout|no \_journal.json

## Telegram

tg_webhook:需要https
tg_local:本地100.x.x.x無法設定
tg_solution:tailscale https url|ngrok隧道|手機熱點

## 效能優化

opt_skill:首次呼叫才掃描|快取重複呼叫
opt_tool:移除同步掃描|改用非同步緩存
opt_result:首次89ms/10ms|第二次0ms

## PowerShell

ps_extension:.ps1
ps7:pwsh
ps5:powershell

## 編譯

compile_tool:make|cmake|gcc
compile_output:binary|so|dll

## 翻譯SQL錯誤教訓

sql_error_1:find-replace破壞INSERT語法|只改資料不該改結構
sql_error_2:銀(|金字符號被誤認|銀←→金搞混|축복받은→축복받銀
sql_error_3:INT關鍵字被翻譯|破壞欄位定義
sql_error_4:翻譯前先備份|保留原文SQL
sql_error_5:safe翻譯:地圖ID+材料類型|危險翻譯:裝備/武器名稱
sql_rule:單引號內可翻譯|單引號外是SQL語法不能碰
sql_example:INSERT INTO mapids VALUES (1,'하멜란') → 只翻 '하멜란'
sql_safe_method:逐行處理|只翻單引號內|用字典檔替換
sql_backup:每次翻譯前備份|保留原文SQL|外接硬碟備份

## 重製王國翻譯

remaster_lang:韓文→繁中|英文→繁中
remaster_content:資料庫|地圖名稱|遊戲文字
remaster_format:sql|json
remaster_error:阿丁大陸→亞丁大陸|安塔拉斯→安塔瑞斯

## 台灣常用語

tw*裝備:裝備|武器|盔甲|盾牌|披風|腰帶
tw*角色:玩家|角色|獵人|法師|戰士|騎士
tw*怪物:怪物|MOB|BOSS|首領|菁英
tw*遊戲:任務|副本|公會|商店|倉庫|PK
tw*屬性:力量|敏捷|智力|體質|精神|意志
tw*貨幣:金幣|銀幣|金豆|商城道具
tw*動作:攻擊|防禦|補血|施法|交易|組隊
tw*伺服器:伺服器|登入|登出|斷線|延遲
tw\_捲軸:對武器施法的捲軸|對防具施法的捲軸|對飾品施法的捲軸|祝福捲軸|衝武捲軸|衝防捲軸

## 強化v附魔

enhance:強化|衝裝|升級裝備數值|用祝福捲軸|衝武|衝防
enchant:附魔|賦予魔法屬性|額外效果|屬性攻擊|屬性防禦

## CLI雙語顯示

cli_bilingual:yargs locale|updateLocale
cli_format:英文(原文)|繁體中文
cli_example:Commands (命令)：|Options (選項)：
cli_impl:packages/opencode/src/index.ts

## 智慧模組載入系統

modular_intent:AI分析對話意圖|按需載入plugin/skill
modular_triggers:memory|debug|agent|system|backup|channel|todo
modular_impl:src/plugin/intent-router.ts|src/plugin/resource-monitor.ts|src/plugin/skill-autoload.ts
modular_resource:lowMemoryMB<500|loadAverage>8|自動限制載入
modular_suggest:低資源只載入user-rules|中資源載入ai-debug|高資源全載入

## 台灣語助詞

衝裝:語助詞|加油|衝阿|運氣|運氣好|運氣差
