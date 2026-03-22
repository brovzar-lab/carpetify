---
name: figma-automation
description: "Automate Figma: files, components, comments, projects, and team management."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Figma Automation

Automate Figma: files, components, comments, projects, and team management.

## When to Use This Skill

- When the user needs to automate Figma operations
- When integrating Figma into a workflow or pipeline
- When performing bulk operations on Figma data

## Instructions

1. Verify Figma API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Figma
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Figma API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Figma plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
