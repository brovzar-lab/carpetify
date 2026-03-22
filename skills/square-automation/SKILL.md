---
name: square-automation
description: "Automate Square: payments, customers, catalog, orders, and locations."
category: "App Automation via Composio — E-commerce & Payments"
composio: true
---

# Square Automation

Automate Square: payments, customers, catalog, orders, and locations.

## When to Use This Skill

- When the user needs to automate Square operations
- When integrating Square into a workflow or pipeline
- When performing bulk operations on Square data

## Instructions

1. Verify Square API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Square
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Square API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Square plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
