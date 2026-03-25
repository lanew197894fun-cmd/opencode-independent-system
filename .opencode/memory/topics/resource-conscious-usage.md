## 資源意識使用 與 善待硬體
date:20260323
context:用戶使用較舊筆電，提醒技術優化需考慮實際資源佔用
principles:
- 按需載入而非常駐服務
- 最小化資源佔用（記憶體、磁碟、CPU）
- 避免不必要的常駐進程和後台任務
- 延遲初始化：只在真正需要時載入資源
practices:
- 清理系統暫存、使用者快取和日誌（曾釋放約4GB空間）
- 移除除錯語句和過時註解以減少程式碼開銷
- 採用功能模組化與技能延遲掃描
- 監控資源使用：df -h, free -h, ps aux
application:
- 老舊硬體友好：降低基礎記憶體佔用，加快啟動響應
- 可攜性：最小依賴，易於在不同環境中運行
- 永續性：減少硬體磨損與能耗
reminder:善待自己的身體與設備，技術應服務於人而非加重負擔
related_to:on-demand-loading|continuous-improvement|system-maintenance