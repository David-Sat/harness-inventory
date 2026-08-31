# Harness Inventory

Structured, self-reported inventory of tools, interfaces, and capabilities exposed by different AI agent harnesses.

## Goals

1. Capture tool surfaces and runtime capabilities directly as reported by agents.
2. Maintain historical snapshots over time as harnesses evolve.
3. Power an interactive comparison component on personal blog pages via dynamic data fetching.

## Directory Structure

```text
harness-inventory/
├── README.md
├── manifest.json               # Compiled manifest fetched by blog component
├── schema/
│   └── tool-inventory.schema.json
├── prompts/
│   ├── v1-open-ended.txt
│   └── v2-tool-elicitation.txt
├── taxonomy/
│   ├── categories.json         # Canonical category taxonomy
│   └── tool-mappings.json      # Mapping raw tool names to categories
├── data/
│   ├── antigravity/
│   ├── chatgpt/
│   ├── claude-code/
│   ├── codex/
│   ├── deepseek/
│   └── gemini/
└── scripts/
    └── build-manifest.js       # Ingests data/ and taxonomy/ to generate manifest.json
```

## Data Lifecycle

1. Send standardized prompt from `prompts/` to target harness.
2. Save exact, unedited JSON output to `data/<harness>/<YYYY-MM-DD>_<harness>_<model>_<state>.json`.
3. Update `taxonomy/tool-mappings.json` if new tools need canonical mapping.
4. Run `node scripts/build-manifest.js` to compile `manifest.json`.
5. Commit and push.

## Snapshot Naming Convention

`YYYY-MM-DD_<harness>_<model>_<state>.json`

- `harness`: `antigravity`, `claude-code`, `codex`, `deepseek`, `gemini`, `chatgpt`
- `model`: sanitized model identifier (for example `claude-3-7-sonnet`, `gemini-3.7-flash`, `gpt-4o`)
- `state`: execution context state (`cold` for fresh session, `active` for warm/triggered context)
