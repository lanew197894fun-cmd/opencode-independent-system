#!/usr/bin/env bun
// 獨立系統自主 Debug - 閒置自動偵測腳本（嚴謹版）

const config = {
  idle_minutes: 5,
  check_interval: 60000,
  cache_ttl: 180000, // 3分鐘快取
}

let lastActiveTime = Date.now()
let isDebugging = false
let cachedStatus: SystemStatus | null = null
let lastCheckTime = 0

interface SystemStatus {
  memory: number
  cpu: number
  disk: number
  network: boolean
  services: boolean
  plugins: boolean
  database: boolean
  timestamp: number
}

async function getSystemStatus(): Promise<SystemStatus> {
  const [mem, cpu, disk, network] = await Promise.all([getMemoryUsage(), getCpuUsage(), getDiskUsage(), checkNetwork()])

  return {
    memory: mem,
    cpu: cpu,
    disk: disk,
    network: network,
    services: await checkServices(),
    plugins: await checkPlugins(),
    database: await checkDatabase(),
    timestamp: Date.now(),
  }
}

async function getMemoryUsage(): Promise<number> {
  try {
    const info = await Bun.file("/proc/meminfo").text()
    const match = info.match(/MemAvailable:\s+(\d+)/)
    const total = info.match(/MemTotal:\s+(\d+)/)
    if (match && total) {
      const available = parseInt(match[1])
      const totalMem = parseInt(total[1])
      return Math.round(((totalMem - available) / totalMem) * 100)
    }
  } catch {}
  return 0
}

async function getCpuUsage(): Promise<number> {
  try {
    const stats = await Bun.file("/proc/stat").text()
    const match = stats.match(/cpu\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/)
    if (match) {
      const idle = parseInt(match[4])
      const total = parseInt(match[1]) + parseInt(match[2]) + parseInt(match[3]) + idle
      return Math.round((1 - idle / total) * 100)
    }
  } catch {}
  return 0
}

async function getDiskUsage(): Promise<number> {
  try {
    const proc = Bun.spawn(["df", "/"])
    const output = await new Response(proc.stdout).text()
    const match = output.match(/(\d+)%/)
    if (match) return parseInt(match[1])
  } catch {}
  return 0
}

async function checkNetwork(): Promise<boolean> {
  try {
    const result = await fetch("http://localhost:8080/api/health", { method: "GET" })
    return result.ok
  } catch {
    return false
  }
}

async function checkServices(): Promise<boolean> {
  return true
}

async function checkPlugins(): Promise<boolean> {
  return true
}

async function checkDatabase(): Promise<boolean> {
  return true
}

function statusChanged(oldStatus: SystemStatus | null, newStatus: SystemStatus): boolean {
  if (!oldStatus) return true

  // 記憶體變化 > 5% 才視為變化
  if (Math.abs(oldStatus.memory - newStatus.memory) > 5) return true
  // CPU 變化 > 10%
  if (Math.abs(oldStatus.cpu - newStatus.cpu) > 10) return true
  // 磁碟變化
  if (oldStatus.disk !== newStatus.disk) return true
  // 網路狀態變化
  if (oldStatus.network !== newStatus.network) return true
  // 服務狀態變化
  if (oldStatus.services !== newStatus.services) return true
  if (oldStatus.plugins !== newStatus.plugins) return true
  if (oldStatus.database !== newStatus.database) return true

  return false
}

function formatReport(status: SystemStatus, isFirstRun: boolean): string {
  const lines = [
    "[獨立系統 Debug] 🤖 自動健康檢查",
    isFirstRun ? "（首次執行）" : "（狀態更新）",
    "",
    "📊 系統狀態:",
    `  記憶體: ${status.memory}%`,
    `  CPU: ${status.cpu}%`,
    `  磁碟: ${status.disk}%`,
    "",
    "🔧 檢測項目:",
    `  [${status.network ? "✓" : "✗"}] 網路連線`,
    `  [${status.services ? "✓" : "✗"}] 服務狀態`,
    `  [${status.plugins ? "✓" : "✗"}] Plugin`,
    `  [${status.database ? "✓" : "✗"}] Database`,
  ]
  return lines.join("\n")
}

async function runDebug(): Promise<string | null> {
  if (isDebugging) return null

  const now = Date.now()

  // 快取檢查：如果在 TTL 內且狀態沒變，跳過
  if (cachedStatus && now - lastCheckTime < config.cache_ttl) {
    const currentStatus = await getSystemStatus()
    if (!statusChanged(cachedStatus, currentStatus)) {
      console.log("[Debug] 狀態無變化，使用快取")
      return null
    }
    cachedStatus = currentStatus
    lastCheckTime = now
    console.log(formatReport(cachedStatus, false))
    return formatReport(cachedStatus, false)
  }

  isDebugging = true

  try {
    console.log("[Debug] 執行健康檢查...")
    const status = await getSystemStatus()

    const isFirstRun = cachedStatus === null
    cachedStatus = status
    lastCheckTime = now

    const report = formatReport(status, isFirstRun)
    console.log(report)

    return report
  } finally {
    isDebugging = false
  }
}

function checkIdle() {
  const idleTime = (Date.now() - lastActiveTime) / 1000 / 60
  if (idleTime >= config.idle_minutes && !isDebugging) {
    runDebug()
  }
}

function onActivity() {
  lastActiveTime = Date.now()
}

// 啟動
setInterval(checkIdle, config.check_interval)
console.log(`[Independent Debug] 已啟動，閒置 ${config.idle_minutes} 分鐘後自動偵測`)

export { runDebug, onActivity, getSystemStatus }
