---
name: openhue
description: Philips Hue 燈光控制 - 透過 OpenHue CLI
homepage: https://www.openhue.io/cli
metadata:
  openclaw:
    emoji: "💡"
    requires:
      bins: ["openhue"]
    install:
      - id: brew
        kind: brew
        formula: "openhue/cli/openhue-cli"
        bins: ["openhue"]
        label: "安裝 OpenHue CLI (brew)"
---

# Hue 燈光控制

使用 `openhue` 控制 Philips Hue 燈光與場景。

---

## 觸發關鍵字

| 關鍵字 | 動作     |
| ------ | -------- |
| 開燈   | 開啟燈光 |
| 關燈   | 關閉燈光 |
| 調光   | 調整亮度 |
| 場景   | 設定場景 |

---

## 使用時機

### ✅ 適用

- 開關燈光
- 調暗客廳燈光
- 設定場景或電影模式
- 控制特定房間或區域
- 調整亮度、顏色、色溫

### ❌ 不適用

- 非 Hue 智慧裝置
- HomeKit 場景
- TV 或娛樂系統控制

---

## 常用指令

### 列表資源

```bash
openhue get light       # 列表所有燈
openhue get room        # 列表所有房間
openhue get scene       # 列表所有場景
```

### 控制燈光

```bash
# 開/關
openhue set light "Bedroom Lamp" --on
openhue set light "Bedroom Lamp" --off

# 亮度 (0-100)
openhue set light "Bedroom Lamp" --on --brightness 50

# 色溫 (153-500 mirek)
openhue set light "Bedroom Lamp" --on --temperature 300

# 顏色
openhue set light "Bedroom Lamp" --on --color red
openhue set light "Bedroom Lamp" --on --rgb "#FF5500"
```

### 控制房間

```bash
# 關閉整個房間
openhue set room "Bedroom" --off

# 設定房間亮度
openhue set room "Bedroom" --on --brightness 30
```

### 場景

```bash
# 啟動場景
openhue set scene "Relax" --room "Bedroom"
openhue set scene "Concentrate" --room "Office"
```

---

## 快速預設

```bash
# 睡前（昏暗暖色）
openhue set room "Bedroom" --on --brightness 20 --temperature 450

# 工作模式（明亮冷色）
openhue set room "Office" --on --brightness 100 --temperature 250

# 電影模式（昏暗）
openhue set room "Living Room" --on --brightness 10
```

---

## 注意事項

- 橋接器需在本地網路
- 首次配對需按橋接器上的按鈕
- 顏色僅適用彩色燈泡
