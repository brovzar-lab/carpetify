---
name: docusign-automation
description: "Automate DocuSign: envelopes, templates, signing, and document management."
category: "App Automation via Composio — Design & Collaboration"
composio: true
---

# Docusign Automation

Automate DocuSign: envelopes, templates, signing, and document management.

## When to Use This Skill

- When the user needs to automate Docusign operations
- When integrating Docusign into a workflow or pipeline
- When performing bulk operations on Docusign data

## Instructions

1. Verify Docusign API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Docusign
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Docusign API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Docusign plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
