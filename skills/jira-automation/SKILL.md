---
name: jira-automation
description: "Automate Jira: issues, projects, boards, sprints, and JQL queries."
category: "App Automation via Composio — Project Management"
composio: true
---

# Jira Automation

Automate Jira: issues, projects, boards, sprints, and JQL queries.

## When to Use This Skill

- When the user needs to automate Jira operations
- When integrating Jira into a workflow or pipeline
- When performing bulk operations on Jira data

## Instructions

1. Verify Jira API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Jira
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Jira API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Jira plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
