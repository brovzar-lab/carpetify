---
name: notebooklm-integration
description: "Connect to Google NotebookLM notebooks for source-grounded research. Query existing notebooks, create new ones, add sources, and get citation-backed answers with zero hallucination."
category: "Data & Analysis"
author: "@PleasePrompto"
---

# NotebookLM Integration

Query your Google NotebookLM projects as grounded data sources. All answers are backed by citations from your uploaded documents.

## When to Use This Skill

- When you need research grounded in specific documents (not general knowledge)
- When you want to query across multiple knowledge bases simultaneously
- When building research workflows that feed into reports, slides, or dossiers
- When you need citation-backed answers with page/section references

## Prerequisites

- `notebooklm-mcp-cli` installed (`uv tool install notebooklm-mcp-cli`)
- Authenticated: run `nlm login` in terminal (launches browser, extracts cookies)
- MCP server configured in `.cursor/mcp.json`

## Available Tools

### Via MCP (35 tools, natural language in Cursor)
- `notebook_list` / `notebook_create` / `notebook_delete`
- `source_add` (URL, YouTube, Drive, text, file)
- `notebook_query` — ask questions, get grounded answers
- `cross_notebook_query` — query across multiple notebooks
- `research_start` — initiate web/Drive research within a notebook
- `studio_create` — generate audio overviews, video, infographics, slides
- `download_artifact` — download generated content
- `notebook_share_*` — sharing and collaboration

### Via CLI (`nlm`)
```bash
nlm notebook list
nlm notebook create "Research: Topic"
nlm source add <id> --url "https://..."
nlm notebook query <id> "What are the key findings?"
nlm cross query "question" <id1> <id2>
nlm research start <id> --query "topic" --type web
nlm studio create <id> --type audio --format deep_dive
```

### Via Python (`execution/notebooklm_query.py`)
```bash
python execution/notebooklm_query.py list
python execution/notebooklm_query.py query <id> "question"
python execution/notebooklm_query.py cross-query "question" --notebooks id1 id2
python execution/notebooklm_query.py add-source <id> --url "https://..."
```

## Instructions

1. Authenticate if needed: `nlm login` (check with `nlm login --check`)
2. List notebooks to find the target: `nlm notebook list`
3. Query with specific, focused questions for best results
4. Use cross-notebook query when research spans multiple projects
5. Save results to `.tmp/` for downstream processing
6. Feed findings into other directives (reports, competitive analysis, etc.)

## Edge Cases & Learnings

- Auth cookies expire every 2-4 weeks — re-run `nlm login`
- Free tier: ~50 queries/day — batch questions when possible
- Sources need ~30s to index after being added
- MCP adds 35 tools to context — disable when not using NotebookLM
- Uses undocumented internal APIs — may break without notice
- Queries persist in your NotebookLM web UI chat history
