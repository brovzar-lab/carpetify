---
name: outlook-automation
description: "Automate Outlook: emails, folders, contacts, and calendar integration."
category: "App Automation via Composio — Email"
composio: true
---

# Outlook Automation

Automate Outlook: emails, folders, contacts, and calendar integration.

## When to Use This Skill

- When the user needs to automate Outlook operations
- When integrating Outlook into a workflow or pipeline
- When performing bulk operations on Outlook data

## Instructions

1. Verify Outlook API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Outlook
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Outlook API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Outlook plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
