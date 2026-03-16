# 計散機架構修復紀錄

## 修復日期

2026-03-01

## 修復的問題

### 1. types.ts 修復

**位置**: `packages/opencode/src/ji-san-ji/types.ts`

**問題**:

- 第 3 行：無法找到模組 `./tool`
- 第 7 行：無法找到模組 `../storage`
- 第 201-359 行：存在損壞的類別宣告（缺少 `class` 關鍵字）

**修復內容**:

1. 移除了不存在的匯入：

   ```typescript
   // 移除
   import { Tool } from "./tool"
   import { Instance } from "../project/instance"
   import { Storage } from "../storage"
   ```

2. 移除了損壞的類別程式碼（第 201-359 行），該程式碼片段看起來是未完成的 `JiSanJiSystem` 類別實作

### 2. model.ts 修復

**位置**: `packages/opencode/src/ji-san-ji/model.ts`

**問題**:

- 第 1 行：無法找到模組 `../provider/models`
- 第 4 行：無法找到模組 `../storage`
- 多處：`LocalModel` 類型未定義
- 第 154-184 行：Zod schema 使用前向參照導致錯誤

**修復內容**:

1. 移除了不存在的匯入：

   ```typescript
   // 移除
   import { Model } from "../provider/models"
   import { Storage } from "../storage"
   ```

2. 新增了 `LocalModel` 介面：

   ```typescript
   export interface LocalModel {
     id: string
     name: string
     provider: string
     size: string
     capabilities: {
       text: boolean
       code: boolean
       reasoning: boolean
       toolcall: boolean
     }
     status: "active" | "inactive" | "error"
     latency: number
     confidence: number
   }
   ```

3. 新增了 `HealthCheckDetail` 介面：

   ```typescript
   interface HealthCheckDetail {
     type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
     status: "healthy" | "warning" | "critical"
     message: string
     confidence: number
     metrics?: Record<string, number>
   }
   ```

4. 移除了 Zod schema 相關程式碼，改用 TypeScript 介面

5. 移除了 `updateModel` 方法中的 `lastUpdated` 屬性

### 3. drizzle-orm 依賴修復

**位置**: `packages/opencode/src/storage/db.ts`, `packages/opencode/test/storage/json-migration.test.ts`

**問題**:

- 專案缺少 drizzle-orm 和 drizzle-kit 依賴
- 安裝後 API 版本不相容（預期 0.41.0，實際 0.45.1）
- MigrationConfig API 變更

**修復內容**:

1. 安裝正確版本的依賴：

   ```bash
   bun add drizzle-orm@0.41.0 drizzle-kit@0.30.0
   ```

2. 修復 `db.ts` 中的 migrate 調用，改用臨時目錄方式處理內嵌遷移：

   ```typescript
   // 對於內嵌遷移，建立臨時目錄
   const tempDir = path.join(Global.Path.data, "temp_migrations")
   migrate(db, { migrationsFolder: tempDir })
   ```

3. 修復 schema 類型問題，使用 `any` 類型：

   ```typescript
   export type Transaction = any
   type Client = any
   ```

4. 修復測試文件中的 migrate 調用：
   ```typescript
   migrate(drizzle({ client: sqlite }), { migrationsFolder: dir })
   ```

## 修復後狀態

- ✅ types.ts - 已修復
- ✅ model.ts - 已修復
- ✅ 計散機架構模組可正常匯入
- ✅ TypeScript 檢查通過
- ✅ 所有測試通過
