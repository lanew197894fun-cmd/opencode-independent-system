# [新增] bun-check 腳本增強 CPU 相容性檢查與沙盤測試模式

## 功能

增強了 bun-check.mjs 腳本以解決以下問題：

1. 防止更新到過新版本導致 CPU 不支援（特別是缺少 AVX2）造成功能異常
2. 加入沙盤測試模式，在實際升級前先模擬並驗證升級穩定性
3. 改進升級過程中的錯誤處理與逾時保護
4. 增強版本歷史追蹤與回滾功能

## 使用方式

### 基本檢查（含 CPU 相容性警告）

```bash
node bun-check.mjs
```

### 沙盤模式測試升級（安全檢查 - 建議首次使用）

```bash
node bun-check.mjs --test --upgrade
```

### 實際升級（會自動檢查 CPU 相容性）

```bash
node bun-check.mjs --upgrade
```

### 強制升級（忽略 CPU 警告，僅在確定硬體支援時使用）

```bash
node bun-check.mjs --upgrade --force
```

### 回滾到上一版本

```bash
node bun-check.mjs --rollback
```

### 查看版本歷史

```bash
node bun-check.mjs --history
```

## 架構

修改的主要檔案：

- `~/.opencode/skill/bun-check/scripts/bun-check.mjs`

核心增強功能：

1. `getLatestBunVersion()` - 動態從 GitHub 獲取最新版本
2. `getUpgradeRecommendation(current, latest, cpuFeatures)` - 基於 CPU 特徵提供智慧升級建議
3. `checkCpuCompatibility(currentVersion, targetVersion, cpuFeatures)` - 檢查目標版本是否需要較新的指令集
4. 沙盤模式 (`--test` / `--dry-run`) - 模擬完整升級過程包括穩定性測試
5. 改進的升級流程 - 加入逾時保護、錯誤處理和資源清理

## 測試

在 Intel(R) Core(TM) i5-5200U CPU @ 2.20GHz (支援 AVX2) 上的測試結果：

1. 基本檢查正常顯示 CPU 支援資訊和版本狀態
2. 沙盤模式成功模擬升級過程並顯示驗證步驟
3. CPU 相容性檢查正常工作（在測試環境中所有功能皆可用）
4. 版本歷史記錄功能正常
5. 回滾功能可用（需實際版本差異才能完整測試）

## 相關

- 檔案：`~/.opencode/skill/bun-check/scripts/bun-check.mjs`
- 相關技能：bun-check
- 問題解決：防止因更新到需要 AVX2 但 CPU 不支援的版本導致的功能異常
