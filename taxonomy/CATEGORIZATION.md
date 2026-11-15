# Tool Categorization Guide

Use this schema when classifying new tools into `taxonomy/tool-mappings.json`.

## Schema

Each entry in `mappings` maps an exact tool name to:
```json
"tool_name": {
  "category": "<category_id>",
  "subcategory": "<subcategory_id>",
  "canonical": "<short_snake_case_name>"
}
```

## Categories & Subcategories

1. **`workspace_code`**
   - `file_ops`: read, write, edit, delete, list files/dirs, artifacts
   - `execution`: shell, terminal, bash, code/script execution
   - `search`: grep, glob, symbol/file search in local codebase
2. **`web_browser`**
   - `web_search`: web search, platform search
   - `web_fetch`: fetching/extracting URLs
   - `browser_automation`: clicking, navigating, screenshots, DOM interaction
3. **`agents_scheduling`**
   - `orchestration`: subagents, swarms, workflows, delegation, inter-agent messaging
   - `scheduling`: timers, cron jobs, background task status/kill
4. **`integrations`**
   - `connectors`: third-party MCPs and external services (Slack, GitHub, Linear, etc.)
   - `plugins`: plugin/skill/marketplace discovery and management
5. **`memory_interaction`**
   - `memory`: cross-session memory, user context, persistent notes
   - `interaction`: user question modals, decision prompts, settings
6. **`media_perception`**
   - `generation`: image, audio/TTS, chart, or UI widget generation
   - `perception`: viewing/inspecting images, video, or visual inputs

## Tie-Breaker Rules

- Classify by **purpose**, not by `mcp__` prefix (e.g., `mcp__Claude_Browser__navigate` → `web_browser / browser_automation`, not `integrations`).
- Only use `integrations / connectors` for external third-party services.
- If a tool spans multiple roles, pick its primary user-facing action.

## Prompt Template

> Classify the following unmapped tools into `taxonomy/tool-mappings.json` using `taxonomy/CATEGORIZATION.md`. Output valid JSON entries with `category`, `subcategory`, and `canonical`.
