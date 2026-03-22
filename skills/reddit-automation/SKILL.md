---
name: reddit-automation
description: "Automate Reddit: posts, comments, subreddits, voting, and moderation."
category: "App Automation via Composio — Social Media"
composio: true
---

# Reddit Automation

Automate Reddit: posts, comments, subreddits, voting, and moderation.

## When to Use This Skill

- When the user needs to automate Reddit operations
- When integrating Reddit into a workflow or pipeline
- When performing bulk operations on Reddit data

## Instructions

1. Verify Reddit API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Reddit
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Reddit API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Reddit plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
