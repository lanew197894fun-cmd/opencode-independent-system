## 輕量級 AI 模型適用於舊硬體
date:20260323
context:使用者使用較舊筆電，需要輕量級 AI 解決方案
key_findings:
  - Phi-3 Mini (3.8B) Q4_K_M: 約 2.1GB RAM, 9-14 tok/s, 良好推理性
  - TinyLlama (1.1B) Q5_K_S: 約 1.3GB RAM, 18-25 tok/s, 極快適合筆記
  - Gemma-2B-it (2.5B) Q4_K_M: 約 1.8GB RAM, 7-11 tok/s, 指令跟隨良好
  - 所有模型建議使用 GGUF 格式與 llama.cpp 運行
best_practices:
  - 限制上下文長度 (--ctx-size 1024) 降低記憶體使用
  - 調整執行緒數 (--threads 2) 在雙核筆電上平衡速度與發熱
  - 優先選擇量化模型 (Q4_K_M, Q5_K_S) 而非全精度
  - 避免與記憶體 hog 應用同時運行 (Chrome, Slack 等)
hardware_recommendations:
  - 4GB RAM: TinyLlama 或 Phi-3 Mini 較小量化版
  - 6-8GB RAM: Phi-3 Mini Q4_K_M 或 Gemma-2B-it
  - SSD 或 eMMC 存儲順序讀取 ≥200MB/s 改善載入速度
tools_stack:
  - llama.cpp: 主要推理引擎 ( binary size ≤12.4MB )
  - whispe.cpp: 語音轉文字 (若需要 )
  - meilisearch: 全文搜尋 ( RAM ≤280MB )
  - 輕量級編輯器: Micro, Vim 或 VS Code (停用擴充套件 )
benefits:
  - 低資源佔用：大多數模型在 1-2GB RAM 範圍內運行
  - 離線運作：不依賴網路或雲端服務
  - 隱私保護：所有處理在本機完成
  - 成本效益：利用既有硬體，避免新購設備
related_to: resource-conscious-usage|on-demand-loading|continuous-improvement
usage_scenarios:
  - 編碼輔助與除錯
  - 技術文檔閱讀與摘要
  - 筆記與知識管理
  - 零星自然語言處理任務