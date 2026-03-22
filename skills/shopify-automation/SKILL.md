---
name: shopify-automation
description: "Automate Shopify: products, orders, customers, inventory, and GraphQL queries."
category: "App Automation via Composio — E-commerce & Payments"
composio: true
---

# Shopify Automation

Automate Shopify: products, orders, customers, inventory, and GraphQL queries.

## When to Use This Skill

- When the user needs to automate Shopify operations
- When integrating Shopify into a workflow or pipeline
- When performing bulk operations on Shopify data

## Instructions

1. Verify Shopify API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Shopify
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Shopify API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Shopify plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
