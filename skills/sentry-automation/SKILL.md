---
name: sentry-automation
description: "Automate Sentry: issues, events, projects, releases, and alerts."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Sentry Automation

Automate Sentry: issues, events, projects, releases, and alerts.

## When to Use This Skill

- When the user needs to automate Sentry operations
- When integrating Sentry into a workflow or pipeline
- When performing bulk operations on Sentry data

## Instructions

1. Verify Sentry API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Sentry
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Sentry API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Sentry plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
