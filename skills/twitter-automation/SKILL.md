---
name: twitter-automation
description: "Automate Twitter/X: tweets, search, users, lists, and engagement."
category: "App Automation via Composio — Social Media"
composio: true
---

# Twitter Automation

Automate Twitter/X: tweets, search, users, lists, and engagement.

## When to Use This Skill

- When the user needs to automate Twitter operations
- When integrating Twitter into a workflow or pipeline
- When performing bulk operations on Twitter data

## Instructions

1. Verify Twitter API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Twitter
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Twitter API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Twitter plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
