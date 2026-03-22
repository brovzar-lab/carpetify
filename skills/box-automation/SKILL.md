---
name: box-automation
description: "Automate Box: files, folders, search, sharing, collaborations, and sign requests."
category: "App Automation via Composio — Storage & Files"
composio: true
---

# Box Automation

Automate Box: files, folders, search, sharing, collaborations, and sign requests.

## When to Use This Skill

- When the user needs to automate Box operations
- When integrating Box into a workflow or pipeline
- When performing bulk operations on Box data

## Instructions

1. Verify Box API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Box
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Box API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Box plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
