---
name: bamboohr-automation
description: "Automate BambooHR: employees, time off, reports, and directory management."
category: "App Automation via Composio — HR & People"
composio: true
---

# Bamboohr Automation

Automate BambooHR: employees, time off, reports, and directory management.

## When to Use This Skill

- When the user needs to automate Bamboohr operations
- When integrating Bamboohr into a workflow or pipeline
- When performing bulk operations on Bamboohr data

## Instructions

1. Verify Bamboohr API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Bamboohr
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Bamboohr API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Bamboohr plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
