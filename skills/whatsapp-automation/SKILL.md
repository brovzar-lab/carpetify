---
name: whatsapp-automation
description: "Automate WhatsApp: messages, media, templates, groups, and business profiles."
category: "App Automation via Composio — Communication"
composio: true
---

# Whatsapp Automation

Automate WhatsApp: messages, media, templates, groups, and business profiles.

## When to Use This Skill

- When the user needs to automate Whatsapp operations
- When integrating Whatsapp into a workflow or pipeline
- When performing bulk operations on Whatsapp data

## Instructions

1. Verify Whatsapp API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Whatsapp
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Whatsapp API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Whatsapp plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
