---
name: instagram-automation
description: "Automate Instagram: posts, stories, comments, media, and business insights."
category: "App Automation via Composio — Social Media"
composio: true
---

# Instagram Automation

Automate Instagram: posts, stories, comments, media, and business insights.

## When to Use This Skill

- When the user needs to automate Instagram operations
- When integrating Instagram into a workflow or pipeline
- When performing bulk operations on Instagram data

## Instructions

1. Verify Instagram API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Instagram
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Instagram API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Instagram plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
