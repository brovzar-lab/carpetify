---
name: pipedrive-automation
description: "Automate Pipedrive: deals, contacts, organizations, activities, and pipelines."
category: "App Automation via Composio — CRM & Sales"
composio: true
---

# Pipedrive Automation

Automate Pipedrive: deals, contacts, organizations, activities, and pipelines.

## When to Use This Skill

- When the user needs to automate Pipedrive operations
- When integrating Pipedrive into a workflow or pipeline
- When performing bulk operations on Pipedrive data

## Instructions

1. Verify Pipedrive API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Pipedrive
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Pipedrive API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Pipedrive plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
