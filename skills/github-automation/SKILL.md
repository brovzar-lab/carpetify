---
name: github-automation
description: "Automate GitHub: issues, PRs, repos, branches, actions, and code search."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Github Automation

Automate GitHub: issues, PRs, repos, branches, actions, and code search.

## When to Use This Skill

- When the user needs to automate Github operations
- When integrating Github into a workflow or pipeline
- When performing bulk operations on Github data

## Instructions

1. Verify Github API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Github
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Github API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Github plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
