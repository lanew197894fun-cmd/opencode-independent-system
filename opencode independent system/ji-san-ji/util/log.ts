import z from "zod";

export namespace Log {
  export const Level = z.enum(["DEBUG", "INFO", "WARN", "ERROR"]);
  export type Level = z.infer<typeof Level>;

  const levelPriority: Record<Level, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  let level: Level = "INFO";

  function shouldLog(input: Level): boolean {
    return levelPriority[input] >= levelPriority[level];
  }

  export function setLevel(newLevel: Level): void {
    level = newLevel;
  }

  export function create({ service }: { service: string }) {
    return {
      debug: (message: string, ...args: unknown[]) => {
        if (shouldLog("DEBUG"))
          console.debug(`[${service}] ${message}`, ...args);
      },
      info: (message: string, ...args: unknown[]) => {
        if (shouldLog("INFO")) console.info(`[${service}] ${message}`, ...args);
      },
      warn: (message: string, ...args: unknown[]) => {
        if (shouldLog("WARN")) console.warn(`[${service}] ${message}`, ...args);
      },
      error: (message: string, ...args: unknown[]) => {
        if (shouldLog("ERROR"))
          console.error(`[${service}] ${message}`, ...args);
      },
    };
  }
}
