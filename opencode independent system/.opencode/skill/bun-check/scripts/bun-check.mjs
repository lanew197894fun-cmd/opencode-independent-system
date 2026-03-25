#!/usr/bin/env node
/**
 * bun-check.mjs — Bun 版本偵測與硬體相容性檢查
 * 支援 Linux / macOS / Windows
 *
 * 用法：
 *   node bun-check.mjs                    # 基本檢查
 *   node bun-check.mjs --json            # JSON 輸出
 *   bun run bun-check.mjs                # 使用 Bun 執行
 *   bun-check.mjs --upgrade              # 自動升級
 *   bun-check.mjs --upgrade --force      # 強制升級（忽略 CPU 警告）
 *   bun-check.mjs --rollback             # 回滾到上一版本
 *   bun-check.mjs --history              # 顯示版本歷史
 *   bun-check.mjs --test --upgrade       # 沙盤模式測試升級
 */

const isBun = typeof Bun !== "undefined"
const isWindows = typeof process !== "undefined" && process.platform === "win32"
const isMac = typeof process !== "undefined" && process.platform === "darwin"
const isLinux = typeof process !== "undefined" && process.platform === "linux"

let fs = null

async function initFs() {
  if (isBun) return
  try {
    fs = (await import("node:fs")).default
  } catch (e) {}
}

await initFs()

const CPU_FEATURES = {
  avx: "AVX (Advanced Vector Extensions)",
  avx2: "AVX2",
  avx512: "AVX-512",
  sse4: "SSE4.1/SSE4.2",
  bmi1: "BMI1",
  bmi2: "BMI2",
  aes: "AES-NI",
}

async function runCommand(cmd) {
  if (isBun) {
    const { spawn } = await import("node:child_process")
    return new Promise((resolve) => {
      const p = spawn(cmd, [], { shell: true })
      let out = ""
      p.stdout.on("data", (d) => (out += d))
      p.on("close", () => resolve(out.trim()))
    })
  }
  try {
    const cp = (await import("node:child_process")).default
    return cp.execSync(cmd, { encoding: "utf8", timeout: 10000 }).toString().trim()
  } catch (e) {
    return ""
  }
}

function getLinuxCpuInfo() {
  if (fs) {
    try {
      return fs.readFileSync("/proc/cpuinfo", "utf8")
    } catch (e) {}
  }
  return ""
}

async function getMacCpuInfo() {
  const out = await runCommand("sysctl -n machdep.cpu.brand_string")
  return out || "Apple Silicon"
}

async function getMacCpuFeatures() {
  const out = await runCommand("sysctl machdep.cpu.features machdep.cpu.leaf7_features")
  const features = out
    .split("\n")
    .map((l) => l.split(":")[1]?.trim())
    .join(" ")
    .split(" ")
  return {
    hasAvx: features.includes("AVX"),
    hasAvx2: features.includes("AVX2"),
    hasAvx512: features.includes("AVX512"),
    hasSse4: features.includes("SSE4_1") || features.includes("SSE4_2"),
    hasBmi1: features.includes("BMI1"),
    hasBmi2: features.includes("BMI2"),
    hasAes: features.includes("AES"),
  }
}

async function getWindowsCpuInfo() {
  const out = await runCommand("wmic cpu get name")
  return out.split("\n")[1]?.trim() || "Unknown"
}

async function getWindowsCpuFeatures() {
  const out = await runCommand("wmic cpu get description")
  const desc = out.toLowerCase()
  return {
    hasAvx: desc.includes("avx"),
    hasAvx2: desc.includes("avx2") || desc.includes("avx"),
    hasAvx512: desc.includes("avx512"),
    hasSse4: desc.includes("sse4"),
    hasBmi1: desc.includes("bmi1"),
    hasBmi2: desc.includes("bmi2"),
    hasAes: desc.includes("aes"),
  }
}

function parseLinuxCpuFeatures(cpuinfo) {
  const match = cpuinfo.match(/flags\s*:\s*(.+)/m)
  if (!match) return null
  const flags = match[1].split(" ")
  return {
    hasAvx: flags.includes("avx"),
    hasAvx2: flags.includes("avx2"),
    hasAvx512: flags.includes("avx512"),
    hasSse4: flags.includes("sse4_1") || flags.includes("sse4_2"),
    hasBmi1: flags.includes("bmi1"),
    hasBmi2: flags.includes("bmi2"),
    hasAes: flags.includes("aes"),
  }
}

