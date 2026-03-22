---
name: close-automation
description: "Automate Close CRM: leads, contacts, opportunities, activities, and pipelines."
category: "App Automation via Composio — CRM & Sales"
composio: true
---

# Close Automation

Automate Close CRM: leads, contacts, opportunities, activities, and pipelines.

## When to Use This Skill

- When the user needs to automate Close operations
- When integrating Close into a workflow or pipeline
- When performing bulk operations on Close data

## Instructions

1. Verify Close API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Close
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Close API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Close plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
