---
name: linkedin-automation
description: "Automate LinkedIn: posts, profiles, companies, images, and comments."
category: "App Automation via Composio — Social Media"
composio: true
---

# Linkedin Automation

Automate LinkedIn: posts, profiles, companies, images, and comments.

## When to Use This Skill

- When the user needs to automate Linkedin operations
- When integrating Linkedin into a workflow or pipeline
- When performing bulk operations on Linkedin data

## Instructions

1. Verify Linkedin API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Linkedin
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Linkedin API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Linkedin plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
