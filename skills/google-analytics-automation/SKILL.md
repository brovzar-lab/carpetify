---
name: google-analytics-automation
description: "Automate Google Analytics: reports, dimensions, metrics, and property management."
category: "App Automation via Composio — Analytics & Data"
composio: true
---

# Google Analytics Automation

Automate Google Analytics: reports, dimensions, metrics, and property management.

## When to Use This Skill

- When the user needs to automate Google Analytics operations
- When integrating Google Analytics into a workflow or pipeline
- When performing bulk operations on Google Analytics data

## Instructions

1. Verify Google Analytics API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Google Analytics
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Google Analytics API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Google Analytics plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