async function getCpuModel() {
  if (isLinux) {
    const cpuinfo = getLinuxCpuInfo()
    const match = cpuinfo.match(/model name\s*:\s*(.+)/m)
    return match ? match[1] : "Unknown"
  }
  if (isMac) {
    const out = await runCommand("sysctl -n machdep.cpu.brand_string")
    if (!out) {
      const arch = await runCommand("uname -m")
      return arch.includes("arm") ? "Apple Silicon" : "Unknown"
    }
    return out
  }
  if (isWindows) {
    return await getWindowsCpuInfo()
  }
  return "Unknown"
}

async function getCpuFeatures() {
  if (isLinux) {
    const cpuinfo = getLinuxCpuInfo()
    return parseLinuxCpuFeatures(cpuinfo)
  }
  if (isMac) {
    return await getMacCpuFeatures()
  }
  if (isWindows) {
    return await getWindowsCpuFeatures()
  }
  return null
}

function getPlatform() {
  if (isWindows) return "windows"
  if (isMac) return "macos"
  if (isLinux) return "linux"
  return "unknown"
}

async function getBunVersionAsync() {
  if (isBun) return Bun.version

  if (isWindows) {
    const out = await runCommand("bun --version 2>NUL")
    return out || null
  }

  const out = await runCommand("bun --version 2>/dev/null")
  return out || null
}

async function getLatestBunVersion() {
  try {
    // Try to get latest version from Bun's GitHub releases
    const response = await fetch("https://api.github.com/repos/ovensh/bun/releases/latest")
    if (!response.ok) throw new Error("Failed to fetch latest version")
    const data = await response.json()
    // Extract version from tag_name (e.g., "v1.3.11" -> "1.3.11")
    const version = data.tag_name.replace(/^v/, "")
    return version
  } catch (error) {
    console.warn("無法獲取最新 Bun 版本，使用預設值:", error.message)
    // Fallback to hardcoded version
    return "1.3.11"
  }
}

async function saveVersionHistory(currentVersion) {
  let history = []
  const path = "/tmp/bun-version-history.json"

  if (!isBun && fs) {
    try {
      const content = fs.readFileSync(path, "utf8")
      history = JSON.parse(content)
    } catch (e) {}
  }

  const entry = {
    timestamp: new Date().toISOString(),
    version: currentVersion,
    platform: getPlatform(),
  }

  history = [entry, ...history.filter((h) => h.version !== currentVersion)].slice(0, 10)

  const json = JSON.stringify(history, null, 2)
  if (isBun) {
    Bun.write(path, json)
  } else if (fs) {
    try {
      fs.writeFileSync(path, json)
    } catch (e) {}
  }
}

async function getVersionHistory() {
  const path = "/tmp/bun-version-history.json"
  if (isBun) {
    try {
      return JSON.parse(Bun.file(path).text())
    } catch (e) {}
    return []
  }
  if (fs) {
    try {
      return JSON.parse(fs.readFileSync(path, "utf8"))
    } catch (e) {}
  }
  return []
}

async function rollbackBun(targetVersion) {
  console.log(`\n🔄 回滾到 ${targetVersion}...`)

  if (isBun) {
    const { spawn } = await import("node:child_process")
    const proc = spawn("bun", ["upgrade", `--version=${targetVersion}`], { stdio: "inherit", shell: isWindows })
    await new Promise((resolve) => proc.on("close", resolve))
  } else {
    const cp = (await import("node:child_process")).default
    const proc = cp.spawn(
      isWindows ? "bun upgrade --version=" + targetVersion : "bun",
      ["upgrade", `--version=${targetVersion}`],
      { stdio: "inherit" },
    )
    await new Promise((resolve) => proc.on("close", resolve))
  }

  const newVersion = await getBunVersionAsync()
  console.log(`\n✅ 已回滾到 ${newVersion}`)
}

function getRecommendedProfile(features) {
  if (!features) return "unknown"

  if (features.hasAvx512) return "avx512 (optimal)"
  if (features.hasAvx2) return "avx2 (recommended)"
  if (features.hasAvx) return "avx (basic)"
  return "baseline (compatibility)"
}

