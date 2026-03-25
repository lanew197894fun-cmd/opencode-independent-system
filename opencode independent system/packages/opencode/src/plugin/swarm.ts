import { tool, type ToolContext } from "@opencode-ai/plugin"
import { z } from "zod"

const SWARM_DIR = ".opencode/swarm"

interface Team {
  name: string
  description?: string
  leader: string
  created_at: number
  members: string[]
}

interface Task {
  id: string
  subject: string
  owner: string
  status: "pending" | "in_progress" | "completed" | "blocked"
  blocked_by: string[]
  created_at: number
}

interface Message {
  id: string
  from: string
  to: string
  content: string
  timestamp: number
  read: boolean
}

interface Inbox {
  messages: Record<string, Message[]>
}

function getSwarmDir(worktree: string): string {
  return `${worktree}/${SWARM_DIR}`
}

function getTeamsPath(worktree: string): string {
  return `${getSwarmDir(worktree)}/teams.json`
}

function getTasksPath(worktree: string, team: string): string {
  return `${getSwarmDir(worktree)}/tasks-${team}.json`
}

function getInboxPath(worktree: string, team: string): string {
  return `${getSwarmDir(worktree)}/inbox-${team}.json`
}

async function loadTeams(worktree: string): Promise<Record<string, Team>> {
  const path = getTeamsPath(worktree)
  if (!(await Bun.file(path).exists())) return {}
  return Bun.file(path).json()
}

async function saveTeams(worktree: string, teams: Record<string, Team>): Promise<void> {
  const dir = getSwarmDir(worktree)
  await Bun.$`mkdir -p ${dir}`
  await Bun.write(getTeamsPath(worktree), JSON.stringify(teams, null, 2))
}

async function loadTasks(worktree: string, team: string): Promise<Task[]> {
  const path = getTasksPath(worktree, team)
  if (!(await Bun.file(path).exists())) return []
  return Bun.file(path).json()
}

async function saveTasks(worktree: string, team: string, tasks: Task[]): Promise<void> {
  const dir = getSwarmDir(worktree)
  await Bun.$`mkdir -p ${dir}`
  await Bun.write(getTasksPath(worktree, team), JSON.stringify(tasks, null, 2))
}

async function loadInbox(worktree: string, team: string): Promise<Inbox> {
  const path = getInboxPath(worktree, team)
  if (!(await Bun.file(path).exists())) return { messages: {} }
  return Bun.file(path).json()
}

async function saveInbox(worktree: string, team: string, inbox: Inbox): Promise<void> {
  const dir = getSwarmDir(worktree)
  await Bun.$`mkdir -p ${dir}`
  await Bun.write(getInboxPath(worktree, team), JSON.stringify(inbox, null, 2))
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

const teamCreate = tool({
  description: "建立新的 Swarm 團隊",
  args: {
    name: z.string().describe("團隊名稱"),
    description: z.string().optional().describe("團隊描述"),
    leader: z.string().optional().describe("Leader 名稱 (預設: leader)"),
  },
  async execute({ name, description, leader }, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    if (teams[name]) return `團隊 ${name} 已存在`

    teams[name] = {
      name,
      description,
      leader: leader ?? "leader",
      created_at: Date.now(),
      members: [leader ?? "leader"],
    }

    await saveTeams(ctx.worktree, teams)
    return `團隊 ${name} 已建立 (leader: ${leader ?? "leader"})`
  },
})

const teamList = tool({
  description: "列表所有 Swarm 團隊",
  args: {},
  async execute({}, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    if (Object.keys(teams).length === 0) return "尚無團隊"

    const lines = ["## Teams"]
    for (const [name, team] of Object.entries(teams)) {
      lines.push(`- ${name}: ${team.description ?? "無描述"} (${team.members.length} members)`)
    }
    return lines.join("\n")
  },
})

const teamStatus = tool({
  description: "顯示團隊成員與狀態",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    const t = teams[team]
    if (!t) return `團隊 ${team} 不存在`

    const tasks = await loadTasks(ctx.worktree, team)
    const pending = tasks.filter((x) => x.status === "pending").length
    const inProgress = tasks.filter((x) => x.status === "in_progress").length
    const completed = tasks.filter((x) => x.status === "completed").length
    const blocked = tasks.filter((x) => x.status === "blocked").length

    return `## ${team}
- Leader: ${t.leader}
- Members: ${t.members.join(", ")}
- Tasks: ${pending} pending, ${inProgress} in_progress, ${completed} completed, ${blocked} blocked`
  },
})

const teamAddMember = tool({
  description: "新增團隊成員",
  args: {
    team: z.string().describe("團隊名稱"),
    member: z.string().describe("成員名稱"),
  },
  async execute({ team, member }, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    const t = teams[team]
    if (!t) return `團隊 ${team} 不存在`

    if (!t.members.includes(member)) {
      t.members.push(member)
      await saveTeams(ctx.worktree, teams)
    }
    return `成員 ${member} 已加入團隊 ${team}`
  },
})

