- 若要重新產生 JavaScript SDK，請執行 `./packages/sdk/js/script/build.ts`。
- 盡可能使用平行工具。
- 此儲存庫的預設分支是 `dev`。
- 本地 `main` 引用可能不存在；使用 `dev` 或 `origin/dev` 進行差異比較。
- 優先自動化：除非缺少資訊或安全/不可逆因素，否則直接執行請求的動作而不需確認。

## 修復過程 查證過程 新增過程須紀錄相關知識 知識庫內

查找修正問題須紀錄查證過程

## 程式碼風格指南

### 基本原則

- 除非可組合或可重複使用，否則將程式碼放在同一個函式中
- 盡量避免使用 `try`/`catch`
- 避免使用 `any` 類型
- 盡可能使用單字變數名稱
- 盡可能使用 Bun API，例如 `Bun.file()`
- 盡依賴類型推斷；除非必要（為了匯出或清晰度），否則避免明確的類型註釋或介面
- 優先使用函式式陣列方法（flatMap、filter、map）而非 for 迴圈；在 filter 上使用類型守衛以維持下游的類型推斷

### 命名

變數和函式優先使用單字名稱。只有在必要時才使用多個單字。

```ts
// 好的範例
const foo = 1
function journal(dir: string) {}

// 不好的範例
const fooBar = 1
function prepareJournal(dir: string) {}
```

當一個值只使用一次時，透過內聯來減少總變數數量。

```ts
// 好的範例
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// 不好的範例
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### 解構

避免不必要的解構。使用點記號來保留上下文。

```ts
// 好的範例
obj.a
obj.b

// 不好的範例
const { a, b } = obj
```

### 變數

優先使用 `const` 而非 `let`。使用三元運算子或提前返回來代替重新賦值。

```ts
// 好的範例
const foo = condition ? 1 : 2

// 不好的範例
let foo
if (condition) foo = 1
else foo = 2
```

### 控制流

避免 `else` 語句。優先使用提前返回。

```ts
// 好的範例
function foo() {
  if (condition) return 1
  return 2
}

// 不好的範例
function foo() {
  if (condition) return 1
  else return 2
}
```

### Schema 定義 (Drizzle)

欄位名稱使用 snake_case，這樣欄位名稱就不需要重新定義為字串。

```ts
// 好的範例
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// 不好的範例
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## 測試

- 盡可能避免使用 mock
- 測試實際實作，不要將邏輯複製到測試中
- 測試無法從儲存庫根目錄執行（守衛：`do-not-run-tests-from-root`）；請從套件目錄執行，例如 `packages/opencode`。
