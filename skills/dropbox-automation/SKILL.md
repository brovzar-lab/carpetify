---
name: dropbox-automation
description: "Automate Dropbox: files, folders, search, sharing, and batch operations."
category: "App Automation via Composio — Storage & Files"
composio: true
---

# Dropbox Automation

Automate Dropbox: files, folders, search, sharing, and batch operations.

## When to Use This Skill

- When the user needs to automate Dropbox operations
- When integrating Dropbox into a workflow or pipeline
- When performing bulk operations on Dropbox data

## Instructions

1. Verify Dropbox API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Dropbox
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Dropbox API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Dropbox plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
