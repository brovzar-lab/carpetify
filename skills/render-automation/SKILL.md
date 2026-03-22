---
name: render-automation
description: "Automate Render: services, deploys, and project management."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Render Automation

Automate Render: services, deploys, and project management.

## When to Use This Skill

- When the user needs to automate Render operations
- When integrating Render into a workflow or pipeline
- When performing bulk operations on Render data

## Instructions

1. Verify Render API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Render
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Render API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Render plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