const teamRemoveMember = tool({
  description: "移除團隊成員",
  args: {
    team: z.string().describe("團隊名稱"),
    member: z.string().describe("成員名稱"),
  },
  async execute({ team, member }, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    const t = teams[team]
    if (!t) return `團隊 ${team} 不存在`

    t.members = t.members.filter((m) => m !== member)
    await saveTeams(ctx.worktree, teams)
    return `成員 ${member} 已移除`
  },
})

const teamCleanup = tool({
  description: "刪除團隊及其所有資源",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const teams = await loadTeams(ctx.worktree)
    if (!teams[team]) return `團隊 ${team} 不存在`

    delete teams[team]
    await saveTeams(ctx.worktree, teams)

    const taskPath = getTasksPath(ctx.worktree, team)
    const inboxPath = getInboxPath(ctx.worktree, team)
    if (await Bun.file(taskPath).exists()) await Bun.$`rm ${taskPath}`
    if (await Bun.file(inboxPath).exists()) await Bun.$`rm ${inboxPath}`

    return `團隊 ${team} 已刪除`
  },
})

const taskCreate = tool({
  description: "建立任務 (支援依賴鏈)",
  args: {
    team: z.string().describe("團隊名稱"),
    subject: z.string().describe("任務描述"),
    owner: z.string().optional().describe("任務負責人"),
    blockedBy: z.array(z.string()).optional().describe("阻塞的任務 ID 陣列"),
  },
  async execute({ team, subject, owner, blockedBy }, ctx: ToolContext) {
    const tasks = await loadTasks(ctx.worktree, team)
    const id = generateId()

    const task: Task = {
      id,
      subject,
      owner: owner ?? "unassigned",
      status: blockedBy && blockedBy.length > 0 ? "blocked" : "pending",
      blocked_by: blockedBy ?? [],
      created_at: Date.now(),
    }

    tasks.push(task)
    await saveTasks(ctx.worktree, team, tasks)

    return `任務已建立: ${id} - ${subject}\n狀態: ${task.status}\n負責人: ${task.owner}`
  },
})

const taskUpdate = tool({
  description: "更新任務狀態 (自動解除依賴)",
  args: {
    team: z.string().describe("團隊名稱"),
    taskId: z.string().describe("任務 ID"),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]).describe("新狀態"),
  },
  async execute({ team, taskId, status }, ctx: ToolContext) {
    const tasks = await loadTasks(ctx.worktree, team)
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return `任務 ${taskId} 不存在`

    task.status = status
    await saveTasks(ctx.worktree, team, tasks)

    if (status === "completed") {
      const blocked = tasks.filter((t) => t.blocked_by.includes(taskId))
      for (const t of blocked) {
        const allResolved = t.blocked_by.every((id) => {
          const dep = tasks.find((x) => x.id === id)
          return dep?.status === "completed"
        })
        if (allResolved && t.status === "blocked") {
          t.status = "pending"
          await saveTasks(ctx.worktree, team, tasks)
        }
      }
    }

    return `任務 ${taskId} 狀態更新為 ${status}`
  },
})

const taskList = tool({
  description: "列表任務 (可篩選)",
  args: {
    team: z.string().describe("團隊名稱"),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().describe("篩選狀態"),
    owner: z.string().optional().describe("篩選負責人"),
  },
  async execute({ team, status, owner }, ctx: ToolContext) {
    let tasks = await loadTasks(ctx.worktree, team)

    if (status) tasks = tasks.filter((t) => t.status === status)
    if (owner) tasks = tasks.filter((t) => t.owner === owner)

    if (tasks.length === 0) return "無任務"

    const lines = ["## Tasks"]
    for (const t of tasks) {
      const blockers = t.blocked_by.length > 0 ? ` [blocked by: ${t.blocked_by.join(", ")}]` : ""
      lines.push(`- ${t.id}: ${t.subject} (${t.status}) - ${t.owner}${blockers}`)
    }
    return lines.join("\n")
  },
})

const taskWait = tool({
  description: "等待所有任務完成",
  args: {
    team: z.string().describe("團隊名稱"),
    timeout: z.number().optional().describe("超時秒數 (預設: 300)"),
  },
  async execute({ team, timeout }, ctx: ToolContext) {
    const maxWait = (timeout ?? 300) * 1000
    const start = Date.now()

    while (Date.now() - maxWait < start) {
      const tasks = await loadTasks(ctx.worktree, team)
      const pending = tasks.filter((t) => t.status !== "completed")

      if (pending.length === 0) {
        return `所有任務完成 (${tasks.length} tasks)`
      }

      await new Promise((r) => setTimeout(r, 2000))
    }

    const tasks = await loadTasks(ctx.worktree, team)
    const pending = tasks.filter((t) => t.status !== "completed")
    return `超時，仍有 ${pending.length} 個任務未完成`
  },
})

