---
name: brevo-automation
description: "Automate Brevo: contacts, email campaigns, transactional emails, and lists."
category: "App Automation via Composio — Marketing & Email Marketing"
composio: true
---

# Brevo Automation

Automate Brevo: contacts, email campaigns, transactional emails, and lists.

## When to Use This Skill

- When the user needs to automate Brevo operations
- When integrating Brevo into a workflow or pipeline
- When performing bulk operations on Brevo data

## Instructions

1. Verify Brevo API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Brevo
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Brevo API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Brevo plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
