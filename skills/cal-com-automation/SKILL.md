---
name: cal-com-automation
description: "Automate Cal.com: event types, bookings, availability, and scheduling."
category: "App Automation via Composio — Calendar & Scheduling"
composio: true
---

# Cal Com Automation

Automate Cal.com: event types, bookings, availability, and scheduling.

## When to Use This Skill

- When the user needs to automate Cal Com operations
- When integrating Cal Com into a workflow or pipeline
- When performing bulk operations on Cal Com data

## Instructions

1. Verify Cal Com API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Cal Com
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Cal Com API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Cal Com plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
