---
name: make-automation
description: "Automate Make (Integromat): scenarios, connections, and execution management."
category: "App Automation via Composio — Automation Platforms"
composio: true
---

# Make Automation

Automate Make (Integromat): scenarios, connections, and execution management.

## When to Use This Skill

- When the user needs to automate Make operations
- When integrating Make into a workflow or pipeline
- When performing bulk operations on Make data

## Instructions

1. Verify Make API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Make
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Make API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Make plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
