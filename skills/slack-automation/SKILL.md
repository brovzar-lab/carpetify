---
name: slack-automation
description: "Automate Slack: messages, channels, search, reactions, threads, and scheduling."
category: "App Automation via Composio — Communication"
composio: true
---

# Slack Automation

Automate Slack: messages, channels, search, reactions, threads, and scheduling.

## When to Use This Skill

- When the user needs to automate Slack operations
- When integrating Slack into a workflow or pipeline
- When performing bulk operations on Slack data

## Instructions

1. Verify Slack API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Slack
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Slack API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Slack plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