const inboxSend = tool({
  description: "發送訊息給團隊成員",
  args: {
    team: z.string().describe("團隊名稱"),
    to: z.string().describe("收件人 (或 'broadcast' 給全部)"),
    message: z.string().describe("訊息內容"),
  },
  async execute({ team, to, message }, ctx: ToolContext) {
    const inbox = await loadInbox(ctx.worktree, team)
    const teams = await loadTeams(ctx.worktree)
    const t = teams[team]
    if (!t) return `團隊 ${team} 不存在`

    const msg: Message = {
      id: generateId(),
      from: "system",
      to,
      content: message,
      timestamp: Date.now(),
      read: false,
    }

    if (to === "broadcast") {
      for (const member of t.members) {
        inbox.messages[member] = inbox.messages[member] ?? []
        inbox.messages[member].push(msg)
      }
    } else {
      inbox.messages[to] = inbox.messages[to] ?? []
      inbox.messages[to].push(msg)
    }

    await saveInbox(ctx.worktree, team, inbox)
    return `訊息已發送給 ${to}`
  },
})

const inboxReceive = tool({
  description: "接收並消費訊息",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const inbox = await loadInbox(ctx.worktree, team)
    const myName = "system"

    const messages = inbox.messages[myName] ?? []
    if (messages.length === 0) return "無新訊息"

    const unread = messages.filter((m) => !m.read)
    for (const m of unread) m.read = true
    await saveInbox(ctx.worktree, team, inbox)

    const lines = ["## Messages"]
    for (const m of messages) {
      lines.push(`- [${m.from}]: ${m.content}`)
    }
    return lines.join("\n")
  },
})

const inboxPeek = tool({
  description: "讀取訊息 (不標記為已讀)",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const inbox = await loadInbox(ctx.worktree, team)
    const myName = "system"

    const messages = inbox.messages[myName] ?? []
    if (messages.length === 0) return "無訊息"

    const lines = ["## Messages"]
    for (const m of messages) {
      const status = m.read ? "(read)" : "(unread)"
      lines.push(`- [${m.from}] ${status}: ${m.content}`)
    }
    return lines.join("\n")
  },
})

const boardShow = tool({
  description: "顯示團隊 Kanban 看板",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const tasks = await loadTasks(ctx.worktree, team)
    const teams = await loadTeams(ctx.worktree)
    const t = teams[team]
    if (!t) return `團隊 ${team} 不存在`

    const pending = tasks.filter((x) => x.status === "pending")
    const inProgress = tasks.filter((x) => x.status === "in_progress")
    const completed = tasks.filter((x) => x.status === "completed")
    const blocked = tasks.filter((x) => x.status === "blocked")

    const lines = [
      `## 🦞 ${team} Board`,
      "",
      `**Members:** ${t.members.join(", ")}`,
      "",
      "### 📋 Pending",
      ...pending.map((x) => `  - ${x.id}: ${x.subject} (@${x.owner})`),
      "",
      "### 🔄 In Progress",
      ...inProgress.map((x) => `  - ${x.id}: ${x.subject} (@${x.owner})`),
      "",
      "### ✅ Completed",
      ...completed.map((x) => `  - ${x.id}: ${x.subject} (@${x.owner})`),
      "",
      "### 🚫 Blocked",
      ...blocked.map((x) => `  - ${x.id}: ${x.subject} (@${x.owner}) [blocked by: ${x.blocked_by.join(", ")}]`),
    ]

    return lines.join("\n")
  },
})

const boardStats = tool({
  description: "顯示團隊統計",
  args: {
    team: z.string().describe("團隊名稱"),
  },
  async execute({ team }, ctx: ToolContext) {
    const tasks = await loadTasks(ctx.worktree, team)
    const inbox = await loadInbox(ctx.worktree, team)

    const pending = tasks.filter((x) => x.status === "pending").length
    const inProgress = tasks.filter((x) => x.status === "in_progress").length
    const completed = tasks.filter((x) => x.status === "completed").length
    const blocked = tasks.filter((x) => x.status === "blocked").length

    let unreadMessages = 0
    for (const msgs of Object.values(inbox.messages)) {
      unreadMessages += msgs.filter((m) => !m.read).length
    }

    return `## ${team} Stats
- Tasks: ${pending} pending, ${inProgress} in_progress, ${completed} completed, ${blocked} blocked
- Messages: ${unreadMessages} unread`
  },
})

export const swarmPlugin = async (input: any) => ({
  tool: {
    swarm_team_create: teamCreate,
    swarm_team_list: teamList,
    swarm_team_status: teamStatus,
    swarm_team_add_member: teamAddMember,
    swarm_team_remove_member: teamRemoveMember,
    swarm_team_cleanup: teamCleanup,
    swarm_task_create: taskCreate,
    swarm_task_update: taskUpdate,
    swarm_task_list: taskList,
    swarm_task_wait: taskWait,
    swarm_inbox_send: inboxSend,
    swarm_inbox_receive: inboxReceive,
    swarm_inbox_peek: inboxPeek,
    swarm_board_show: boardShow,
    swarm_board_stats: boardStats,
  },
})
