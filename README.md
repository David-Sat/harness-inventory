# Harness Inventory

Structured, self-reported inventory of tools, interfaces, and capabilities exposed by AI agent harnesses (Claude Code, Antigravity, ChatGPT, Gemini, Codex, DeepSeek).

## Purpose

This repository stores raw, self-reported tool definitions captured from AI agents alongside a normalized, compiled manifest. The data is consumed dynamically at runtime by frontend presentation components on personal blog pages and research articles.

## Repository Layout

```text
harness-inventory/
├── README.md
├── package.json
├── manifest.json               # Compiled artifact consumed by frontend components
├── schema/
│   └── tool-inventory.schema.json
├── prompts/
│   ├── v1-open-ended.txt       # Legacy open-ended prompt
│   └── v2-tool-elicitation.txt # Standardized schema elicitation prompt
├── taxonomy/
│   ├── categories.json         # Canonical UI category definitions
│   └── tool-mappings.json      # Raw tool name to canonical category mapping
├── data/
│   ├── antigravity/
│   ├── chatgpt/
│   ├── claude-code/
│   ├── codex/
│   ├── deepseek/
│   └── gemini/
└── scripts/
    └── build-manifest.js       # Manifest builder script
```

## Data Consumption for Frontend Components

Frontend components fetch `manifest.json` directly from the raw GitHub endpoint:

```text
https://raw.githubusercontent.com/David-Sat/harness-inventory/main/manifest.json
```

### TypeScript Data Model

```typescript
export interface HarnessManifest {
  generated_at: string;
  categories: Category[];
  snapshots: Snapshot[];
}

export interface Category {
  id: string;          // e.g. "file_ops", "orchestration", "execution"
  name: string;        // e.g. "File Operations"
  description: string;
}

export interface Snapshot {
  id: string;                  // e.g. "2026-08-31_antigravity_gemini-3.7-flash_cold"
  harness: string;             // e.g. "antigravity", "claude-code", "chatgpt"
  model: string;               // e.g. "gemini-3.7-flash", "claude-opus-5", "gpt-5.6-luna"
  state: "cold" | "active" | "refusal"; // Execution context state
  date: string;                // YYYY-MM-DD
  file_path: string;           // Relative path to raw capture file
  harness_reported: string;    // Raw harness string reported by agent
  model_reported: string;      // Raw model string reported by agent
  tool_count_reported: number | null; // Agent self-reported count before listing
  tool_count_actual: number;   // Number of parsed tools in snapshot
  completeness: "complete" | "partial" | "unsure";
  omissions_note: string | null;
  category_counts: Record<string, number>; // Tool count per category id
  tools: NormalizedTool[];
}

export interface NormalizedTool {
  name: string;          // Raw verbatim tool name (e.g. "view_file", "Bash", "web.run")
  canonical: string;     // Standardized capability name (e.g. "read_file", "run_shell_command")
  category: string;      // Category ID matching Category.id
  description: string;   // Verbatim description from agent declaration
  parameters: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: string;          // Verbatim type string (e.g. "STRING", "string", "object", "ARRAY")
  required: boolean;
  enum: string[] | null;
  description: string;
}
```

### Key Field Semantics

- `tool_count_reported` vs `tool_count_actual`: A difference between these two fields indicates self-report inconsistency (for example, model estimated 40 tools but enumerated 54).
- `completeness`: Indicates if the agent acknowledged truncation, context limits, or omitted definitions.
- `state`:
  - `cold`: Fresh session baseline without preceding tool calls.
  - `active`: Captured after triggering intent or active tool use.
  - `refusal`: Captured when the harness policy refuses tool schema disclosure.
- `category_counts`: Pre-calculated tool distribution per category for quick charts, chips, and comparison matrices.

## Taxonomy and Categories

Tools are grouped using canonical categories defined in `taxonomy/categories.json`:

- `file_ops`: Reading, writing, editing, and finding files.
- `execution`: Shell execution, scripts, container sessions.
- `search`: Codebase indexing, grep, regex search.
- `web_browser`: Web search, fetching URL content, browser automation.
- `orchestration`: Subagent creation, delegation, agent messaging, task workflows.
- `scheduling_memory`: Timers, cron tasks, session wakeups, lifecycle hooks.
- `interaction`: User prompts, question modals, choice dialogues, setting controls.
- `external_mcp`: MCP tool calling, plugin search/installation, connected resource APIs.
- `generation`: Image generation, visual assets, artifact rendering.
- `other`: Specialized or unmapped tools.

### Tool Mapping Logic

1. Exact tool name match in `taxonomy/tool-mappings.json`.
2. Prefix heuristics in `scripts/build-manifest.js` (for example `mcp__Claude_Browser__*` -> `web_browser`).
3. Fallback: category is set to `other` and canonical name defaults to the raw tool name.

## Adding New Captures

1. Copy the elicitation prompt from `prompts/v2-tool-elicitation.txt`.
2. Send to target agent in a cold session.
3. Save the exact JSON response into:
   `data/<harness>/<YYYY-MM-DD>_<harness>_<model>_<state>.json`
4. If the capture contains new unmapped tools, add them to `taxonomy/tool-mappings.json`.
5. Compile `manifest.json`:
   ```bash
   npm run build
   ```
6. Commit and push changes to GitHub.

## Formatting Rules

- Raw capture files must preserve original casing and verbatim declarations.