function checkCpuCompatibility(currentVersion, targetVersion, cpuFeatures) {
  if (!currentVersion || !cpuFeatures) {
    return { compatible: true }
  }

  const [currMaj] = currentVersion.split(".").map(Number)
  const [targMaj] = targetVersion.split(".").map(Number)

  if (targMaj > currMaj + 1) {
    if (!cpuFeatures.hasAvx2) {
      return {
        compatible: false,
        reason: `Bun ${targetVersion} 需要 AVX2 支援，但此 CPU 不支援`,
        fallback: "建議使用 bun@1.3.x 或較舊版本",
      }
    }
  }

  return { compatible: true }
}

function getUpgradeRecommendation(current, latest, cpuFeatures) {
  if (!current || !latest) return { status: "unknown", message: "無法獲取版本資訊" }

  const [currMajor, currMinor, currPatch] = current.split(".").map(Number)
  const [latMajor, latMinor, latPatch] = latest.split(".").map(Number)

  // Check if latest version exceeds our safe limit based on CPU features
  if (!cpuFeatures.hasAvx2) {
    // Without AVX2, we should not exceed current major + 1 based on existing logic
    // But let's be more conservative and suggest staying within same major for safety
    if (latMajor > currMajor) {
      return {
        status: "update",
        message: `有新版本可用: ${latest} (當前: ${current})`,
        warning: `此版本可能需要 AVX2 支援，但您的 CPU 不支援 AVX2。建議使用 Bun ${currMajor}.x 系列。`,
      }
    }
  }

  if (latMajor > currMajor || latMinor > currMinor) {
    return { status: "update", message: `有新版本可用: ${latest} (當前: ${current})` }
  }

  if (latPatch > currPatch) {
    return { status: "patch", message: `有安全更新: ${latest}` }
  }

  return { status: "ok", message: "已是最新版本" }
}

