---
name: monday-automation
description: "Automate Monday.com: boards, items, columns, groups, and workspaces."
category: "App Automation via Composio — Project Management"
composio: true
---

# Monday Automation

Automate Monday.com: boards, items, columns, groups, and workspaces.

## When to Use This Skill

- When the user needs to automate Monday operations
- When integrating Monday into a workflow or pipeline
- When performing bulk operations on Monday data

## Instructions

1. Verify Monday API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Monday
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Monday API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Monday plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
