# OpenCode 獨立執行檔生成

## 命令

```bash
cd /home/reamaster/opencode-manager/opencode\ independent\ system
./packages/opencode/script/build.ts --single
```

## 輸出位置

```
packages/opencode/dist/<platform>-<arch>/bin/opencode
```

例如：
- `dist/opencode-linux-x64/bin/opencode` (158MB)
- `dist/opencode-darwin-arm64/bin/opencode`
- `dist/opencode-windows-x64/bin/opencode`

## 測試結果

| 命令 | 結果 |
|------|------|
| `--version` | ✅ 0.0.0-linux-202603251305 |
| `--help` | ✅ 正常顯示 |
| `models` | ✅ 正常列出模型 |

## 注意事項

- Bun 版本不能太新，會有設備支援問題
- 執行檔約 158MB
- 完全獨立，不依賴系統 Node.js/Bun
