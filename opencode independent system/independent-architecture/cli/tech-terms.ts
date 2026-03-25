// 雙語技術術語庫
// 支援程式開發、網路、系統、資料庫等領域的專業術語

export interface TechTerm {
  term: string
  zhTW: string
  en: string
  category: TermCategory
  aliases?: string[]
}

export type TermCategory =
  | "programming"
  | "network"
  | "system"
  | "database"
  | "security"
  | "devops"
  | "cloud"
  | "ai"
  | "web"
  | "mobile"

export const techTerms: TechTerm[] = [
  // 程式開發
  { term: "API", zhTW: "應用程式介面", en: "Application Programming Interface", category: "programming", aliases: ["api", "Application Programming Interface"] },
  { term: "SDK", zhTW: "軟體開發套件", en: "Software Development Kit", category: "programming", aliases: ["sdk"] },
  { term: "IDE", zhTW: "整合開發環境", en: "Integrated Development Environment", category: "programming", aliases: ["ide"] },
  { term: "CLI", zhTW: "命令列介面", en: "Command Line Interface", category: "programming", aliases: ["cli"] },
  { term: "GUI", zhTW: "圖形使用者介面", en: "Graphical User Interface", category: "programming", aliases: ["gui"] },
  { term: "REPL", zhTW: "互動式解釋器", en: "Read-Eval-Print Loop", category: "programming", aliases: ["repl"] },
  { term: "CRUD", zhTW: "增刪查改", en: "Create Read Update Delete", category: "programming", aliases: ["crud"] },
  { term: "OOP", zhTW: "物件導向程式設計", en: "Object-Oriented Programming", category: "programming", aliases: ["oop", "OOP"] },
  { term: "FP", zhTW: "函數式程式設計", en: "Functional Programming", category: "programming", aliases: ["fp", "FP"] },
  { term: "CI/CD", zhTW: "持續整合/持續部署", en: "Continuous Integration/Deployment", category: "devops", aliases: ["ci-cd", "cicd"] },
  { term: "git", zhTW: "版本控制系統", en: "Distributed Version Control", category: "devops", aliases: ["Git", "版本控制"] },
  { term: "Docker", zhTW: "容器化平台", en: "Container Platform", category: "devops", aliases: ["docker", "容器"] },
  { term: "K8s", zhTW: "Kubernetes 容器編排", en: "Kubernetes Container Orchestration", category: "devops", aliases: ["kubernetes", "k8s"] },

  // 網路
  { term: "HTTP", zhTW: "超文字傳輸協定", en: "HyperText Transfer Protocol", category: "network", aliases: ["http"] },
  { term: "HTTPS", zhTW: "安全超文字傳輸協定", en: "HTTP Secure", category: "network", aliases: ["https"] },
  { term: "TCP", zhTW: "傳輸控制協定", en: "Transmission Control Protocol", category: "network", aliases: ["tcp"] },
  { term: "UDP", zhTW: "用戶資料包協定", en: "User Datagram Protocol", category: "network", aliases: ["udp"] },
  { term: "DNS", zhTW: "網域名稱系統", en: "Domain Name System", category: "network", aliases: ["dns"] },
  { term: "VPN", zhTW: "虛擬私人網路", en: "Virtual Private Network", category: "network", aliases: ["vpn"] },
  { term: "SSH", zhTW: "安全殼層協定", en: "Secure Shell", category: "network", aliases: ["ssh"] },
  { term: "REST", zhTW: "表現層狀態轉移", en: "Representational State Transfer", category: "web", aliases: ["rest", "RESTful"] },
  { term: "WebSocket", zhTW: "網頁通訊端", en: "WebSocket", category: "web", aliases: ["websocket"] },
  { term: "CDN", zhTW: "內容傳遞網路", en: "Content Delivery Network", category: "network", aliases: ["cdn"] },
  { term: "Firewall", zhTW: "防火牆", en: "Firewall", category: "security", aliases: ["firewall", "防火牆"] },
  { term: "Proxy", zhTW: "代理伺服器", en: "Proxy Server", category: "network", aliases: ["proxy", "代理"] },
  { term: "Load Balancer", zhTW: "負載平衡器", en: "Load Balancer", category: "network", aliases: ["load-balancer", "lb"] },

  // 系統
  { term: "OS", zhTW: "作業系統", en: "Operating System", category: "system", aliases: ["os", "OS"] },
  { term: "Kernel", zhTW: "核心", en: "Kernel", category: "system", aliases: ["kernel", "內核"] },
  { term: "Process", zhTW: "程序", en: "Process", category: "system", aliases: ["process", "進程"] },
  { term: "Thread", zhTW: "執行緒", en: "Thread", category: "system", aliases: ["thread", "線程"] },
  { term: "Daemon", zhTW: "守護程序", en: "Daemon", category: "system", aliases: ["daemon", "服務"] },
  { term: "Cron", zhTW: "定時任務", en: "Cron Job", category: "system", aliases: ["cron", "排程"] },
  { term: "Log", zhTW: "日誌", en: "Log", category: "system", aliases: ["log", "日誌"] },
  { term: "Debug", zhTW: "除錯", en: "Debug", category: "programming", aliases: ["debug", "調試"] },
  { term: "Runtime", zhTW: "執行環境", en: "Runtime Environment", category: "system", aliases: ["runtime"] },
  { term: "Compile", zhTW: "編譯", en: "Compile", category: "programming", aliases: ["compile", "編譯"] },

  // 資料庫
  { term: "SQL", zhTW: "結構化查詢語言", en: "Structured Query Language", category: "database", aliases: ["sql"] },
  { term: "NoSQL", zhTW: "非關聯式資料庫", en: "Non-Relational Database", category: "database", aliases: ["nosql"] },
  { term: "ORM", zhTW: "物件關聯對映", en: "Object-Relational Mapping", category: "database", aliases: ["orm"] },
  { term: "Index", zhTW: "索引", en: "Index", category: "database", aliases: ["index", "索引"] },
  { term: "Schema", zhTW: "結構描述", en: "Schema", category: "database", aliases: ["schema", "綱要"] },
  { term: "Query", zhTW: "查詢", en: "Query", category: "database", aliases: ["query", "查詢"] },
  { term: "Transaction", zhTW: "交易", en: "Transaction", category: "database", aliases: ["transaction", "事務"] },
  { term: "Primary Key", zhTW: "主鍵", en: "Primary Key", category: "database", aliases: ["pk", "primary-key"] },
  { term: "Foreign Key", zhTW: "外鍵", en: "Foreign Key", category: "database", aliases: ["fk", "foreign-key"] },
  { term: "ACID", zhTW: "交易的四大特性", en: "Atomicity Consistency Isolation Durability", category: "database", aliases: ["acid"] },

  // 安全
  { term: "Encryption", zhTW: "加密", en: "Encryption", category: "security", aliases: ["encryption", "加密"] },
  { term: "Decryption", zhTW: "解密", en: "Decryption", category: "security", aliases: ["decryption", "解密"] },
  { term: "Hash", zhTW: "雜湊", en: "Hash", category: "security", aliases: ["hash", "哈希"] },
  { term: "OAuth", zhTW: "開放授權", en: "Open Authorization", category: "security", aliases: ["oauth"] },
  { term: "JWT", zhTW: "網頁權杖", en: "JSON Web Token", category: "security", aliases: ["jwt"] },
  { term: "SSL", zhTW: "安全套接層", en: "Secure Sockets Layer", category: "security", aliases: ["ssl"] },
  { term: "TLS", zhTW: "傳輸層安全性", en: "Transport Layer Security", category: "security", aliases: ["tls"] },
  { term: "XSS", zhTW: "跨站腳本攻擊", en: "Cross-Site Scripting", category: "security", aliases: ["xss"] },
  { term: "CSRF", zhTW: "跨站請求偽造", en: "Cross-Site Request Forgery", category: "security", aliases: ["csrf"] },
  { term: "SQL Injection", zhTW: "SQL 注入攻擊", en: "SQL Injection", category: "security", aliases: ["sql-injection", "注入"] },

  // AI/ML
  { term: "AI", zhTW: "人工智慧", en: "Artificial Intelligence", category: "ai", aliases: ["ai", "人工智能"] },
  { term: "ML", zhTW: "機器學習", en: "Machine Learning", category: "ai", aliases: ["ml", "machine-learning"] },
  { term: "DL", zhTW: "深度學習", en: "Deep Learning", category: "ai", aliases: ["dl", "deep-learning"] },
  { term: "NLP", zhTW: "自然語言處理", en: "Natural Language Processing", category: "ai", aliases: ["nlp"] },
  { term: "LLM", zhTW: "大型語言模型", en: "Large Language Model", category: "ai", aliases: ["llm"] },
  { term: "RAG", zhTW: "檢索增強生成", en: "Retrieval Augmented Generation", category: "ai", aliases: ["rag"] },
  { term: "Fine-tuning", zhTW: "微調", en: "Fine-tuning", category: "ai", aliases: ["finetuning", "微調"] },
  { term: "Prompt", zhTW: "提示詞", en: "Prompt", category: "ai", aliases: ["prompt", "提示"] },
  { term: "Embedding", zhTW: "向量嵌入", en: "Embedding", category: "ai", aliases: ["embedding", "嵌入"] },
  { term: "Vector DB", zhTW: "向量資料庫", en: "Vector Database", category: "ai", aliases: ["vector-database", "向量資料庫"] },

  // 雲端
  { term: "IaaS", zhTW: "基礎設施即服務", en: "Infrastructure as a Service", category: "cloud", aliases: ["iaas"] },
  { term: "PaaS", zhTW: "平台即服務", en: "Platform as a Service", category: "cloud", aliases: ["paas"] },
  { term: "SaaS", zhTW: "軟體即服務", en: "Software as a Service", category: "cloud", aliases: ["saas"] },
  { term: "VM", zhTW: "虛擬機", en: "Virtual Machine", category: "cloud", aliases: ["vm", "虛擬機器"] },
  { term: "S3", zhTW: "簡單儲存服務", en: "Simple Storage Service", category: "cloud", aliases: ["s3"] },
  { term: "Lambda", zhTW: "無伺服器函數", en: "Serverless Function", category: "cloud", aliases: ["lambda", "無伺服器"] },

  // Web
  { term: "HTML", zhTW: "超文字標記語言", en: "HyperText Markup Language", category: "web" },
  { term: "CSS", zhTW: "層疊樣式表", en: "Cascading Style Sheets", category: "web" },
  { term: "DOM", zhTW: "文件物件模型", en: "Document Object Model", category: "web" },
  { term: "SPA", zhTW: "單頁應用", en: "Single Page Application", category: "web" },
  { term: "SSR", zhTW: "伺服器端渲染", en: "Server-Side Rendering", category: "web" },
  { term: "CSR", zhTW: "客戶端渲染", en: "Client-Side Rendering", category: "web" },
  { term: "SEO", zhTW: "搜尋引擎優化", en: "Search Engine Optimization", category: "web" },
  { term: "Cookie", zhTW: "網頁cookie", en: "HTTP Cookie", category: "web" },
  { term: "Session", zhTW: "工作階段", en: "Session", category: "web" },
  { term: "Middleware", zhTW: "中介軟體", en: "Middleware", category: "programming" },
]

