---
name: zoom-automation
description: "Automate Zoom: meetings, recordings, participants, webinars, and reports."
category: "App Automation via Composio — Zoom & Meetings"
composio: true
---

# Zoom Automation

Automate Zoom: meetings, recordings, participants, webinars, and reports.

## When to Use This Skill

- When the user needs to automate Zoom operations
- When integrating Zoom into a workflow or pipeline
- When performing bulk operations on Zoom data

## Instructions

1. Verify Zoom API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Zoom
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Zoom API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Zoom plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
