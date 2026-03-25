import os from "os"
import { Log } from "../util/log"

const log = Log.create({ service: "resource-monitor" })

export interface ResourceStatus {
  freeMemoryMB: number
  totalMemoryMB: number
  cpuUsage: number
  loadAverage: number[]
  canLoadMore: boolean
  reason?: string
}

export interface ResourceThresholds {
  lowMemoryMB: number
  minFreeSlots: number
  maxLoadAverage: number
}

const DEFAULT_THRESHOLDS: ResourceThresholds = {
  lowMemoryMB: 500,
  minFreeSlots: 5,
  maxLoadAverage: 8,
}

let lastCheck = 0
let cachedStatus: ResourceStatus | null = null
const CACHE_TTL_MS = 5000

export async function getResourceStatus(thresholds: ResourceThresholds = DEFAULT_THRESHOLDS): Promise<ResourceStatus> {
  const now = Date.now()
  if (cachedStatus && now - lastCheck < CACHE_TTL_MS) {
    return cachedStatus
  }

  const totalMemoryMB = os.totalmem() / 1024 / 1024
  const freeMemoryMB = os.freemem() / 1024 / 1024
  const loadAverage = os.loadavg()
  const cpuUsage = await getCpuUsage()

  let canLoadMore = true
  let reason: string | undefined

  if (freeMemoryMB < thresholds.lowMemoryMB) {
    canLoadMore = false
    reason = `low memory: ${freeMemoryMB.toFixed(0)}MB < ${thresholds.lowMemoryMB}MB`
  } else if (loadAverage[0] > thresholds.maxLoadAverage) {
    canLoadMore = false
    reason = `high load: ${loadAverage[0].toFixed(2)} > ${thresholds.maxLoadAverage}`
  }

  cachedStatus = {
    freeMemoryMB,
    totalMemoryMB,
    cpuUsage,
    loadAverage,
    canLoadMore,
    reason,
  }

  lastCheck = now

  if (!canLoadMore) {
    log.warn("resource limit reached", { reason, freeMemoryMB: freeMemoryMB.toFixed(0) })
  }

  return cachedStatus
}

async function getCpuUsage(): Promise<number> {
  try {
    const file = await Bun.file("/proc/stat").text()
    const lines = file.split("\n")
    const cpuLine = lines.find((l) => l.startsWith("cpu "))
    if (!cpuLine) return 0

    const parts = cpuLine.split(/\s+/)
    const user = parseInt(parts[1] || "0")
    const nice = parseInt(parts[2] || "0")
    const system = parseInt(parts[3] || "0")
    const idle = parseInt(parts[4] || "0")
    const iowait = parseInt(parts[5] || "0")
    const irq = parseInt(parts[6] || "0")
    const softirq = parseInt(parts[7] || "0")

    const total = user + nice + system + idle + iowait + irq + softirq
    const active = total - idle - iowait

    return (active / total) * 100
  } catch {
    return 0
  }
}

export function getLoadClass(status: ResourceStatus): "low" | "medium" | "high" {
  if (status.freeMemoryMB > 2000 && status.loadAverage[0] < 2) return "low"
  if (status.freeMemoryMB > 500 && status.loadAverage[0] < 8) return "medium"
  return "high"
}

export async function suggestModules(status: ResourceStatus): Promise<string[]> {
  const loadClass = getLoadClass(status)
  const suggestions: string[] = []

  switch (loadClass) {
    case "low":
      suggestions.push("ai-debug", "memory-pro", "user-rules")
      break
    case "medium":
      suggestions.push("user-rules")
      if (status.freeMemoryMB > 1000) {
        suggestions.push("ai-debug")
      }
      break
    case "high":
      suggestions.push("user-rules")
      break
  }

  return suggestions
}
