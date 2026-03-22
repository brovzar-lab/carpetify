---
name: hubspot-automation
description: "Automate HubSpot CRM: contacts, deals, companies, tickets, and email engagement."
category: "App Automation via Composio — CRM & Sales"
composio: true
---

# Hubspot Automation

Automate HubSpot CRM: contacts, deals, companies, tickets, and email engagement.

## When to Use This Skill

- When the user needs to automate Hubspot operations
- When integrating Hubspot into a workflow or pipeline
- When performing bulk operations on Hubspot data

## Instructions

1. Verify Hubspot API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Hubspot
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Hubspot API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Hubspot plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
