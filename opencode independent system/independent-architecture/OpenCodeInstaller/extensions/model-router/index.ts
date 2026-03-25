import { z } from "zod";

const MODEL_CONFIG = {
  code: "ollama/qwen2.5-coder:3b",
  general: "ollama/llama3",
  fast: "ollama/llama3:70b",
  large: "anthropic/claude-3-5-sonnet",
};

const CODE_KEYWORDS = [
  "code",
  "程式",
  "代碼",
  "function",
  "class",
  "def",
  "var",
  "import",
  "export",
  "bug",
  "error",
  "fix",
  "sql",
  "python",
  "javascript",
  "java",
  "html",
  "css",
  "json",
  "docker",
  "git",
];

const GENERAL_KEYWORDS = [
  "天氣",
  "新聞",
  "你好",
  "早安",
  "晚安",
  "幫我",
  "什麼是",
  "怎麼",
  "如何",
  "為什麼",
  "介紹",
  "說明",
  "翻譯",
  "hello",
];

export const ModelRouterPlugin = {
  id: "model-router",
  name: "Smart Model Router",
  version: "1.0.0",

  detectIntent(message: string): string {
    const lower = message.toLowerCase();

    for (const kw of CODE_KEYWORDS) {
      if (lower.includes(kw)) return "code";
    }

    for (const kw of GENERAL_KEYWORDS) {
      if (lower.includes(kw)) return "general";
    }

    return "fast";
  },

  getComplexity(message: string): "low" | "medium" | "high" {
    if (message.length > 500 || message.split(/\s+/).length > 50) {
      return "high";
    }
    if (message.length > 100 || message.split(/\s+/).length > 20) {
      return "medium";
    }
    return "low";
  },

  selectModel(message: string, mode: "auto" | "smart" = "auto"): string {
    const intent = this.detectIntent(message);
    const complexity = this.getComplexity(message);

    if (mode === "smart") {
      if (complexity === "high") return MODEL_CONFIG.large;
      if (complexity === "medium") return MODEL_CONFIG.general;
      return MODEL_CONFIG.fast;
    }

    return (
      MODEL_CONFIG[intent as keyof typeof MODEL_CONFIG] || MODEL_CONFIG.fast
    );
  },
};
