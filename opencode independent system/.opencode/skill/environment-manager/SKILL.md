---
name: environment-manager
description: 環境自動偵測與配置 - 自動判斷系統環境、配置環境變數、更新依賴
color: "#2196F3"
---

## 功能說明

自動偵測使用者系統環境，根據不同環境條件自動配置最佳設定，並維護依賴更新。

## 環境偵測

### 作業系統偵測

| 系統    | 偵測方式   | 特殊處理              |
| ------- | ---------- | --------------------- |
| Linux   | `uname -a` | 檢測發行版、libc 類型 |
| macOS   | `sw_vers`  | 檢測架構 (Intel/ARM)  |
| Windows | `ver`      | 檢測版本、WSL 環境    |

### 環境變數偵測

```bash
# Node 環境
node --version
npm --version
bun --version
pnpm --version

# Python 環境
python --version
python3 --version
pip --version

# Git 環境
git --version

# 編譯工具
gcc --version
make --version
```

### 硬體環境偵測

```bash
# CPU 核心數
nproc  # Linux
sysctl -n hw.ncpu  # macOS

# 記憶體大小
free -h  # Linux
vm_stat  # macOS

# 磁碟類型
lsblk -d -o name,rota  # Linux (SSD/HDD)
diskutil info /  # macOS
```

## 自動配置

### 根據記憶體調整

| 記憶體 | Node 記憶體限制 | 並發數 | 快取大小 |
| ------ | --------------- | ------ | -------- |
| < 4GB  | 2GB             | 1      | 小       |
| 4-8GB  | 4GB             | 2      | 中       |
| 8-16GB | 8GB             | 4      | 大       |
| > 16GB | 無限制          | 8+     | 最大     |

### 根據 CPU 調整

| CPU 核心 | 編譯並發 | 測試並發 | 類型檢查並發 |
| -------- | -------- | -------- | ------------ |
| 1-2 核   | 1        | 1        | 1            |
| 2-4 核   | 2        | 2        | 2            |
| 4-8 核   | 4        | 4        | 4            |
| > 8 核   | 8        | 8        | 8            |

### 根據磁碟類型調整

| 磁碟類型 | 檔案監控 | 快取策略 |
| -------- | -------- | -------- |
| SSD      | 啟用     | 積極快取 |
| HDD      | 降頻     | 謹慎快取 |
| 網路磁碟 | 停用     | 最小快取 |

## 自動環境配置腳本

### Linux

```bash
# 檢測發行版
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo "發行版: $NAME $VERSION"
fi

# 檢測 libc 類型
ldd --version | head -1

# 設定環境變數
export NODE_OPTIONS="--max-old-space-size=$(($MEM_MB / 2))"
```

### macOS

```bash
# 檢測架構
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  echo "Apple Silicon"
else
  echo "Intel Mac"
fi

# Homebrew 路徑
if [ "$ARCH" = "arm64" ]; then
  export PATH="/opt/homebrew/bin:$PATH"
else
  export PATH="/usr/local/bin:$PATH"
fi
```

### Windows (WSL)

```bash
# 檢測 WSL 版本
wsl.exe --version 2>/dev/null || echo "WSL 1"

# Windows 路徑整合
export PATH="$PATH:/mnt/c/Windows/System32"
```

## 依賴更新管理

### 自動檢查更新

```
檢查頻率: 每天
檢查項目:
  - package.json 中的依賴
  - 全域工具版本
  - Node/Bun 版本
```

### 更新策略

| 依賴類型      | 更新策略   | 測試要求 |
| ------------- | ---------- | -------- |
| Patch (x.x.1) | 自動更新   | 基本     |
| Minor (x.1.0) | 提示後更新 | 完整     |
| Major (1.0.0) | 手動確認   | 全面     |

### 執行更新

```bash
# Bun 專案
bun update

# 檢查過時依賴
bun outdated

# 安全更新
bun audit

# 清理未使用依賴
bun prune
```

## 環境配置檔案

生成 `.opencode/environment.json`:

```json
{
  "detected": {
    "os": "linux",
    "distro": "Ubuntu 22.04",
    "arch": "x86_64",
    "cpuCores": 8,
    "memoryGB": 16,
    "diskType": "ssd"
  },
  "configured": {
    "nodeMemory": 8192,
    "concurrency": 4,
    "cacheSize": "large",
    "fileWatcher": true
  },
  "lastCheck": "2026-02-18T00:00:00Z",
  "dependencies": {
    "node": "20.0.0",
    "bun": "1.0.0"
  }
}
```

## 執行前環境檢查

AI 在執行任務前應確認：

```
1. 環境是否已配置？
   ├─ 是 → 繼續
   └─ 否 → 執行自動配置

2. 依賴是否完整？
   ├─ 是 → 繼續
   └─ 否 → 執行 bun install

3. 版本是否相容？
   ├─ 是 → 繼續
   └─ 否 → 提示更新或降級

4. 資源是否足夠？
   ├─ 是 → 執行任務
   └─ 否 → 調整配置或提示
```

## 使用方式

```
# 自動觸發
首次執行時自動偵測環境

# 手動觸發
「檢查環境」
「更新環境配置」
「更新依賴」
「檢查過時套件」
```

## 常見問題處理

| 問題          | 偵測方式                | 解決方案          |
| ------------- | ----------------------- | ----------------- |
| Node 版本不符 | `node --version`        | 使用 nvm/fnm 切換 |
| 依賴缺失      | `bun install --dry-run` | 執行 bun install  |
| 權限不足      | 測試寫入                | 調整目錄權限      |
| 磁碟空間不足  | `df -h`                 | 清理快取          |
| 網路問題      | ping 測試               | 離線模式或重試    |
