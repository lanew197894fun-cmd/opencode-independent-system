## 資源管理原則：不浪費資源，不被資源浪費
date:20260323
principle:學會如何不浪費資源，也要避免讓資源被浪費（在自己身上）
core_concepts:
  - 主動資源管理而非被動消耗
  - 有意識的資源使用決策
  - 預防性維護勝過事後修復
key_practices:
  - 定期監控資源使用 (df -h, free -h, ps aux)
  - 按需載入而非常駐服務
  - 量化和優化以減少佔用
  - 清理快取和暫存檔案
  - 移除不必要的除錯語句和日誌
  - 使用輕量級替代方案
  - 延遲初始化：只在需要時才分配資源
  - 設定資源使用閾值和警報
application_scenarios:
  - 系統維護和優化
  - 程式碼開發和部署
  - 個人設備使用（特別是較舊硬體）
  - 雲端服務和訂閱管理
mindset:
  - 資源是有限的，應該被珍視和明智使用
  - 測量和監控是改進的基礎
  - 小的節省累積起來會有顯著影響
  - 自動化有助於維持一致的資源管理
related_to: resource-conscious-usage|on-demand-loading|continuous-improvement|system-maintenance