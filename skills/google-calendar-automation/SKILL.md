---
name: google-calendar-automation
description: "Automate Google Calendar: events, attendees, free/busy, and recurring schedules."
category: "App Automation via Composio — Calendar & Scheduling"
composio: true
---

# Google Calendar Automation

Automate Google Calendar: events, attendees, free/busy, and recurring schedules.

## When to Use This Skill

- When the user needs to automate Google Calendar operations
- When integrating Google Calendar into a workflow or pipeline
- When performing bulk operations on Google Calendar data

## Instructions

1. Verify Google Calendar API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Google Calendar
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Google Calendar API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Google Calendar plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
