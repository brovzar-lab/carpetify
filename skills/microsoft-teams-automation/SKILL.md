---
name: microsoft-teams-automation
description: "Automate Teams: messages, channels, teams, chats, and meetings."
category: "App Automation via Composio — Communication"
composio: true
---

# Microsoft Teams Automation

Automate Teams: messages, channels, teams, chats, and meetings.

## When to Use This Skill

- When the user needs to automate Microsoft Teams operations
- When integrating Microsoft Teams into a workflow or pipeline
- When performing bulk operations on Microsoft Teams data

## Instructions

1. Verify Microsoft Teams API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Microsoft Teams
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Microsoft Teams API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Microsoft Teams plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
