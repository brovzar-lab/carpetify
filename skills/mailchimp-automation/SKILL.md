---
name: mailchimp-automation
description: "Automate Mailchimp: audiences, campaigns, templates, segments, and reports."
category: "App Automation via Composio — Marketing & Email Marketing"
composio: true
---

# Mailchimp Automation

Automate Mailchimp: audiences, campaigns, templates, segments, and reports.

## When to Use This Skill

- When the user needs to automate Mailchimp operations
- When integrating Mailchimp into a workflow or pipeline
- When performing bulk operations on Mailchimp data

## Instructions

1. Verify Mailchimp API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Mailchimp
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Mailchimp API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Mailchimp plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
