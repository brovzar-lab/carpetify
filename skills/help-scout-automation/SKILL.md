---
name: help-scout-automation
description: "Automate Help Scout: conversations, customers, mailboxes, and tags."
category: "App Automation via Composio — Support & Helpdesk"
composio: true
---

# Help Scout Automation

Automate Help Scout: conversations, customers, mailboxes, and tags.

## When to Use This Skill

- When the user needs to automate Help Scout operations
- When integrating Help Scout into a workflow or pipeline
- When performing bulk operations on Help Scout data

## Instructions

1. Verify Help Scout API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Help Scout
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Help Scout API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Help Scout plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
