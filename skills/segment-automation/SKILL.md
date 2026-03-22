---
name: segment-automation
description: "Automate Segment: sources, destinations, tracking, and warehouse connections."
category: "App Automation via Composio — Analytics & Data"
composio: true
---

# Segment Automation

Automate Segment: sources, destinations, tracking, and warehouse connections.

## When to Use This Skill

- When the user needs to automate Segment operations
- When integrating Segment into a workflow or pipeline
- When performing bulk operations on Segment data

## Instructions

1. Verify Segment API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Segment
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Segment API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Segment plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
