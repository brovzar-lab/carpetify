---
name: coda-automation
description: "Automate Coda: docs, tables, rows, formulas, and automations."
category: "App Automation via Composio — Spreadsheets & Databases"
composio: true
---

# Coda Automation

Automate Coda: docs, tables, rows, formulas, and automations.

## When to Use This Skill

- When the user needs to automate Coda operations
- When integrating Coda into a workflow or pipeline
- When performing bulk operations on Coda data

## Instructions

1. Verify Coda API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Coda
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Coda API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Coda plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
