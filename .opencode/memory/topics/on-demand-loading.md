## 按需載入 (On-Demand Loading) 最佳實踐
date:20260323
principle:只在真正需要時載入資源，避免常駐佔用
implementation:
  - 使用快取避免重複載入 (Map/弱映射)
  - 私有載入方法封裝實際IO/解析邏輯
  - 公有介紹先檢查快取再載入
benefits:
  - 降低基礎記憶體佔用 (常駐100MB+ → 10MB以下)
  - 加快啟動速度 (無需預載入所有可能不用功能)
  - 只在需要時消耗CPU進行解析/初始化
example_pattern: |
  class Loader {
    private cache = new Map()
    async load(name) {
      if (this.cache.has(name)) return this.cache.get(name)
      const item = await this._loadFromSource(name)
      this.cache.set(name, item)
      return item
    }
    private async _loadFromSource(name) { /* 實際載入 */ }
  }
usage_scenarios:
  - 插件/技能系統 (OpenCode skill載入)
  - 大型依賴庫 (僅在需要特定功能時載入)
  - 配置檔案 (按需解析所需區段)
  - 應用程式狀態 (延遲初始化服務)
related_concepts: lazy_initialization|dependency_injection|resource_pooling