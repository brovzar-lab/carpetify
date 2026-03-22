---
name: clickup-automation
description: "Automate ClickUp: tasks, lists, spaces, goals, and time tracking."
category: "App Automation via Composio — Project Management"
composio: true
---

# Clickup Automation

Automate ClickUp: tasks, lists, spaces, goals, and time tracking.

## When to Use This Skill

- When the user needs to automate Clickup operations
- When integrating Clickup into a workflow or pipeline
- When performing bulk operations on Clickup data

## Instructions

1. Verify Clickup API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Clickup
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Clickup API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Clickup plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
