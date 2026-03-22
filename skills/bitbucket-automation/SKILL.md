---
name: bitbucket-automation
description: "Automate Bitbucket: repos, PRs, branches, issues, and workspaces."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Bitbucket Automation

Automate Bitbucket: repos, PRs, branches, issues, and workspaces.

## When to Use This Skill

- When the user needs to automate Bitbucket operations
- When integrating Bitbucket into a workflow or pipeline
- When performing bulk operations on Bitbucket data

## Instructions

1. Verify Bitbucket API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Bitbucket
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Bitbucket API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Bitbucket plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
