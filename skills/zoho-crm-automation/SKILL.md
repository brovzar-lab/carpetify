---
name: zoho-crm-automation
description: "Automate Zoho CRM: leads, contacts, deals, accounts, and modules."
category: "App Automation via Composio — CRM & Sales"
composio: true
---

# Zoho Crm Automation

Automate Zoho CRM: leads, contacts, deals, accounts, and modules.

## When to Use This Skill

- When the user needs to automate Zoho Crm operations
- When integrating Zoho Crm into a workflow or pipeline
- When performing bulk operations on Zoho Crm data

## Instructions

1. Verify Zoho Crm API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Zoho Crm
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Zoho Crm API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Zoho Crm plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
