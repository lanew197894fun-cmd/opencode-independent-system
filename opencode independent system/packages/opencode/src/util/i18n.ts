/**
 * Simple internationalization (i18n) module for OpenCode CLI
 * Supports English (en) and Traditional Chinese (zh-TW)
 */

import { createSignal, createMemo } from "solid-js"

type Language = "en" | "zh-TW"

// Default language signal for reactivity
const [currentLanguage, setCurrentLanguage] = createSignal<Language>("en")
export { currentLanguage, translations }

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Menu items
    "menu.switch_session": "Switch session",
    "menu.manage_workspaces": "Manage workspaces",
    "menu.new_session": "New session",
    "menu.switch_model": "Switch model",
    "menu.model_cycle": "Model cycle",
    "menu.model_cycle_reverse": "Model cycle reverse",
    "menu.favorite_cycle": "Favorite cycle",
    "menu.favorite_cycle_reverse": "Favorite cycle reverse",
    "menu.switch_agent": "Switch agent",
    "menu.toggle_mcps": "Toggle MCPs",
    "menu.agent_cycle": "Agent cycle",
    "menu.variant_cycle": "Variant cycle",
    "menu.agent_cycle_reverse": "Agent cycle reverse",
    "menu.connect_provider": "Connect provider",
    "menu.view_status": "View status",
    "menu.switch_theme": "Switch theme",
    "menu.toggle_theme_mode": "Toggle Theme Mode",
    "menu.lock_theme_mode": "Lock Theme Mode",
    "menu.unlock_theme_mode": "Unlock Theme Mode",
    "menu.help": "Help",
    "menu.open_docs": "Open docs",
    "menu.exit_app": "Exit the app",
    "menu.toggle_debug_panel": "Toggle debug panel",
    "menu.toggle_console": "Toggle console",
    "menu.write_heap_snapshot": "Write heap snapshot",
    "menu.suspend_terminal": "Suspend terminal",
    "menu.enable_terminal_title": "Enable terminal title",
    "menu.disable_terminal_title": "Disable terminal title",
    "menu.enable_animations": "Enable animations",
    "menu.disable_animations": "Disable animations",
    "menu.enable_diff_wrapping": "Enable diff wrapping",
    "menu.disable_diff_wrapping": "Disable diff wrapping",
    "menu.switch_language": "Switch language",

    // Common UI elements
    "common.delete": "delete",
    "common.rename": "rename",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.ok": "OK",
    "common.yes": "Yes",
    "common.no": "No",
    "common.edit": "Edit",
    "common.copy": "Copy",
    "common.revert": "Revert",
    "common.fork": "Fork",
    "common.open": "Open",
    "common.close": "Close",
    "common.show": "Show",
    "common.hide": "Hide",

    // Dialog titles
    "dialog.update_available": "Update Available",
    "dialog.update_failed": "Update Failed",
    "dialog.update_complete": "Update Complete",

    // Tooltips and hints
    "tooltip.clear_prompt": "Clear prompt",
    "tooltip.submit_prompt": "Submit prompt",
    "tooltip.paste": "Paste",
    "tooltip.interrupt_session": "Interrupt session",
    "tooltip.open_editor": "Open editor",
    "tooltip.skills": "Skills",
    "tooltip.stash_prompt": "Stash prompt",
    "tooltip.stash_pop": "Stash pop",
    "tooltip.stash_list": "Stash list",

    // Session related
    "session.tip_show": "Show tips",
    "session.tip_hide": "Hide tips",

    // Provider related
    "provider.connect": "Connect provider",
    "provider.view_all": "View all providers",
    "provider.api_key": "API key",

    // Workspace related
    "workspace.creating": "Creating {type} workspace...",
    "workspace.worktree": "Worktree",
    "workspace.local": "Local",
    "workspace.new": "+ New workspace",

    // Theme related
    "theme.favorite": "Favorite",

    // Status messages
    "status.copied_to_clipboard": "Copied to clipboard",
  },
  "zh-TW": {
    // Menu items
    "menu.switch_session": "切換會話",
    "menu.manage_workspaces": "管理工作區",
    "menu.new_session": "新建會話",
    "menu.switch_model": "切換模型",
    "menu.model_cycle": "模型循環",
    "menu.model_cycle_reverse": "模型循環（反向）",
    "menu.favorite_cycle": "收藏循環",
    "menu.favorite_cycle_reverse": "收藏循環（反向）",
    "menu.switch_agent": "切換代理",
    "menu.toggle_mcps": "切換 MCP",
    "menu.agent_cycle": "代理循環",
    "menu.variant_cycle": "變體循環",
    "menu.agent_cycle_reverse": "代理循環（反向）",
    "menu.connect_provider": "連接提供者",
    "menu.view_status": "查看狀態",
    "menu.switch_theme": "切換主題",
    "menu.toggle_theme_mode": "切換主題模式",
    "menu.lock_theme_mode": "鎖定主題模式",
    "menu.unlock_theme_mode": "解鎖主題模式",
    "menu.help": "幫助",
    "menu.open_docs": "打開文檔",
    "menu.exit_app": "退出應用",
    "menu.toggle_debug_panel": "切換調試面板",
    "menu.toggle_console": "切換控制台",
    "menu.write_heap_snapshot": "寫入堆快照",
    "menu.suspend_terminal": "暫停終端",
    "menu.enable_terminal_title": "啟用終端標題",
    "menu.disable_terminal_title": "禁用終端標題",
    "menu.enable_animations": "啟用動畫",
    "menu.disable_animations": "禁用動畫",
    "menu.enable_diff_wrapping": "啟用差異換行",
    "menu.disable_diff_wrapping": "禁用差異換行",
    "menu.switch_language": "切換語言",

    // Common UI elements
    "common.delete": "刪除",
    "common.rename": "重命名",
    "common.cancel": "取消",
    "common.confirm": "確認",
    "common.ok": "確定",
    "common.yes": "是",
    "common.no": "否",
    "common.edit": "編輯",
    "common.copy": "複製",
    "common.revert": "還原",
    "common.fork": "分叉",
    "common.open": "打開",
    "common.close": "關閉",
    "common.show": "顯示",
    "common.hide": "隱藏",

    // Dialog titles
    "dialog.update_available": "有可用更新",
    "dialog.update_failed": "更新失敗",
    "dialog.update_complete": "更新完成",

    // Tooltips and hints
    "tooltip.clear_prompt": "清除提示",
    "tooltip.submit_prompt": "提交提示",
    "tooltip.paste": "貼上",
    "tooltip.interrupt_session": "中斷會話",
    "tooltip.open_editor": "打開編輯器",
    "tooltip.skills": "技能",
    "tooltip.stash_prompt": "儲存提示",
    "tooltip.stash_pop": "彈出儲存",
    "tooltip.stash_list": "儲存列表",

    // Session related
    "session.tip_show": "顯示提示",
    "session.tip_hide": "隱藏提示",

    // Provider related
    "provider.connect": "連接提供者",
    "provider.view_all": "查看所有提供者",
    "provider.api_key": "API 金鑰",

    // Workspace related
    "workspace.creating": "正在建立 {type} 工作區...",
    "workspace.worktree": "工作樹",
    "workspace.local": "本地",
    "workspace.new": "+ 新建工作區",

    // Theme related
    "theme.favorite": "收藏",

    // Status messages
    "status.copied_to_clipboard": "已複製到剪貼簿",
  },
}

