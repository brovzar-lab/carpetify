---
name: discord-automation
description: "Automate Discord: messages, channels, servers, roles, and reactions."
category: "App Automation via Composio — Communication"
composio: true
---

# Discord Automation

Automate Discord: messages, channels, servers, roles, and reactions.

## When to Use This Skill

- When the user needs to automate Discord operations
- When integrating Discord into a workflow or pipeline
- When performing bulk operations on Discord data

## Instructions

1. Verify Discord API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Discord
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Discord API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Discord plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
