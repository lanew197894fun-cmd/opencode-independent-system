#!/usr/bin/env bun

import { IndependentArchitectureSystem } from "./independent-architecture-system"

async function main() {
  console.clear()
  console.log("╔═══════════════════════════════════════════════════════════╗")
  console.log("║           獨立架構 (Independent Architecture) v1.0.0         ║")
  console.log("║              完全獨立 AI 系統 - 啟動中...                  ║")
  console.log("╚═══════════════════════════════════════════════════════════╝")
  console.log()

  try {
    console.log("📦 初始化系統模組...")
    const ia = new IndependentArchitectureSystem()
    console.log("✅ 系統初始化完成\n")

    console.log("🚀 執行系統健康檢查...\n")
    const health = await ia.healthCheck()

    console.log("═".repeat(60))
    console.log("📊 健康檢查結果")
    console.log("═".repeat(60))

    health.details.forEach((d) => {
      const statusIcon = d.status === "healthy" ? "✅" : d.status === "warning" ? "⚠️" : "❌"
      console.log(`${statusIcon} ${d.module}: ${d.message}`)
    })

    console.log("─".repeat(60))
    console.log(`📈 整體健康分數: ${(health.overallScore * 100).toFixed(1)}%`)
    console.log("═".repeat(60))
    console.log()

    console.log("💡 可用指令:")
    console.log("   - 直接輸入文字進行處理")
    console.log("   - :health   - 執行健康檢查")
    console.log("   - :offline - 切換離線模式")
    console.log("   - :online  - 切換線上模式")
    console.log("   - :knowledge <關鍵字> - 搜尋知識庫")
    console.log("   - :exit    - 結束程式")
    console.log()

    const readline = await import("readline")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const prompt = () => {
      rl.question("\n🤖 請輸入訊息: ", async (input) => {
        const cmd = input.trim().toLowerCase()

        if (cmd === ":exit" || cmd === "exit" || cmd === "q") {
          console.log("\n🛑 正在關閉系統...")
          await ia.shutdown()
          console.log("✅ 系統已關閉")
          rl.close()
          process.exit(0)
        } else if (cmd === ":health") {
          console.log("\n🚀 執行健康檢查...")
          const h = await ia.healthCheck()
          console.log(`📈 整體健康分數: ${(h.overallScore * 100).toFixed(1)}%`)
          h.details.forEach((d) => {
            const icon = d.status === "healthy" ? "✅" : "⚠️"
            console.log(`${icon} ${d.module}: ${d.message}`)
          })
          prompt()
        } else if (cmd === ":offline") {
          ia.setOfflineMode(true)
          console.log("✅ 已切換至離線模式")
          prompt()
        } else if (cmd === ":online") {
          ia.setOfflineMode(false)
          console.log("✅ 已切換至線上模式")
          prompt()
        } else if (cmd.startsWith(":knowledge ")) {
          const keyword = input.slice(11).trim()
          const kb = ia.getKnowledgeBase()
          const results = await kb.search(keyword)
          console.log(`\n📚 找到 ${results.length} 個相關知識項目:\n`)
          results.slice(0, 5).forEach((r, i) => {
            console.log(`${i + 1}. ${r.title}`)
            console.log(`   ${r.content.substring(0, 100)}...\n`)
          })
          prompt()
        } else if (input.trim()) {
          console.log("\n⏳ 處理中...")
          const result = await ia.process(input)

          console.log("\n" + "═".repeat(60))
          console.log("📤 處理結果")
          console.log("═".repeat(60))
          console.log(result.output)
          console.log("─".repeat(60))
          console.log(`⏱️  處理時間: ${result.timeTaken}ms`)
          console.log(`📊 信心度: ${(result.confidence * 100).toFixed(1)}%`)
          console.log(`🔧 使用工具: ${result.toolsUsed.join(", ") || "無"}`)
          console.log("═".repeat(60))
          prompt()
        } else {
          prompt()
        }
      })
    }

    prompt()
  } catch (error) {
    console.error("❌ 系統啟動失敗:", error)
    process.exit(1)
  }
}

main().catch(console.error)
