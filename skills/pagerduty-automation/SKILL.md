---
name: pagerduty-automation
description: "Automate PagerDuty: incidents, services, schedules, escalation policies, and on-call."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Pagerduty Automation

Automate PagerDuty: incidents, services, schedules, escalation policies, and on-call.

## When to Use This Skill

- When the user needs to automate Pagerduty operations
- When integrating Pagerduty into a workflow or pipeline
- When performing bulk operations on Pagerduty data

## Instructions

1. Verify Pagerduty API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Pagerduty
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Pagerduty API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Pagerduty plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
