---
name: convertkit-automation
description: "Automate ConvertKit (Kit): subscribers, tags, sequences, broadcasts, and forms."
category: "App Automation via Composio — Marketing & Email Marketing"
composio: true
---

# Convertkit Automation

Automate ConvertKit (Kit): subscribers, tags, sequences, broadcasts, and forms.

## When to Use This Skill

- When the user needs to automate Convertkit operations
- When integrating Convertkit into a workflow or pipeline
- When performing bulk operations on Convertkit data

## Instructions

1. Verify Convertkit API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Convertkit
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Convertkit API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Convertkit plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
