---
name: asana-automation
description: "Automate Asana: tasks, projects, sections, assignments, and workspaces."
category: "App Automation via Composio — Project Management"
composio: true
---

# Asana Automation

Automate Asana: tasks, projects, sections, assignments, and workspaces.

## When to Use This Skill

- When the user needs to automate Asana operations
- When integrating Asana into a workflow or pipeline
- When performing bulk operations on Asana data

## Instructions

1. Verify Asana API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Asana
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Asana API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Asana plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
