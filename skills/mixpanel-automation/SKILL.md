---
name: mixpanel-automation
description: "Automate Mixpanel: events, funnels, cohorts, annotations, and JQL queries."
category: "App Automation via Composio — Analytics & Data"
composio: true
---

# Mixpanel Automation

Automate Mixpanel: events, funnels, cohorts, annotations, and JQL queries.

## When to Use This Skill

- When the user needs to automate Mixpanel operations
- When integrating Mixpanel into a workflow or pipeline
- When performing bulk operations on Mixpanel data

## Instructions

1. Verify Mixpanel API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Mixpanel
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Mixpanel API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Mixpanel plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
