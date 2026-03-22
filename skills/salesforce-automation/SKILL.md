---
name: salesforce-automation
description: "Automate Salesforce: objects, records, SOQL queries, and bulk operations."
category: "App Automation via Composio — CRM & Sales"
composio: true
---

# Salesforce Automation

Automate Salesforce: objects, records, SOQL queries, and bulk operations.

## When to Use This Skill

- When the user needs to automate Salesforce operations
- When integrating Salesforce into a workflow or pipeline
- When performing bulk operations on Salesforce data

## Instructions

1. Verify Salesforce API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Salesforce
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Salesforce API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Salesforce plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