/**
 * Set the current language for translations
 */
export function setLanguage(lang: Language): void {
  setCurrentLanguage(lang)
}

/**
 * Get the current language
 */
export function getLanguage(): Language {
  return currentLanguage()
}

/**
 * Translate a key to the current language
 * @param key - The translation key
 * @param params - Optional parameters for placeholder substitution
 */
export function t(key: string, params?: Record<string, string | number>): string {
  let translation = translations[currentLanguage()][key] || translations["en"][key] || key

  // Replace placeholders like {type} with actual values
  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(value))
    }
  }

  return translation
}

/**
 * Detect language from system environment variables
 */
export function detectSystemLanguage(): Language {
  // Check LANG environment variable
  const langEnv = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ""

  // Check for Traditional Chinese variants
  if (langEnv.includes("zh_TW") || langEnv.includes("zh-Hant") || langEnv.includes("zh-HK")) {
    return "zh-TW"
  }

  // Check for Simplified Chinese (map to Traditional for now)
  if (langEnv.includes("zh_CN") || langEnv.includes("zh-Hans")) {
    return "zh-TW" // Map Simplified Chinese to Traditional Chinese
  }

  // Default to English
  return "en"
}

/**
 * Initialize i18n with system language detection
 */
export function initializeI18n(): void {
  const systemLang = detectSystemLanguage()
  setLanguage(systemLang)
}

/**
 * Toggle between English and Traditional Chinese
 */
export function toggleLanguage(): void {
  setCurrentLanguage(currentLanguage() === "en" ? "zh-TW" : "en")
}
