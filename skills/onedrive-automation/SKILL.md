---
name: onedrive-automation
description: "Automate OneDrive: files, folders, search, sharing, permissions, and versioning."
category: "App Automation via Composio — Storage & Files"
composio: true
---

# Onedrive Automation

Automate OneDrive: files, folders, search, sharing, permissions, and versioning.

## When to Use This Skill

- When the user needs to automate Onedrive operations
- When integrating Onedrive into a workflow or pipeline
- When performing bulk operations on Onedrive data

## Instructions

1. Verify Onedrive API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Onedrive
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Onedrive API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Onedrive plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
