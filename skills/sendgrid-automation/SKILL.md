---
name: sendgrid-automation
description: "Automate SendGrid: emails, templates, contacts, lists, and campaign stats."
category: "App Automation via Composio — Email"
composio: true
---

# Sendgrid Automation

Automate SendGrid: emails, templates, contacts, lists, and campaign stats.

## When to Use This Skill

- When the user needs to automate Sendgrid operations
- When integrating Sendgrid into a workflow or pipeline
- When performing bulk operations on Sendgrid data

## Instructions

1. Verify Sendgrid API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Sendgrid
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Sendgrid API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Sendgrid plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
