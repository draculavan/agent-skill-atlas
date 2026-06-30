export const SCHEMA_VERSION = "0.1.0";

export const DEFAULT_HIDDEN_PATTERNS = [
  ".git",
  "node_modules",
  "dist",
  "coverage",
  "auth",
  "credentials",
  "credential",
  "secrets",
  "secret",
  "tokens",
  "token",
  "sessions",
  "session",
  "logs",
  "log",
  "memory",
  "memories",
  "cache",
  ".env",
  ".env.*",
  "*.env",
  "*.sqlite",
  "*.sqlite3",
  "*.db",
  "*.pem",
  "*.key",
  "*.p12",
  "*.pfx"
];

export const DEFAULT_TAXONOMY = [
  {
    id: "routing-orchestration",
    label: "Routing & Orchestration",
    description: "Skill selection, agent routing, delegation, and workflow control.",
    keywords: ["route", "routing", "dispatch", "orchestration", "agent", "handoff", "workflow", "loop"]
  },
  {
    id: "software-engineering",
    label: "Software Engineering",
    description: "Coding, debugging, refactoring, testing, CI, and release engineering.",
    keywords: ["code", "coding", "debug", "test", "tests", "ci", "github", "pull request", "repo", "typescript", "python"]
  },
  {
    id: "product-design",
    label: "Product Design",
    description: "Product UX, UI, design systems, flows, prototypes, and critiques.",
    keywords: ["design", "figma", "prototype", "ui", "ux", "wireframe", "screen", "visual", "frontend"]
  },
  {
    id: "research-knowledge",
    label: "Research & Knowledge",
    description: "Research, knowledge capture, documentation search, and synthesis.",
    keywords: ["research", "knowledge", "notion", "search", "summarize", "synthesis", "brief", "context"]
  },
  {
    id: "docs-writing",
    label: "Docs & Writing",
    description: "Documents, plans, specs, editing, writing, and publishing drafts.",
    keywords: ["doc", "docs", "document", "writing", "spec", "readme", "copy", "draft", "editor"]
  },
  {
    id: "data-analysis",
    label: "Data & Analysis",
    description: "Spreadsheets, structured data, charts, extraction, and analysis.",
    keywords: ["data", "spreadsheet", "sheet", "csv", "chart", "analysis", "dataset", "table"]
  },
  {
    id: "automation-ops",
    label: "Automation & Ops",
    description: "Local automation, scripts, scheduled checks, system operations, and maintenance.",
    keywords: ["automation", "scheduled", "monitor", "ops", "maintenance", "health", "backup", "script"]
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "Connectors, APIs, plugins, MCP servers, and external app workflows.",
    keywords: ["api", "plugin", "connector", "mcp", "gmail", "calendar", "drive", "integration", "webhook"]
  },
  {
    id: "media-generation",
    label: "Media Generation",
    description: "Image, video, audio, presentation, PDF, and creative production workflows.",
    keywords: ["image", "video", "audio", "slides", "pdf", "render", "creative", "media", "hyperframes"]
  },
  {
    id: "project-management",
    label: "Project Management",
    description: "Planning, handoffs, milestones, checklists, and execution coordination.",
    keywords: ["plan", "planning", "project", "milestone", "status", "handoff", "checklist", "roadmap"]
  },
  {
    id: "quality-review",
    label: "Quality & Review",
    description: "Audits, reviews, verification, risk checks, and regression prevention.",
    keywords: ["review", "audit", "verify", "verification", "quality", "risk", "regression", "lint"]
  },
  {
    id: "business-strategy",
    label: "Business Strategy",
    description: "Positioning, launch, monetization, GTM, and commercial packaging.",
    keywords: ["business", "launch", "market", "monetization", "gtm", "positioning", "offer", "sales"]
  },
  {
    id: "personal-workflow",
    label: "Personal Workflow",
    description: "User-specific productivity, inbox, calendar, personal knowledge, and habits.",
    keywords: ["personal", "inbox", "calendar", "daily", "habit", "productivity", "assistant", "routine"]
  }
];

export const UNCATEGORIZED = {
  id: "uncategorized",
  label: "Uncategorized",
  description: "Skills that need manual category review.",
  keywords: []
};