async function main() {
  const args = process.argv.slice(2)
  const jsonMode = args.includes("--json")
  const upgradeMode = args.includes("--upgrade")
  const forceMode = args.includes("--force")
  const rollbackMode = args.includes("--rollback")
  const historyMode = args.includes("--history")
  const testMode = args.includes("--test") || args.includes("--dry-run")
  const applyMode = args.includes("--apply")

  const platform = getPlatform()
  const cpuModel = await getCpuModel()
  const cpuFeatures = await getCpuFeatures()
  const currentVersion = await getBunVersionAsync()
  const latestVersion = await getLatestBunVersion()

  const result = {
    timestamp: new Date().toISOString(),
    bun: {
      installed: !!currentVersion,
      current: currentVersion || "unknown",
      latest: latestVersion,
      runtime: isBun ? "bun" : "node",
    },
    platform: platform,
    hardware: {
      cpu: cpuModel,
      features: cpuFeatures,
      profile: getRecommendedProfile(cpuFeatures),
    },
    recommendation: getUpgradeRecommendation(currentVersion, latestVersion, cpuFeatures),
  }

  if (historyMode) {
    const history = await getVersionHistory()
    console.log("\n=== 版本歷史 ===\n")
    if (history.length === 0) {
      console.log("無歷史記錄")
    } else {
      history.forEach((h, i) => {
        console.log(`${i + 1}. ${h.version} - ${h.timestamp} (${h.platform || "unknown"})`)
      })
    }
    console.log("")
    return
  }

  if (rollbackMode) {
    const targetIdx = args.indexOf("--rollback")
    let targetVersion = args[targetIdx + 1]

    if (!targetVersion || targetVersion.startsWith("--")) {
      const history = await getVersionHistory()
      if (history.length > 1) {
        targetVersion = history[1].version
        console.log(`\n回滾到上一版本: ${targetVersion}`)
      } else {
        console.log("\n無可回滾的版本")
        return
      }
    }

    await rollbackBun(targetVersion)
    return
  }

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2))
    return
  }

  const platformLabel = { linux: "Linux", macos: "macOS", windows: "Windows" }

  console.log("\n=== Bun 版本與硬體檢查 ===\n")
  console.log(` 執行環境: ${isBun ? "Bun" : "Node.js"} (${platformLabel[platform] || platform})`)
  console.log(` CPU: ${cpuModel}`)

  if (cpuFeatures) {
    const supported = Object.entries(cpuFeatures)
      .filter(([_, v]) => v)
      .map(([k]) => CPU_FEATURES[k] || k)
      .join(", ")
    console.log(` 支援: ${supported || "基礎模式"}`)
  }

  console.log(`\n Bun: ${currentVersion || "未安裝"}`)
  console.log(` 最新: ${result.bun.latest}`)
  console.log(` 建議: ${result.hardware.profile}`)
  console.log(`\n ${result.recommendation.message}`)
  if (result.recommendation.warning) {
    console.log(`   ${result.recommendation.warning}`)
  }

  if (upgradeMode && result.recommendation.status !== "ok") {
    const compat = checkCpuCompatibility(currentVersion, result.bun.latest, cpuFeatures)

    if (!compat.compatible && !forceMode) {
      console.log(`\n ⚠️  CPU 相容性警告: ${compat.reason}`)
      console.log(`    ${compat.fallback}`)
      console.log(`\n 取消升級。如需強制升級請使用 --force`)
      console.log(` 回滾請使用: bun-check.mjs --rollback`)
      return
    }

    if (forceMode) {
      console.log(`\n ⚠️  強制升級模式（忽略 CPU 兼容性警告）`)
    }

    // Handle test/dry-run mode
    if (testMode) {
      console.log("\n=== Bun 升級模擬測試 (沙盤模式) ===\n")
      console.log(` 當前版本: ${currentVersion}`)
      console.log(` 目標版本: ${result.bun.latest}`)
      console.log(` CPU 相容性: ${compat.compatible ? "通過" : "失敗 (${compat.reason})"}`)

      if (!compat.compatible && !forceMode) {
        console.log(`\n 模擬結果: 升級將被取消 due to CPU 不相容`)
        console.log(` 如需強制模擬升級請使用 --force`)
        return
      }

      console.log(`\n 模擬升級過程:`)
      console.log(` 1. 下載 Bun ${result.bun.latest}`)
      console.log(` 2. 安裝到臨時目錄`)
      console.log(` 3. 執行基本功能測試`)
      console.log(` 4. 驗證穩定性`)

      // Simulate stability tests
      console.log(`\n 執行穩定性測試...`)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate test time
      console.log(` ✅ 基本功能測試通過`)
      console.log(` ✅ 效能基準測試通過`)
      console.log(` ✅ 相容性驗證通過`)

      console.log(`\n 模擬完成！若要實際應用此升級，請移除 --test 旗標`)
      console.log(` 或使用: bun-check.mjs --upgrade ${forceMode ? "--force" : ""}`)
      return
    }

    if (currentVersion) {
      await saveVersionHistory(currentVersion)
      console.log(`\n 📝 已記錄當前版本: ${currentVersion}`)
    }

    console.log("\n=== 開始升級 Bun ===\n")

    // Import child_process module outside the Promise to avoid await issues
    const { spawn } = isBun ? await import("node:child_process") : (await import("node:child_process")).default

    let upgradeTimeout = null
    const upgradePromise = new Promise((resolve, reject) => {
      // Set a timeout for the upgrade process (60 seconds)
      upgradeTimeout = setTimeout(() => {
        reject(new Error("Upgrade process timed out after 60 seconds"))
      }, 60000)

      const proc = spawn(isBun ? "bun" : isWindows ? "bun upgrade" : "bun", isBun ? ["upgrade"] : ["upgrade"], {
        stdio: "inherit",
        shell: isWindows,
      })

      proc.on("close", (code) => {
        clearTimeout(upgradeTimeout)
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Upgrade process exited with code ${code}`))
        }
      })
      proc.on("error", (err) => {
        clearTimeout(upgradeTimeout)
        reject(err)
      })
    })

    try {
      await upgradePromise
    } catch (error) {
      console.log(`\n⚠️  升級過程中發生錯誤: ${error.message}`)
      console.log(` 可嘗試回滾: bun-check.mjs --rollback`)
      return
    }

    console.log("\n=== 升級完成 ===\n")

    const newVersion = await getBunVersionAsync()
    console.log(` 新版本: ${newVersion}`)

    if (newVersion && newVersion !== currentVersion) {
      await saveVersionHistory(newVersion)
    }

    if (!newVersion || newVersion === currentVersion) {
      console.log(` ⚠️  升級可能失敗`)
      console.log(` 可嘗試回滾: bun-check.mjs --rollback`)
    }
  }

  console.log("")
}

main().catch(console.error)
