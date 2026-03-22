---
name: notion-automation
description: "Automate Notion: pages, databases, blocks, comments, and search."
category: "App Automation via Composio — Project Management"
composio: true
---

# Notion Automation

Automate Notion: pages, databases, blocks, comments, and search.

## When to Use This Skill

- When the user needs to automate Notion operations
- When integrating Notion into a workflow or pipeline
- When performing bulk operations on Notion data

## Instructions

1. Verify Notion API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Notion
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Notion API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Notion plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
