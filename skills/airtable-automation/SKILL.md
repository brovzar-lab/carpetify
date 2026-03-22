---
name: airtable-automation
description: "Automate Airtable: records, tables, bases, views, and field management."
category: "App Automation via Composio — Spreadsheets & Databases"
composio: true
---

# Airtable Automation

Automate Airtable: records, tables, bases, views, and field management.

## When to Use This Skill

- When the user needs to automate Airtable operations
- When integrating Airtable into a workflow or pipeline
- When performing bulk operations on Airtable data

## Instructions

1. Verify Airtable API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Airtable
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Airtable API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Airtable plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
