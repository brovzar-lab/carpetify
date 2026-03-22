---
name: vercel-automation
description: "Automate Vercel: deployments, projects, domains, environment variables, and logs."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Vercel Automation

Automate Vercel: deployments, projects, domains, environment variables, and logs.

## When to Use This Skill

- When the user needs to automate Vercel operations
- When integrating Vercel into a workflow or pipeline
- When performing bulk operations on Vercel data

## Instructions

1. Verify Vercel API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Vercel
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Vercel API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Vercel plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
