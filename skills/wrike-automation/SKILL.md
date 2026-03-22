---
name: wrike-automation
description: "Automate Wrike: tasks, folders, projects, comments, and workflows."
category: "App Automation via Composio — Project Management"
composio: true
---

# Wrike Automation

Automate Wrike: tasks, folders, projects, comments, and workflows.

## When to Use This Skill

- When the user needs to automate Wrike operations
- When integrating Wrike into a workflow or pipeline
- When performing bulk operations on Wrike data

## Instructions

1. Verify Wrike API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Wrike
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Wrike API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Wrike plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