export class TechTermDictionary {
  private terms: Map<string, TechTerm> = new Map()
  private categories: Map<TermCategory, TechTerm[]> = new Map()

  constructor() {
    this.buildIndex()
  }

  private buildIndex(): void {
    for (const term of techTerms) {
      this.terms.set(term.term.toLowerCase(), term)
      this.terms.set(term.zhTW.toLowerCase(), term)

      if (term.aliases) {
        for (const alias of term.aliases) {
          this.terms.set(alias.toLowerCase(), term)
        }
      }

      if (!this.categories.has(term.category)) {
        this.categories.set(term.category, [])
      }
      this.categories.get(term.category)!.push(term)
    }
  }

  lookup(term: string): TechTerm | undefined {
    return this.terms.get(term.toLowerCase())
  }

  translate(term: string, targetLang: "zhTW" | "en"): string {
    const found = this.lookup(term)
    if (!found) return term
    return found[targetLang]
  }

  explain(term: string): string | null {
    const found = this.lookup(term)
    if (!found) return null
    return `${found.term} (${found.zhTW} / ${found.en})`
  }

  getByCategory(category: TermCategory): TechTerm[] {
    return this.categories.get(category) || []
  }

  search(query: string): TechTerm[] {
    const lower = query.toLowerCase()
    return techTerms.filter(t =>
      t.term.toLowerCase().includes(lower) ||
      t.zhTW.includes(query) ||
      t.en.toLowerCase().includes(lower) ||
      t.aliases?.some(a => a.toLowerCase().includes(lower))
    )
  }

  getAllCategories(): TermCategory[] {
    return Array.from(this.categories.keys())
  }

  formatBilingual(term: string): string {
    const found = this.lookup(term)
    if (!found) return term
    return `${found.zhTW} (${found.en}): ${found.term}`
  }

  formatAllBilingual(terms: string[]): string[] {
    return terms.map(t => this.formatBilingual(t))
  }
}

export const techDict = new TechTermDictionary()

export default TechTermDictionary
