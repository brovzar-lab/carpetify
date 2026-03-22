---
name: youtube-automation
description: "Automate YouTube: videos, channels, playlists, comments, and subscriptions."
category: "App Automation via Composio — Social Media"
composio: true
---

# Youtube Automation

Automate YouTube: videos, channels, playlists, comments, and subscriptions.

## When to Use This Skill

- When the user needs to automate Youtube operations
- When integrating Youtube into a workflow or pipeline
- When performing bulk operations on Youtube data

## Instructions

1. Verify Youtube API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Youtube
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Youtube API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Youtube plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
