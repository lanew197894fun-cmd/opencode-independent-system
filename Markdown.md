2eff924972ee4a3db81b5914799926a1.gF4-ZdWzNo4LsHmoRo4FF9m9


opencode-claw


#強行修正設定檔內容
 openclaw doctor --fix

#重新設定
openclaw configure 
rm ~/.openclaw/openclaw.json

# 重新生成，這次不透過 ollama 腳本，改用標準初始化
openclaw configure
openclaw tui --token 2eff924972ee4a3db81b5914799926a1.gF4-ZdWzNo4LsHmoRo4FF9m9


# 確保沒有舊進程
pkill -f openclaw

# 啟動後端並將日誌輸出到背景
nohup openclaw > /tmp/openclaw.log 2>&1 &

# 等待三秒後連線 TUI
sleep 3
openclaw tui --token 2eff924972ee4a3db81b5914799926a1.gF4-ZdWzNo4LsHmoRo4FF9m9


