---
name: posthog-automation
description: "Automate PostHog: events, persons, feature flags, insights, and annotations."
category: "App Automation via Composio — Analytics & Data"
composio: true
---

# Posthog Automation

Automate PostHog: events, persons, feature flags, insights, and annotations.

## When to Use This Skill

- When the user needs to automate Posthog operations
- When integrating Posthog into a workflow or pipeline
- When performing bulk operations on Posthog data

## Instructions

1. Verify Posthog API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Posthog
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Posthog API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Posthog plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
