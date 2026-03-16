import { Log } from "./util/log"

const log = Log.create({ service: "ji-san-ji-security" })

export class SecurityShield {
  private sensitivePatterns: string[] = [
    "password",
    "api_key",
    "api-key",
    "secret",
    "token",
    "credential",
    "private_key",
    "private-key",
  ]
  private dangerousPatterns: string[] = ["rm -rf", "format", "mkfs", "dd if"]

  constructor() {}

  async securityCheck(input: string): Promise<SecurityCheckResult> {
    const sanitized = this.sanitize(input)
    const sensitive = this.detectSensitiveData(input)
    const dangerous = this.detectDangerousCommands(input)

    const safe = sensitive.length === 0 && dangerous.length === 0

    return {
      safe,
      confidence: safe ? 0.95 : 0.8,
      message: safe ? "Input passed security check" : "Potential security concern detected",
      sanitized: safe ? undefined : sanitized,
      sensitiveData: sensitive.length > 0 ? sensitive : undefined,
      dangerousCommands: dangerous.length > 0 ? dangerous : undefined,
    }
  }

  private sanitize(input: string): string {
    let sanitized = input
    sanitized = sanitized.replace(/(api[_-]?key|token|secret|password)[^\s]*/gi, "[REDACTED]")
    return sanitized
  }

  private detectSensitiveData(input: string): string[] {
    const found: string[] = []
    const lowerInput = input.toLowerCase()

    this.sensitivePatterns.forEach((pattern) => {
      if (lowerInput.includes(pattern.toLowerCase())) {
        found.push(pattern)
      }
    })

    return [...new Set(found)]
  }

  private detectDangerousCommands(input: string): string[] {
    const found: string[] = []
    const lowerInput = input.toLowerCase()

    this.dangerousPatterns.forEach((pattern) => {
      if (lowerInput.includes(pattern.toLowerCase())) {
        found.push(pattern)
      }
    })

    return found
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    return {
      type: "system",
      status: "healthy",
      message: "Security shield active",
      confidence: 0.95,
    }
  }
}

export interface SecurityCheckResult {
  safe: boolean
  confidence: number
  message?: string
  sanitized?: string
  sensitiveData?: string[]
  dangerousCommands?: string[]
}

export interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
}
