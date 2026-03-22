---
name: google-sheets-automation
description: "Automate Google Sheets: read/write cells, formatting, formulas, and batch operations."
category: "App Automation via Composio — Spreadsheets & Databases"
composio: true
---

# Google Sheets Automation

Automate Google Sheets: read/write cells, formatting, formulas, and batch operations.

## When to Use This Skill

- When the user needs to automate Google Sheets operations
- When integrating Google Sheets into a workflow or pipeline
- When performing bulk operations on Google Sheets data

## Instructions

1. Verify Google Sheets API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Google Sheets
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Google Sheets API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Google Sheets plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
