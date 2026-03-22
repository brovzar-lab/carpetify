---
name: gitlab-automation
description: "Automate GitLab: issues, MRs, projects, pipelines, and branches."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Gitlab Automation

Automate GitLab: issues, MRs, projects, pipelines, and branches.

## When to Use This Skill

- When the user needs to automate Gitlab operations
- When integrating Gitlab into a workflow or pipeline
- When performing bulk operations on Gitlab data

## Instructions

1. Verify Gitlab API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Gitlab
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Gitlab API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Gitlab plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
