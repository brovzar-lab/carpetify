---
name: freshdesk-automation
description: "Automate Freshdesk: tickets, contacts, agents, groups, and canned responses."
category: "App Automation via Composio — Support & Helpdesk"
composio: true
---

# Freshdesk Automation

Automate Freshdesk: tickets, contacts, agents, groups, and canned responses.

## When to Use This Skill

- When the user needs to automate Freshdesk operations
- When integrating Freshdesk into a workflow or pipeline
- When performing bulk operations on Freshdesk data

## Instructions

1. Verify Freshdesk API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Freshdesk
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Freshdesk API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Freshdesk plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
