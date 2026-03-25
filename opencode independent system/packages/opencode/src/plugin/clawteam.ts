import { tool, type ToolContext } from "@opencode-ai/plugin"
import { z } from "zod"

const CLAWTEAM_CMD = "clawteam"

async function isClawTeamInstalled(): Promise<boolean> {
  try {
    await Bun.$`${CLAWTEAM_CMD} --version`.text()
    return true
  } catch {
    return false
  }
}

async function runClawTeam(args: string[], ctx: ToolContext): Promise<string> {
  const result = await Bun.$`${CLAWTEAM_CMD} ${args}`.text()
  return result
}

const installCheck = tool({
  description: "Check if ClawTeam is installed and get version info",
  args: {},
  async execute({}, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) {
      return "ClawTeam not installed. Install with:\ngit clone https://github.com/win4r/ClawTeam-OpenClaw.git\ncd ClawTeam-OpenClaw\npip install -e ."
    }
    const version = await Bun.$`${CLAWTEAM_CMD} --version`.text()
    return `ClawTeam: ${version.trim()}\nStatus: Ready for swarm coordination`
  },
})

const teamCreate = tool({
  description: "Create a new ClawTeam team",
  args: {
    name: z.string().describe("Team name"),
    description: z.string().optional().describe("Team description"),
    leader: z.string().optional().describe("Leader agent name (default: leader)"),
  },
  async execute({ name, description, leader }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args = ["team", "spawn-team", name]
    if (description) args.push("-d", description)
    if (leader) args.push("-n", leader)

    return runClawTeam(args, ctx)
  },
})

const teamList = tool({
  description: "List all ClawTeam teams",
  args: {},
  async execute({}, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["team", "discover"], ctx)
  },
})

const teamStatus = tool({
  description: "Show team members and status",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["team", "status", team], ctx)
  },
})

const teamCleanup = tool({
  description: "Delete a team and all its resources",
  args: {
    team: z.string().describe("Team name"),
    force: z.boolean().optional().describe("Force cleanup without confirmation"),
  },
  async execute({ team, force }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    const args = force ? ["team", "cleanup", team, "--force"] : ["team", "cleanup", team]
    return runClawTeam(args, ctx)
  },
})

const spawnAgent = tool({
  description: "Spawn a new agent in a team (creates git worktree + tmux window)",
  args: {
    team: z.string().describe("Team name"),
    agentName: z.string().describe("Agent/worker name"),
    task: z.string().describe("Task description for the agent"),
    backend: z.enum(["tmux", "subprocess"]).optional().describe("Spawn backend (default: tmux)"),
    agent: z.string().optional().describe("Agent type (openclaw, claude, codex, nanobot). Default: openclaw"),
  },
  async execute({ team, agentName, task, backend, agent }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args: string[] = []
    if (backend) args.push(backend)
    args.push("spawn")
    if (agent) args.push(agent)
    args.push("--team", team, "--agent-name", agentName, "--task", task)

    return runClawTeam(args, ctx)
  },
})

const taskCreate = tool({
  description: "Create a task in a team",
  args: {
    team: z.string().describe("Team name"),
    subject: z.string().describe("Task subject/description"),
    owner: z.string().optional().describe("Task owner"),
    blockedBy: z.string().optional().describe("Comma-separated task IDs this task blocks"),
  },
  async execute({ team, subject, owner, blockedBy }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args = ["task", "create", team, subject]
    if (owner) args.push("-o", owner)
    if (blockedBy) args.push("--blocked-by", blockedBy)

    return runClawTeam(args, ctx)
  },
})

const taskUpdate = tool({
  description: "Update task status (auto-unblocks dependent tasks)",
  args: {
    team: z.string().describe("Team name"),
    taskId: z.string().describe("Task ID"),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]).describe("New status"),
  },
  async execute({ team, taskId, status }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["task", "update", team, taskId, "--status", status], ctx)
  },
})

const taskList = tool({
  description: "List tasks in a team",
  args: {
    team: z.string().describe("Team name"),
    status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional().describe("Filter by status"),
    owner: z.string().optional().describe("Filter by owner"),
  },
  async execute({ team, status, owner }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args = ["task", "list", team]
    if (status) args.push("--status", status)
    if (owner) args.push("--owner", owner)

    return runClawTeam(args, ctx)
  },
})

