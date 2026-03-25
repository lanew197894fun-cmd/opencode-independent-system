#!/usr/bin/env bun
// TODO 顯示模組 - 任務追蹤與進度顯示

const TASK_DIR = "/home/reamaster/opencode-manager/opencode independent system/.opencode/tasks"
const CURRENT = `${TASK_DIR}/current.json`
const HISTORY = `${TASK_DIR}/history.json`

interface TaskStep {
  name: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  detail?: string
}

interface Task {
  id: string
  userQuery: string
  status: "pending" | "in_progress" | "completed"
  startTime: number
  steps: TaskStep[]
}

const DEFAULT_STEPS = [
  { name: "接收問題", status: "pending" as const },
  { name: "分析問題", status: "pending" as const },
  { name: "判斷搜索", status: "pending" as const },
  { name: "執行搜索", status: "pending" as const },
  { name: "生成回覆", status: "pending" as const },
  { name: "驗證品質", status: "pending" as const },
]

const EMOJI = {
  pending: "⏳",
  in_progress: "🔄",
  completed: "✅",
  skipped: "⏭️",
}

let currentTask: Task | null = null

function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getCurrentStepIndex(task: Task): number {
  return task.steps.findIndex((s) => s.status === "in_progress")
}

function formatProgress(task: Task): string {
  const currentIndex = getCurrentStepIndex(task)
  const totalSteps = task.steps.length
  const completedCount = task.steps.filter((s) => s.status === "completed").length

  const lines = [
    "## 📋 處理進度",
    "",
    `### 🔍 問題: ${task.userQuery}`,
    "",
    `**進度**: [ ${currentIndex + 1}/${totalSteps} ] ${task.status === "completed" ? "完成" : "處理中"}`,
    "",
    "| 步驟 | 狀態 |",
    "|------|------|",
  ]

  for (let i = 0; i < task.steps.length; i++) {
    const step = task.steps[i]
    const emoji = EMOJI[step.status]
    lines.push(`| ${i + 1}. ${step.name} | ${emoji} ${step.status === "in_progress" ? "進行中" : step.status} |`)
  }

  const currentStep = task.steps[currentIndex]
  if (currentStep && currentStep.status === "in_progress") {
    lines.push("", `⚡ 正在執行: ${currentStep.name}`)
    if (currentStep.detail) {
      lines.push(`📝 ${currentStep.detail}`)
    }
  }

  return lines.join("\n")
}

async function createTask(userQuery: string): Promise<Task> {
  const task: Task = {
    id: generateId(),
    userQuery,
    status: "in_progress",
    startTime: Date.now(),
    steps: DEFAULT_STEPS.map((s) => ({ ...s })),
  }

  // 自動開始第一步
  task.steps[0].status = "completed"
  task.steps[1].status = "in_progress"

  currentTask = task
  await Bun.write(CURRENT, JSON.stringify(task, null, 2))

  return task
}

async function advanceStep(detail?: string): Promise<Task | null> {
  if (!currentTask) return null

  const currentIndex = getCurrentStepIndex(currentTask)

  // 完成當前步驟
  currentTask.steps[currentIndex].status = "completed"
  if (detail) {
    currentTask.steps[currentIndex].detail = detail
  }

  // 開始下一個步驟
  const nextIndex = currentIndex + 1
  if (nextIndex < currentTask.steps.length) {
    currentTask.steps[nextIndex].status = "in_progress"
  } else {
    currentTask.status = "completed"
  }

  await Bun.write(CURRENT, JSON.stringify(currentTask, null, 2))
  return currentTask
}

async function skipStep(reason?: string): Promise<Task | null> {
  if (!currentTask) return null

  const currentIndex = getCurrentStepIndex(currentTask)

  // 跳過當前步驟
  currentTask.steps[currentIndex].status = "skipped"
  if (reason) {
    currentTask.steps[currentIndex].detail = reason
  }

  // 開始下一個步驟
  const nextIndex = currentIndex + 1
  if (nextIndex < currentTask.steps.length) {
    currentTask.steps[nextIndex].status = "in_progress"
  } else {
    currentTask.status = "completed"
  }

  await Bun.write(CURRENT, JSON.stringify(currentTask, null, 2))
  return currentTask
}

async function getCurrentTask(): Promise<Task | null> {
  try {
    const content = await Bun.file(CURRENT).text()
    currentTask = JSON.parse(content)
    return currentTask
  } catch {
    return null
  }
}

async function getProgress(): Promise<string> {
  const task = await getCurrentTask()
  if (!task) {
    return "## 📋 無進行中的任務"
  }
  return formatProgress(task)
}

async function resetTask(): Promise<void> {
  currentTask = null
  try {
    await Bun.spawn(["rm", "-f", CURRENT])
  } catch {}
  console.log("[TODO] 任務已重置")
}

// 便捷函數：處理用戶問題
async function startProcessing(userQuery: string): Promise<string> {
  await createTask(userQuery)
  const task = await getCurrentTask()
  return formatProgress(task!)
}

export { createTask, advanceStep, skipStep, getCurrentTask, getProgress, resetTask, startProcessing }
