---
name: circleci-automation
description: "Automate CircleCI: pipelines, workflows, jobs, and project configuration."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Circleci Automation

Automate CircleCI: pipelines, workflows, jobs, and project configuration.

## When to Use This Skill

- When the user needs to automate Circleci operations
- When integrating Circleci into a workflow or pipeline
- When performing bulk operations on Circleci data

## Instructions

1. Verify Circleci API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Circleci
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Circleci API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Circleci plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
