## Ubuntu DMAR/VT-d 錯誤修復

### 問題
Acer E5-573G 筆電開機時出現:
- DMAR: [Firmware Bug] No firmware reserved region
- DMAR: DRHD handling fault
- tpm_crb probe failed
- 系統會卡住

### 原因
BIOS 中 Intel VT-d 與 Linux 相衝

### 解決方法

```bash
# 1. 關閉 VT-d
sudo sed -i 's/GRUB_CMDLINE_LINUX_DEFAULT="/GRUB_CMDLINE_LINUX_DEFAULT="intel_iommu=off /' /etc/default/grub
sudo update-grub

# 2. 重啟
sudo reboot
```

### 驗證
重啟後檢查:
```bash
dmesg | grep -i "DMAR\|dmar"
```

### 參考
- https://wiki.archlinux.org/title/Intel_VT-d
