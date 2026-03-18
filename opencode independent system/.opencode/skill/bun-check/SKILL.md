---
name: bun-check
description: Bun 版本偵測、硬體相容性檢查與自動更新管理（支援 Linux/macOS/Windows）
---

# bun-check 使用指引

Bun 版本管理工具，檢測硬體相容性並提供升級/回滾功能。

## 支援平台

- ✅ Linux (Ubuntu/Debian/Arch 等)
- ✅ macOS (Intel & Apple Silicon)
- ✅ Windows

## 觸發關鍵字

`bun`、`bun 版本`、`bun upgrade`、`bun 更新`、`bun-check`、`cpu 支援`、`bun 回滾`

---

## 功能

| 功能       | 說明                                                 |
| ---------- | ---------------------------------------------------- |
| 版本檢查   | 檢測當前 Bun 版本與最新版本                          |
| 硬體相容性 | 偵測 CPU 支援的指令集 (AVX/AVX2/AVX512/SSE4/BMI/AES) |
| 升級管理   | 自動升級，自動檢查 CPU 相容性                        |
| 版本歷史   | 記錄升級/回滾歷史                                    |
| 回滾       | 支援回滾到上一個穩定版本                             |

---

## 使用方式

```bash
# 基本檢查
bun-check.mjs

# JSON 輸出
bun-check.mjs --json

# 顯示版本歷史
bun-check.mjs --history

# 升級 Bun
bun-check.mjs --upgrade

# 強制升級（忽略 CPU 警告）
bun-check.mjs --upgrade --force

# 回滾到上一版本
bun-check.mjs --rollback

# 回滾到指定版本
bun-check.mjs --rollback 1.3.10
```

---

## 腳本位置

`~/.opencode/skill/bun-check/scripts/bun-check.mjs`

---

## 硬體相容性說明

| Profile  | 需求    | 說明       |
| -------- | ------- | ---------- |
| avx512   | AVX-512 | 最佳效能   |
| avx2     | AVX2    | 推薦       |
| avx      | AVX     | 基礎       |
| baseline | 無      | 相容性模式 |

---

## AI 調用範例

當用戶詢問「檢查 bun 版本」或「我的 CPU 支援新版 bun 嗎」，調用：

```
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs
```

當用戶需要升級時：

```
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --upgrade
```

當需要回滾時：

```
node ~/.opencode/skill/bun-check/scripts/bun-check.mjs --rollback
```
