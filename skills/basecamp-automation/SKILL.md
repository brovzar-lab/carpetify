---
name: basecamp-automation
description: "Automate Basecamp: to-do lists, messages, people, groups, and projects."
category: "App Automation via Composio — Project Management"
composio: true
---

# Basecamp Automation

Automate Basecamp: to-do lists, messages, people, groups, and projects.

## When to Use This Skill

- When the user needs to automate Basecamp operations
- When integrating Basecamp into a workflow or pipeline
- When performing bulk operations on Basecamp data

## Instructions

1. Verify Basecamp API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Basecamp
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Basecamp API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Basecamp plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
