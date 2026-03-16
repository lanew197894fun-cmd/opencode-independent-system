---
name: system-repair
description: 修復 Ubuntu/AnduinOS 系統 - 清理暫存檔案、優化效能、釋放磁碟空間
color: "#FF9800"
---

## 用途

幫你修復 Ubuntu/AnduinOS 系統，清理暫存檔案、優化效能、釋放磁碟空間。

## 觸發方式

1. **手動觸發**：

   ```
   /system-repair
   ```

2. **語義觸發**：
   - 「修復系統」
   - 「清理系統」
   - 「優化系統」
   - 「釋放空間」

## 執行內容

### 優先順序

1. **首先檢測 AnduinOS 修復**
   - 檢查 `/etc/lsb-release` 是否為 AnduinOS
   - 檢查是否有 AnduinOS ISO 或 repair.sh 腳本
   - 如果有 AnduinOS ISO，執行修復腳本

2. **系統健康檢查**
   - 記憶體使用率 (`free -h`)
   - CPU 使用率 (`top -bn1`)
   - 磁碟空間 (`df -h`)
   - Inode 使用率 (`df -i`)

3. **自動清理動作** (通用)
   - 清理系統快取
   - 清理使用者暫存 (~/.cache)
   - 清理系統日誌
   - 清理 apt 快取
   - 清理 npm/bun 快取
   - 清理縮圖快取

4. **效能優化**
   - 終止高耗資源程序
   - 清理殭屍程序

5. **生成報告**

## AnduinOS 修復 (如果偵測到)

如果系統是 AnduinOS 且有 repair.sh 腳本：

```bash
# 檢測是否為 AnduinOS
cat /etc/lsb-release

# 檢查 repair.sh 是否存在
ls -la /path/to/repair.sh

# 執行修復 (需要 sudo)
bash /path/to/repair.sh
```

修復腳本會：

1. 驗證 ISO 與系統版本相容性
2. 掛載 filesystem.squashfs
3. 還原 APT 設定
4. 安裝缺失的套件
5. 升級 GNOME Shell 擴充功能
6. 還原圖示、主題、桌布
7. 套用 dconf 設定
8. 更新 initramfs 和 GRUB

## 通用清理命令

```bash
# 系統健康檢查
echo "=== 系統狀態 ==="
free -h
df -h /
df -i /
uptime

# 清理系統快取
echo "=== 清理系統快取 ==="
sync && sudo sysctl -w vm.drop_caches=3 2>/dev/null || echo "需要 root 權限"

# 清理使用者暫存
echo "=== 清理暫存檔 ==="
rm -rf ~/.cache/* 2>/dev/null
rm -rf /tmp/* 2>/dev/null

# 清理 apt
echo "=== 清理 apt ==="
sudo apt-get clean
sudo apt-get autoremove -y

# 清理日誌
echo "=== 清理日誌 ==="
sudo journalctl --vacuum-time=7d 2>/dev/null

# 清理縮圖
echo "=== 清理縮圖 ==="
rm -rf ~/.cache/thumbnails/* 2>/dev/null

# 清理 npm/bun 快取
echo "=== 清理 npm/bun 快取 ==="
npm cache clean --force 2>/dev/null
rm -rf ~/.bun/install/cache 2>/dev/null

# 高耗資源程序
echo "=== 高耗資源程序 ==="
ps aux --sort=-%mem | head -10

# 最終狀態
echo "=== 清理後狀態 ==="
df -h /
```

## 安全機制

- 不刪除 /etc、/var/lib/docker 等重要目錄
- 不刪除正在使用的檔案
- 保留最近 7 天的日誌
- 顯示清理前後的磁碟變化
- AnduinOS 修復會驗證版本相容性

Base directory for this skill: .opencode/skill/system-repair
