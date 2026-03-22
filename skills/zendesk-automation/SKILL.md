---
name: zendesk-automation
description: "Automate Zendesk: tickets, users, organizations, search, and macros."
category: "App Automation via Composio — Support & Helpdesk"
composio: true
---

# Zendesk Automation

Automate Zendesk: tickets, users, organizations, search, and macros.

## When to Use This Skill

- When the user needs to automate Zendesk operations
- When integrating Zendesk into a workflow or pipeline
- When performing bulk operations on Zendesk data

## Instructions

1. Verify Zendesk API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Zendesk
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Zendesk API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Zendesk plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
