---
name: google-drive-automation
description: "Automate Google Drive: upload, download, search, share, and organize files."
category: "App Automation via Composio — Storage & Files"
composio: true
---

# Google Drive Automation

Automate Google Drive: upload, download, search, share, and organize files.

## When to Use This Skill

- When the user needs to automate Google Drive operations
- When integrating Google Drive into a workflow or pipeline
- When performing bulk operations on Google Drive data

## Instructions

1. Verify Google Drive API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Google Drive
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Google Drive API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Google Drive plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
