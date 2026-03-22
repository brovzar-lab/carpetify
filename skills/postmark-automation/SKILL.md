---
name: postmark-automation
description: "Automate Postmark: transactional emails, templates, servers, and delivery stats."
category: "App Automation via Composio — Email"
composio: true
---

# Postmark Automation

Automate Postmark: transactional emails, templates, servers, and delivery stats.

## When to Use This Skill

- When the user needs to automate Postmark operations
- When integrating Postmark into a workflow or pipeline
- When performing bulk operations on Postmark data

## Instructions

1. Verify Postmark API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Postmark
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Postmark API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Postmark plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
