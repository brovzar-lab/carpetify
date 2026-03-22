---
name: canva-automation
description: "Automate Canva: designs, templates, assets, folders, and brand kits."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Canva Automation

Automate Canva: designs, templates, assets, folders, and brand kits.

## When to Use This Skill

- When the user needs to automate Canva operations
- When integrating Canva into a workflow or pipeline
- When performing bulk operations on Canva data

## Instructions

1. Verify Canva API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Canva
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Canva API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Canva plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
