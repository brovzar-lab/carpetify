---
name: intercom-automation
description: "Automate Intercom: conversations, contacts, companies, tickets, and articles."
category: "App Automation via Composio — Communication"
composio: true
---

# Intercom Automation

Automate Intercom: conversations, contacts, companies, tickets, and articles.

## When to Use This Skill

- When the user needs to automate Intercom operations
- When integrating Intercom into a workflow or pipeline
- When performing bulk operations on Intercom data

## Instructions

1. Verify Intercom API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Intercom
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Intercom API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Intercom plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
