---
name: gmail-automation
description: "Automate Gmail: send/reply, search, labels, drafts, and attachments."
category: "App Automation via Composio — Email"
composio: true
---

# Gmail Automation

Automate Gmail: send/reply, search, labels, drafts, and attachments.

## When to Use This Skill

- When the user needs to automate Gmail operations
- When integrating Gmail into a workflow or pipeline
- When performing bulk operations on Gmail data

## Instructions

1. Verify Gmail API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Gmail
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Gmail API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Gmail plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
