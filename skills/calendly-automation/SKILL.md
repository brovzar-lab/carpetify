---
name: calendly-automation
description: "Automate Calendly: events, invitees, event types, scheduling links, and availability."
category: "App Automation via Composio — Calendar & Scheduling"
composio: true
---

# Calendly Automation

Automate Calendly: events, invitees, event types, scheduling links, and availability.

## When to Use This Skill

- When the user needs to automate Calendly operations
- When integrating Calendly into a workflow or pipeline
- When performing bulk operations on Calendly data

## Instructions

1. Verify Calendly API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Calendly
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Calendly API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Calendly plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
