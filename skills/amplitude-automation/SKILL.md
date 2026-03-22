---
name: amplitude-automation
description: "Automate Amplitude: events, cohorts, user properties, and analytics queries."
category: "App Automation via Composio — Analytics & Data"
composio: true
---

# Amplitude Automation

Automate Amplitude: events, cohorts, user properties, and analytics queries.

## When to Use This Skill

- When the user needs to automate Amplitude operations
- When integrating Amplitude into a workflow or pipeline
- When performing bulk operations on Amplitude data

## Instructions

1. Verify Amplitude API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Amplitude
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Amplitude API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Amplitude plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
