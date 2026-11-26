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
   - `file_ops`: read, write, edit, delete, list local files/dirs
   - `execution`: shell, terminal, bash, code/script execution
   - `search`: grep, glob, symbol/file search in local codebase
2. **`web_browser`**
   - `web_search`: general web search, platform/social search
   - `web_fetch`: fetching/extracting URLs
   - `browser_automation`: clicking, navigating, screenshots, DOM interaction
3. **`domain_data`**
   - `finance`: financial market quotes, fundamentals, earnings, macro indicators, filings
   - `live_data`: structured vertical lookups (weather, sports, places/maps search, election results)
4. **`ui_artifacts`**
   - `ui_widgets`: inline interactive UI cards, charts, maps, quizzes, generative HTML/SVG widgets
   - `artifacts_docs`: hosted artifacts and first-party document editors/stores
5. **`agents_scheduling`**
   - `orchestration`: subagents, swarms, workflows, delegation, inter-agent messaging
   - `scheduling`: timers, cron jobs, background task status/kill
   - `session_mgmt`: session CRUD, transcripts, history, archive/delete/export
6. **`integrations`**
   - `connectors`: third-party MCPs and external services (Slack, GitHub, Linear, etc.)
   - `plugins`: plugin/skill/marketplace discovery and management
7. **`memory_interaction`**
   - `memory`: cross-session memory, user context, persistent notes/watchlists
   - `interaction`: user question modals, confirmations, decision prompts, settings
   - `ui_control`: desktop/IDE sidebar, pane, and window layout control
8. **`media_perception`**
   - `generation`: image, video, and audio/TTS generation
   - `perception`: viewing/inspecting images, video, screenshots, or visual inputs

## Tie-Breaker Rules

- Classify by **purpose**, not by `mcp__` prefix (e.g., `mcp__Claude_Browser__navigate` → `web_browser / browser_automation`, not `integrations`).
- Only use `integrations / connectors` for external third-party services.
- Separate general web search (`web_browser / web_search`) from structured vertical data APIs (`domain_data`).
- Separate pure media generation (`media_perception / generation`) from interactive UI cards/widgets (`ui_artifacts / ui_widgets`).
- If a tool spans multiple roles, pick its primary user-facing action.

## Prompt Template

> Classify the following unmapped tools into `taxonomy/tool-mappings.json` using `taxonomy/CATEGORIZATION.md`. Output valid JSON entries with `category`, `subcategory`, and `canonical`.
