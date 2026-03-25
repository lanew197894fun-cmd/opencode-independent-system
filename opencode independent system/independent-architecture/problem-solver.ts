import { Log } from "./util/log"

const log = Log.create({ service: "independent-architecture-problem-solver" })

export class ProblemSolver {
  private solutions: Map<string, Solution> = new Map()
  private errorPatterns: Map<string, ErrorPattern> = new Map()

  constructor() {
    this.initializePatterns()
  }

  private initializePatterns() {
    const patterns: ErrorPattern[] = [
      {
        code: "TS7006",
        name: "Parameter Implicit Any",
        description: "Parameter implicitly has 'any' type",
        solutions: [
          "Add explicit type annotation to the parameter",
          "Use type inference with proper initialization",
          "Add type to generic: <T extends unknown>(param: T)",
        ],
        category: "type-error",
      },
      {
        code: "TS2307",
        name: "Cannot Find Module",
        description: "Cannot find module",
        solutions: [
          "Run 'bun install' to install dependencies",
          "Check import path is correct",
          "Verify package is in package.json",
          "Check tsconfig paths configuration",
        ],
        category: "module-error",
      },
      {
        code: "TS2339",
        name: "Property Does Not Exist",
        description: "Property does not exist on type",
        solutions: [
          "Add property to interface/type definition",
          "Check if property name is spelled correctly",
          "Use optional chaining (?.) or type assertion",
          "Extend existing type with new property",
        ],
        category: "property-error",
      },
      {
        code: "TS2322",
        name: "Type Not Assignable",
        description: "Type is not assignable to expected type",
        solutions: [
          "Check type compatibility",
          "Use type assertion: as Type",
          "Adjust expected type to match actual",
          "Add type guard for narrowing",
        ],
        category: "type-error",
      },
      {
        code: "BUN_INSTALL",
        name: "Install Failed",
        description: "bun install failed",
        solutions: [
          "Check network connection",
          "Clear bun cache: rm -rf ~/.bun/install/cache",
          "Delete node_modules and reinstall",
          "Check package.json for invalid versions",
        ],
        category: "build-error",
      },
      {
        code: "VITE_BUILD",
        name: "Build Failed",
        description: "vite build failed",
        solutions: [
          "Check for TypeScript errors",
          "Clear dist folder and rebuild",
          "Check vite.config.ts configuration",
          "Update vite and dependencies",
        ],
        category: "build-error",
      },
    ]

    patterns.forEach((pattern) => {
      this.errorPatterns.set(pattern.code, pattern)
    })

    log.info("Error patterns initialized", { count: patterns.length })
  }

  async analyzeError(error: string): Promise<ProblemAnalysis> {
    const errorCode = this.extractErrorCode(error) || "UNKNOWN"
    const pattern = this.errorPatterns.get(errorCode)
    const matchedPattern = pattern || this.findSimilarPattern(error)

    return {
      errorCode: errorCode || "UNKNOWN",
      description: error,
      pattern: matchedPattern || null,
      suggestions: matchedPattern?.solutions || [
        "Check error message for details",
        "Search for similar issues online",
        "Break down the problem into smaller parts",
      ],
      category: matchedPattern?.category || "unknown",
      confidence: matchedPattern ? 0.85 : 0.5,
    }
  }

  private extractErrorCode(error: string): string | null {
    const tsMatch = error.match(/TS\d{4}/)
    if (tsMatch) return tsMatch[0]

    const codeMatch = error.match(/ERROR_(\w+)/)
    if (codeMatch) return codeMatch[0]

    const namedMatch = error.match(/(BUN_|VITE_)?\w+(?:_FAILED|_ERROR)/)
    if (namedMatch) return namedMatch[0]

    return null
  }

  private findSimilarPattern(error: string): ErrorPattern | undefined {
    const lowerError = error.toLowerCase()

    for (const [, pattern] of this.errorPatterns) {
      if (lowerError.includes(pattern.name.toLowerCase()) || lowerError.includes(pattern.description.toLowerCase())) {
        return pattern
      }
    }
    return undefined
  }

  async solve(analysis: ProblemAnalysis): Promise<Solution> {
    const solution: Solution = {
      id: `sol-${Date.now()}`,
      problem: analysis.errorCode,
      steps: analysis.suggestions.map((s, i) => `${i + 1}. ${s}`),
      confidence: analysis.confidence,
      timeTaken: Date.now(),
      knowledgeUsed: analysis.pattern ? [analysis.pattern.code] : [],
      toolsUsed: [],
      success: analysis.confidence > 0.7,
    }

    this.solutions.set(solution.id, solution)
    log.info("Problem solved", { id: solution.id, success: solution.success })

    return solution
  }

  async handleFailure(params: { error: unknown; problem: string; context?: unknown }): Promise<Solution> {
    const errorStr = params.error instanceof Error ? params.error.message : String(params.error)
    const analysis = await this.analyzeError(errorStr)
    return this.solve(analysis)
  }

  async getSolutionHistory(limit: number = 10): Promise<Solution[]> {
    return Array.from(this.solutions.values())
      .sort((a, b) => b.timeTaken - a.timeTaken)
      .slice(0, limit)
  }

  async healthCheck(): Promise<HealthCheckDetail> {
    return {
      type: "problem-solver",
      status: "healthy",
      message: `${this.errorPatterns.size} error patterns, ${this.solutions.size} solutions`,
      confidence: 0.9,
      metrics: {
        patterns: this.errorPatterns.size,
        solutions: this.solutions.size,
      },
    }
  }
}

export interface ErrorPattern {
  code: string
  name: string
  description: string
  solutions: string[]
  category: string
}

export interface Solution {
  id: string
  problem: string
  steps: string[]
  confidence: number
  timeTaken: number
  knowledgeUsed: string[]
  toolsUsed: string[]
  success: boolean
}

export interface ProblemAnalysis {
  errorCode: string
  description: string
  pattern: ErrorPattern | null
  suggestions: string[]
  category: string
  confidence: number
}

export interface HealthCheckDetail {
  type: "model" | "search" | "knowledge" | "problem-solver" | "system" | "network" | "storage"
  status: "healthy" | "warning" | "critical"
  message: string
  confidence: number
  metrics?: Record<string, number>
}
