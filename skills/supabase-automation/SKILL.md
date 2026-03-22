---
name: supabase-automation
description: "Automate Supabase: SQL queries, table schemas, edge functions, and storage."
category: "App Automation via Composio — Code & DevOps"
composio: true
---

# Supabase Automation

Automate Supabase: SQL queries, table schemas, edge functions, and storage.

## When to Use This Skill

- When the user needs to automate Supabase operations
- When integrating Supabase into a workflow or pipeline
- When performing bulk operations on Supabase data

## Instructions

1. Verify Supabase API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Supabase
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Supabase API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Supabase plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
