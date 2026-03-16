import { KnowledgeBase } from "./knowledge"
import { SearchEngine } from "./search"
import { ProblemSolver } from "./problem-solver"
import { AIMemory } from "./memory"
import { SelfMonitor } from "./monitor"
import { SecurityShield } from "./security"
import { ModelManager } from "./model"

async function main() {
  console.log("=== 計散機架構測試 ===")

  try {
    console.log("📦 初始化模組...")

    const knowledge = new KnowledgeBase()
    const search = new SearchEngine()
    const problemSolver = new ProblemSolver()
    const memory = new AIMemory()
    const monitor = new SelfMonitor()
    const security = new SecurityShield()
    const modelManager = new ModelManager()

    console.log("✅ 所有模組初始化完成")

    console.log("\n🔍 測試知識庫搜尋...")
    const kbResults = await knowledge.search("typescript error")
    console.log(`找到 ${kbResults.length} 個知識項目`)

    console.log("\n🔍 測試搜尋引擎...")
    const searchResults = await search.searchCode("createSignal")
    console.log(`找到 ${searchResults.length} 個程式碼片段`)

    console.log("\n🔧 測試問題解決器...")
    const analysis = await problemSolver.analyzeError("TS7006: Parameter 'x' implicitly has any type")
    console.log(`錯誤分析: ${analysis.errorCode} - ${analysis.pattern?.name}`)

    console.log("\n🛡️ 測試安全檢查...")
    const securityResult = await security.securityCheck("my password is secret")
    console.log(`安全檢查: ${securityResult.safe ? "通過" : "發現問題"}`)

    console.log("\n📊 測試健康檢查...")
    const kbHealth = await knowledge.healthCheck()
    console.log(`知識庫狀態: ${kbHealth.status}`)

    const searchHealth = await search.healthCheck()
    console.log(`搜尋引擎狀態: ${searchHealth.status}`)

    console.log("\n🖼️ 測試視覺模型...")
    const visionModels = await modelManager.getVisionModels()
    console.log(`可用視覺模型: ${visionModels.map((m) => m.name).join(", ")}`)

    const modelHealth = await modelManager.healthCheck()
    console.log(`模型狀態: ${modelHealth.status}`)

    console.log("\n✅ 所有測試通過!")
  } catch (error) {
    console.error("❌ 測試失敗:", error)
  }
}

main().catch(console.error)
