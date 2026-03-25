## 當說服無效時使用程式碼自動化修正
date:20260323
context:當透過說明、文件或溝通無法確保團隊成員遵守最佳實踐時，應該使用程式碼層面的自動化工具來強制執行標準
principle:說服(教育、文件)失敗時，轉而使用程式碼機制來預防問題而非事後修復
tools_and_techniques:
  - ESLint: 邏輯級別錯誤檢測和自動修復
  - Prettier: 程式碼格式化，消除樣式爭議
  - Husky + lint-staged: Git pre-commit 鉤子，在提交前自動執行檢查
  - Biome: 一體化的格式化和檢測工具（較ESLint+Prettier更快）
implementation:
  - 安裝依賴: npm install --save-dev eslint prettier husky lint-staged
  - 配置 lint-staged 在 package.json 中對特定檔案類型執行 eslint --fix 和 prettier --write
  - 初始化 Husky: npx husky install
  - 添加 pre-commit 鉤子: npx husky add .husky/pre-commit "npx lint-staged"
  - 使鉤子可執行: chmod +x .husky/pre-commit
benefits:
  - 消除來回討論格式問題（tab vs space, semicolons等）
  - 自動捕獲和修復常見錯誤（未使用變數、missing semicolons等）
  - 確保所有提交符合最低品質標準，減少code review負擔
  - 在問題進入代碼庫之前就予以阻止（shift-left 原則）
best_practices:
  - 格式化所有支援的檔案類型，而不僅是程式碼
  - 早且經常執行：在編輯器中儲存時和提交時都執行
  - 不要過度客製化：使用格式化工具的預設值以減少維護負擔
  - 分離格式化提交：在採用格式化時，將樣式變更與邏輯變更分開提交
  - 在CI中驗證：不要只依賴pre-commit鉤子，在CI中也要執行完整檢查
related_to: resource-conscious-usage|continuous-improvement|learning-response-attitude
usage_scenarios:
  - 團隊協作中的程式碼品質維護
  - 當說服團隊成員遵守最佳實踐失敗時的後備機制
  - 預防性品質控制而非事後修復
  - 減少技術債積累