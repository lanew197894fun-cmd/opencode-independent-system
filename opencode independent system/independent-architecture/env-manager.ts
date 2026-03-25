import { existsSync, mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import { execSync } from "child_process"

export interface PortableEnvPaths {
  baseDir: string
  nodeDir: string
  gitDir: string
  dataDir: string
  nodeBin: string
  npmBin: string
  gitBin: string
}

export interface EnvManagerConfig {
  baseDir?: string
  enableDataRedirect?: boolean
  githubProxy?: string
  autoSetupOpenClaw?: boolean
}

export interface OpenClawConfig {
  provider: string
  model: string
  apiKey?: string
  baseUrl?: string
}

const KNOWN_PATHS = [
  "/home/reamaster/opencode-manager/OpenClawInstaller",
  "/home/reamaster/OpenClawInstaller",
  "/opt/claw-installer",
  join(homedir(), "OpenClawInstaller"),
  join(homedir(), ".claw-installer"),
]

const DEFAULT_FREE_MODELS = [
  { provider: "opencode", model: "glm-4.7-free", name: "GLM-4 免费版", apiKey: "" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", apiKey: "" },
]

export class EnvManager {
  private config: EnvManagerConfig
  private portablePaths: PortableEnvPaths | null = null
  private isActive = false

  constructor(config: EnvManagerConfig = {}) {
    this.config = {
      baseDir: config.baseDir || "/home/reamaster/opencode-manager/OpenClawInstaller",
      enableDataRedirect: config.enableDataRedirect ?? true,
      githubProxy: config.githubProxy,
      autoSetupOpenClaw: config.autoSetupOpenClaw ?? true,
    }
  }

  async init(): Promise<boolean> {
    const paths = await this.detectPortableEnv()
    if (!paths) {
      return false
    }

    this.portablePaths = paths
    this.isActive = true
    return true
  }

  async detectPortableEnv(): Promise<PortableEnvPaths | null> {
    for (const baseDir of KNOWN_PATHS) {
      const paths = this.checkDirectory(baseDir)
      if (paths) {
        return paths
      }
    }

    if (this.config.baseDir) {
      return this.checkDirectory(this.config.baseDir)
    }

    return null
  }

  private checkDirectory(baseDir: string): PortableEnvPaths | null {
    if (!existsSync(baseDir)) {
      return null
    }

    const nodeDir = join(baseDir, "tools", "node")
    const gitDir = join(baseDir, "tools", "git")
    const dataDir = join(baseDir, "data")

    const nodeBin = this.findNodeBinary(nodeDir)
    const gitBin = this.findGitBinary(gitDir)

    if (!nodeBin && !gitBin) {
      return null
    }

    return {
      baseDir,
      nodeDir,
      gitDir,
      dataDir,
      nodeBin: nodeBin || "",
      npmBin: nodeBin ? join(nodeDir, "bin", "npm") : "",
      gitBin: gitBin || "",
    }
  }

  private findNodeBinary(nodeDir: string): string | null {
    const candidates = [join(nodeDir, "bin", "node"), join(nodeDir, "node"), join(nodeDir, "node.exe")]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        try {
          const version = execSync(`"${candidate}" --version`, { encoding: "utf8" }).trim()
          if (version.startsWith("v22") || version.startsWith("v20") || version.startsWith("v18")) {
            return candidate
          }
        } catch {
          continue
        }
      }
    }
    return null
  }

  private findGitBinary(gitDir: string): string | null {
    const candidates = [
      join(gitDir, "bin", "git"),
      join(gitDir, "cmd", "git.exe"),
      join(gitDir, "mingw64", "bin", "git.exe"),
      join(gitDir, "git"),
    ]

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        try {
          const version = execSync(`"${candidate}" --version`, { encoding: "utf8" }).trim()
          if (version.includes("git version")) {
            return candidate
          }
        } catch {
          continue
        }
      }
    }
    return null
  }

  getEnv(): NodeJS.ProcessEnv {
    if (!this.isActive || !this.portablePaths) {
      return process.env
    }

    const env: NodeJS.ProcessEnv = { ...process.env }
    const p = this.portablePaths

    if (p.nodeBin) {
      const nodeRoot = join(p.nodeDir, "bin", "..", "..")
      env.PATH = `${p.nodeDir}:${p.nodeDir}:${env.PATH || ""}`
      env.NODE_PATH = join(nodeRoot, "lib", "node_modules")
    }

    if (p.gitBin) {
      const gitRoot = join(p.gitDir, "..")
      env.PATH = `${p.gitDir}:${env.PATH || ""}`
      env.GIT_ALLOW_PROTOCOL = "https,http,git,file"
    }

    if (this.config.enableDataRedirect && p.dataDir) {
      env.HOME = p.dataDir
      env.USERPROFILE = p.dataDir
      env.APPDATA = join(p.dataDir, "AppData", "Roaming")
      env.LOCALAPPDATA = join(p.dataDir, "AppData", "Local")
      env.XDG_CONFIG_HOME = join(p.dataDir, ".config")
      env.XDG_DATA_HOME = join(p.dataDir, ".local", "share")
      env.TEMP = join(p.dataDir, "temp")
      env.TMP = join(p.dataDir, "temp")
    }

    if (this.config.githubProxy) {
      env.GIT_CONFIG_PARAMETERS = `'url."https://github.com/".insteadOf="ssh://git@github.com/"' 'url."https://github.com/".insteadOf="git@github.com:"'`
      env.git_proxy = this.config.githubProxy
    }

    env.OPENCLAW_PORTABLE = "true"
    env.OPENCLAW_BASE_DIR = p.baseDir

    return env
  }

  getPaths(): PortableEnvPaths | null {
    return this.portablePaths
  }

  getStatus(): { active: boolean; nodeVersion?: string; gitVersion?: string; dataRedirect: boolean } {
    if (!this.isActive || !this.portablePaths) {
      return { active: false, dataRedirect: false }
    }

    let nodeVersion: string | undefined
    let gitVersion: string | undefined

    try {
      if (this.portablePaths.nodeBin) {
        nodeVersion = execSync(`"${this.portablePaths.nodeBin}" --version`, { encoding: "utf8" }).trim()
      }
    } catch {}

    try {
      if (this.portablePaths.gitBin) {
        gitVersion = execSync(`"${this.portablePaths.gitBin}" --version`, { encoding: "utf8" }).trim()
      }
    } catch {}

    return {
      active: true,
      nodeVersion,
      gitVersion,
      dataRedirect: this.config.enableDataRedirect ?? false,
    }
  }

  async setupOpenClawIfNeeded(): Promise<boolean> {
    if (!this.config.autoSetupOpenClaw) {
      return false
    }

    const openclawDir = join(homedir(), ".openclaw")
    const openclawJson = join(openclawDir, "openclaw.json")
    const envFile = join(openclawDir, "env")

    if (!existsSync(openclawDir)) {
      mkdirSync(openclawDir, { recursive: true })
    }

    const hasExistingConfig = existsSync(openclawJson) || existsSync(envFile)
    if (hasExistingConfig) {
      return false
    }

    try {
      const freeModel = DEFAULT_FREE_MODELS[0]

      const envContent = `# OpenClaw Environment Configuration
# Generated by Independent System - Portable Mode
# Model: ${freeModel.name}

# Default to free model
OPENAI_API_KEY="${freeModel.apiKey || "free-trial"}"
OPENAI_BASE_URL="https://api.opencode.ai/v1"
`
      writeFileSync(envFile, envContent, { mode: 0o600 })

      const configContent = JSON.stringify(
        {
          agent: {
            model: `${freeModel.provider}/${freeModel.model}`,
          },
          gateway: {
            mode: "local",
          },
        },
        null,
        2,
      )
      writeFileSync(openclawJson, configContent, { mode: 0o600 })

      return true
    } catch (error) {
      console.error("[env-manager] Failed to setup OpenClaw:", error)
      return false
    }
  }

  wrapCommand(cmd: string, args: string[] = []): { cmd: string; args: string[]; env: NodeJS.ProcessEnv } {
    const env = this.getEnv()

    if (this.portablePaths?.nodeBin && (cmd === "node" || cmd === "npm" || cmd === "npx" || cmd === "pnpm")) {
      if (cmd === "node") {
        return { cmd: this.portablePaths.nodeBin, args, env }
      }
      return { cmd: this.portablePaths.npmBin, args: [cmd, ...args], env }
    }

    if (this.portablePaths?.gitBin && cmd === "git") {
      return { cmd: this.portablePaths.gitBin, args, env }
    }

    return { cmd, args, env }
  }
}

let globalEnvManager: EnvManager | null = null

export async function getEnvManager(): Promise<EnvManager> {
  if (!globalEnvManager) {
    globalEnvManager = new EnvManager()
    await globalEnvManager.init()
  }
  return globalEnvManager
}

export function initEnvManager(config?: EnvManagerConfig): EnvManager {
  globalEnvManager = new EnvManager(config)
  return globalEnvManager
}
