---
name: trello-automation
description: "Automate Trello: boards, cards, lists, members, and checklists."
category: "App Automation via Composio — Project Management"
composio: true
---

# Trello Automation

Automate Trello: boards, cards, lists, members, and checklists.

## When to Use This Skill

- When the user needs to automate Trello operations
- When integrating Trello into a workflow or pipeline
- When performing bulk operations on Trello data

## Instructions

1. Verify Trello API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Trello
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Trello API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Trello plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
