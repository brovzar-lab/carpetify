---
name: datadog-automation
description: "Automate Datadog: monitors, dashboards, metrics, incidents, and alerts."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Datadog Automation

Automate Datadog: monitors, dashboards, metrics, incidents, and alerts.

## When to Use This Skill

- When the user needs to automate Datadog operations
- When integrating Datadog into a workflow or pipeline
- When performing bulk operations on Datadog data

## Instructions

1. Verify Datadog API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Datadog
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Datadog API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Datadog plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
