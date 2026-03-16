# Security Shield 變更記錄

## 日期：2026-02-22

### 類型：新增功能

---

#### 問題/需求

CLI 控制台需要動態系統監控功能，顯示即時 CPU/記憶體使用率

#### 修改檔案

| 檔案                       | 修改內容                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| script/security-console.ts | 新增 `getSystemUsage()`、`drawBar()`、`showDynamicMonitor()` 函數 |
| script/security-console.ts | 選單新增 [10] 系統使用率監控選項                                  |
| script/security-console.ts | 修復 TypeScript 類型錯誤                                          |

#### 功能說明

- **動態 CPU 監控**：即時計算 CPU 使用率，顯示進度條
- **記憶體監控**：顯示總記憶體、已用記憶體、使用百分比
- **系統負載**：顯示 1/5/15 分鐘平均負載
- **進程記憶體**：顯示當前進程 RSS 記憶體使用量
- **視覺化進度條**：依據使用率變色（綠→黃→紅）

#### 測試結果

✅ CLI 正常啟動
✅ 選項 [10] 可進入監控模式
✅ 按 q 可返回主選單

---

## 日期：2026-02-22

### 類型：修復

---

#### 問題/需求

security-console.ts 有重複函數定義和 TypeScript 類型錯誤

#### 修改檔案

| 檔案                       | 修改內容                      |
| -------------------------- | ----------------------------- |
| script/security-console.ts | 移除 main() 內的重複函數定義  |
| script/security-console.ts | 修復 `os.cpus()` 類型轉換問題 |
| script/security-console.ts | 修復 `loadAvg` undefined 檢查 |

#### 測試結果

✅ TypeScript 編譯通過
✅ CLI 正常運行
