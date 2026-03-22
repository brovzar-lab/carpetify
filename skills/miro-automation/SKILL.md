---
name: miro-automation
description: "Automate Miro: boards, sticky notes, shapes, connectors, and items."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Miro Automation

Automate Miro: boards, sticky notes, shapes, connectors, and items.

## When to Use This Skill

- When the user needs to automate Miro operations
- When integrating Miro into a workflow or pipeline
- When performing bulk operations on Miro data

## Instructions

1. Verify Miro API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Miro
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Miro API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Miro plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
