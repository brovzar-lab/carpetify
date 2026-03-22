---
name: webflow-automation
description: "Automate Webflow: CMS collections, items, sites, publishing, and assets."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Webflow Automation

Automate Webflow: CMS collections, items, sites, publishing, and assets.

## When to Use This Skill

- When the user needs to automate Webflow operations
- When integrating Webflow into a workflow or pipeline
- When performing bulk operations on Webflow data

## Instructions

1. Verify Webflow API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Webflow
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Webflow API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Webflow plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
