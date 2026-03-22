---
name: todoist-automation
description: "Automate Todoist: tasks, projects, sections, labels, and filters."
category: "App Automation via Composio — Project Management"
composio: true
---

# Todoist Automation

Automate Todoist: tasks, projects, sections, labels, and filters.

## When to Use This Skill

- When the user needs to automate Todoist operations
- When integrating Todoist into a workflow or pipeline
- When performing bulk operations on Todoist data

## Instructions

1. Verify Todoist API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Todoist
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Todoist API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Todoist plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