const taskWait = tool({
  description: "Wait for all tasks in a team to complete",
  args: {
    team: z.string().describe("Team name"),
    timeout: z.number().optional().describe("Timeout in seconds (default: 300)"),
  },
  async execute({ team, timeout }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args = timeout ? ["task", "wait", team, "--timeout", String(timeout)] : ["task", "wait", team]
    return runClawTeam(args, ctx)
  },
})

const inboxSend = tool({
  description: "Send a message to a team member",
  args: {
    team: z.string().describe("Team name"),
    to: z.string().describe("Recipient name (or 'broadcast' for all)"),
    message: z.string().describe("Message content"),
  },
  async execute({ team, to, message }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["inbox", "send", team, to, message], ctx)
  },
})

const inboxReceive = tool({
  description: "Receive and consume messages from inbox",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["inbox", "receive", team], ctx)
  },
})

const inboxPeek = tool({
  description: "Read messages without consuming them",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["inbox", "peek", team], ctx)
  },
})

const boardShow = tool({
  description: "Show team kanban board in terminal",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["board", "show", team], ctx)
  },
})

const boardLive = tool({
  description: "Show auto-refreshing dashboard",
  args: {
    team: z.string().describe("Team name"),
    interval: z.number().optional().describe("Refresh interval in seconds (default: 3)"),
  },
  async execute({ team, interval }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"

    const args = interval ? ["board", "live", team, "--interval", String(interval)] : ["board", "live", team]
    return runClawTeam(args, ctx)
  },
})

const boardAttach = tool({
  description: "Attach to tiled tmux view of all agents",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["board", "attach", team], ctx)
  },
})

const workspaceList = tool({
  description: "List git worktrees for a team",
  args: {
    team: z.string().describe("Team name"),
  },
  async execute({ team }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["workspace", "list", team], ctx)
  },
})

const workspaceMerge = tool({
  description: "Merge agent worktree back to main branch",
  args: {
    team: z.string().describe("Team name"),
    agent: z.string().describe("Agent name"),
  },
  async execute({ team, agent }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["workspace", "merge", team, agent], ctx)
  },
})

const workspaceCleanup = tool({
  description: "Remove agent worktree",
  args: {
    team: z.string().describe("Team name"),
    agent: z.string().describe("Agent name"),
  },
  async execute({ team, agent }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["workspace", "cleanup", team, agent], ctx)
  },
})

const launchTemplate = tool({
  description: "Launch a team from a template (e.g., hedge-fund)",
  args: {
    template: z.string().describe("Template name"),
    team: z.string().describe("Team name"),
    goal: z.string().describe("Goal/objective for the team"),
  },
  async execute({ template, team, goal }, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["launch", template, "--team", team, "--goal", goal], ctx)
  },
})

const templateList = tool({
  description: "List available team templates",
  args: {},
  async execute({}, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["template", "list"], ctx)
  },
})

const configShow = tool({
  description: "Show ClawTeam configuration",
  args: {},
  async execute({}, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["config", "show"], ctx)
  },
})

const configHealth = tool({
  description: "Check ClawTeam health status",
  args: {},
  async execute({}, ctx: ToolContext) {
    const installed = await isClawTeamInstalled()
    if (!installed) return "ClawTeam not installed"
    return runClawTeam(["config", "health"], ctx)
  },
})

export const clawTeamPlugin = async (input: any) => ({
  tool: {
    clawteam_install_check: installCheck,
    clawteam_team_create: teamCreate,
    clawteam_team_list: teamList,
    clawteam_team_status: teamStatus,
    clawteam_team_cleanup: teamCleanup,
    clawteam_spawn: spawnAgent,
    clawteam_task_create: taskCreate,
    clawteam_task_update: taskUpdate,
    clawteam_task_list: taskList,
    clawteam_task_wait: taskWait,
    clawteam_inbox_send: inboxSend,
    clawteam_inbox_receive: inboxReceive,
    clawteam_inbox_peek: inboxPeek,
    clawteam_board_show: boardShow,
    clawteam_board_live: boardLive,
    clawteam_board_attach: boardAttach,
    clawteam_workspace_list: workspaceList,
    clawteam_workspace_merge: workspaceMerge,
    clawteam_workspace_cleanup: workspaceCleanup,
    clawteam_launch: launchTemplate,
    clawteam_template_list: templateList,
    clawteam_config_show: configShow,
    clawteam_config_health: configHealth,
  },
})
