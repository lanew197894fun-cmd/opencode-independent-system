---
name: sherpa-onnx-tts
description: 本地文字轉語音 - 使用 sherpa-onnx（離線，無雲端）
metadata:
  openclaw:
    emoji: "🗣️"
    os: ["darwin", "linux", "win32"]
    requires:
      env: ["SHERPA_ONNX_RUNTIME_DIR", "SHERPA_ONNX_MODEL_DIR"]
    install:
      - id: download-runtime-macos
        kind: download
        os: ["darwin"]
        url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-osx-universal2-shared.tar.bz2"
        archive: "tar.bz2"
        extract: true
        stripComponents: 1
        targetDir: "runtime"
        label: "下載 sherpa-onnx runtime (macOS)"
      - id: download-runtime-linux-x64
        kind: "download"
        os: ["linux"]
        url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-linux-x64-shared.tar.bz2"
        archive: "tar.bz2"
        extract: true
        stripComponents: 1
        targetDir: "runtime"
        label: "下載 sherpa-onnx runtime (Linux x64)"
      - id: download-runtime-win-x64
        kind: "download"
        os: ["win32"]
        url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/v1.12.23/sherpa-onnx-v1.12.23-win-x64-shared.tar.bz2"
        archive: "tar.bz2"
        extract: true
        stripComponents: 1
        targetDir: "runtime"
        label: "下載 sherpa-onnx runtime (Windows x64)"
      - id: download-model-lessac
        kind: download
        url: "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-en_US-lessac-high.tar.bz2"
        archive: "tar.bz2"
        extract: true
        targetDir: "models"
        label: "下載 Piper en_US lessac (high)"
---

# 本地 TTS

使用 sherpa-onnx 離線 CLI 進行文字轉語音。

---

## 觸發關鍵字

| 關鍵字     | 動作         |
| ---------- | ------------ |
| 文字轉語音 | TTS 生成語音 |
| 本地語音   | 離線語音合成 |

---

## 安裝

1. 下載作業系統適用的 runtime（解壓到 `~/.openclaw/tools/sherpa-onnx-tts/runtime`）
2. 下載語音模型（解壓到 `~/.openclaw/tools/sherpa-onnx-tts/models`）

更新 `~/.openclaw/openclaw.json`：

```json5
{
  skills: {
    entries: {
      "sherpa-onnx-tts": {
        env: {
          SHERPA_ONNX_RUNTIME_DIR: "~/.openclaw/tools/sherpa-onnx-tts/runtime",
          SHERPA_ONNX_MODEL_DIR: "~/.openclaw/tools/sherpa-onnx-tts/models/vits-piper-en_US-lessac-high",
        },
      },
    },
  },
}
```

---

## 使用方式

```bash
{baseDir}/bin/sherpa-onnx-tts -o ./tts.wav "Hello from local TTS."
```

---

## 注意事項

- 可從 sherpa-onnx `tts-models` release 選擇不同語音模型
- 若模型資料夾有多個 `.onnx` 檔案，設定 `SHERPA_ONNX_MODEL_FILE` 或傳入 `--model-file`
- 可傳入 `--tokens-file` 或 `--data-dir` 覆蓋預設值
- Windows：`node {baseDir}\\bin\\sherpa-onnx-tts -o tts.wav "Hello"`
