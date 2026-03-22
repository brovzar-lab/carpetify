---
name: tiktok-automation
description: "Automate TikTok: video uploads, queries, and creator management."
category: "App Automation via Composio — Social Media"
composio: true
---

# Tiktok Automation

Automate TikTok: video uploads, queries, and creator management.

## When to Use This Skill

- When the user needs to automate Tiktok operations
- When integrating Tiktok into a workflow or pipeline
- When performing bulk operations on Tiktok data

## Instructions

1. Verify Tiktok API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Tiktok
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Tiktok API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Tiktok plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
