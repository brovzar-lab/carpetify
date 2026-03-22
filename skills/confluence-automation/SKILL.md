---
name: confluence-automation
description: "Automate Confluence: pages, spaces, search, CQL, labels, and versions."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Confluence Automation

Automate Confluence: pages, spaces, search, CQL, labels, and versions.

## When to Use This Skill

- When the user needs to automate Confluence operations
- When integrating Confluence into a workflow or pipeline
- When performing bulk operations on Confluence data

## Instructions

1. Verify Confluence API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Confluence
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Confluence API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Confluence plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
