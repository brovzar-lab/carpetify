---
name: outlook-calendar-automation
description: "Automate Outlook Calendar: events, attendees, reminders, and recurring schedules."
category: "App Automation via Composio — Calendar & Scheduling"
composio: true
---

# Outlook Calendar Automation

Automate Outlook Calendar: events, attendees, reminders, and recurring schedules.

## When to Use This Skill

- When the user needs to automate Outlook Calendar operations
- When integrating Outlook Calendar into a workflow or pipeline
- When performing bulk operations on Outlook Calendar data

## Instructions

1. Verify Outlook Calendar API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Outlook Calendar
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Outlook Calendar API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Outlook Calendar plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
