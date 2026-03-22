---
name: telegram-automation
description: "Automate Telegram: messages, chats, media, groups, and bots."
category: "App Automation via Composio — Communication"
composio: true
---

# Telegram Automation

Automate Telegram: messages, chats, media, groups, and bots.

## When to Use This Skill

- When the user needs to automate Telegram operations
- When integrating Telegram into a workflow or pipeline
- When performing bulk operations on Telegram data

## Instructions

1. Verify Telegram API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Telegram
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Telegram API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Telegram plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
