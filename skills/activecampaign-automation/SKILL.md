---
name: activecampaign-automation
description: "Automate ActiveCampaign: contacts, deals, campaigns, lists, and automations."
category: "App Automation via Composio — Marketing & Email Marketing"
composio: true
---

# Activecampaign Automation

Automate ActiveCampaign: contacts, deals, campaigns, lists, and automations.

## When to Use This Skill

- When the user needs to automate Activecampaign operations
- When integrating Activecampaign into a workflow or pipeline
- When performing bulk operations on Activecampaign data

## Instructions

1. Verify Activecampaign API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Activecampaign
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Activecampaign API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Activecampaign plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
