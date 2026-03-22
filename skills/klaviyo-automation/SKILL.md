---
name: klaviyo-automation
description: "Automate Klaviyo: profiles, lists, segments, campaigns, and events."
category: "App Automation via Composio — Marketing & Email Marketing"
composio: true
---

# Klaviyo Automation

Automate Klaviyo: profiles, lists, segments, campaigns, and events.

## When to Use This Skill

- When the user needs to automate Klaviyo operations
- When integrating Klaviyo into a workflow or pipeline
- When performing bulk operations on Klaviyo data

## Instructions

1. Verify Klaviyo API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Klaviyo
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Klaviyo API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Klaviyo plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
