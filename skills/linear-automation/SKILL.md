---
name: linear-automation
description: "Automate Linear: issues, projects, cycles, teams, and workflows."
category: "App Automation via Composio — Project Management"
composio: true
---

# Linear Automation

Automate Linear: issues, projects, cycles, teams, and workflows.

## When to Use This Skill

- When the user needs to automate Linear operations
- When integrating Linear into a workflow or pipeline
- When performing bulk operations on Linear data

## Instructions

1. Verify Linear API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Linear
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Linear API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Linear plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
