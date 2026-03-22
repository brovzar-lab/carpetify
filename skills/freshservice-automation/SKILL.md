---
name: freshservice-automation
description: "Automate Freshservice: tickets, assets, changes, problems, and service catalog."
category: "App Automation via Composio — Support & Helpdesk"
composio: true
---

# Freshservice Automation

Automate Freshservice: tickets, assets, changes, problems, and service catalog.

## When to Use This Skill

- When the user needs to automate Freshservice operations
- When integrating Freshservice into a workflow or pipeline
- When performing bulk operations on Freshservice data

## Instructions

1. Verify Freshservice API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Freshservice
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Freshservice API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Freshservice plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
