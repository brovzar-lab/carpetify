---
name: stripe-automation
description: "Automate Stripe: charges, customers, products, subscriptions, and refunds."
category: "App Automation via Composio — E-commerce & Payments"
composio: true
---

# Stripe Automation

Automate Stripe: charges, customers, products, subscriptions, and refunds.

## When to Use This Skill

- When the user needs to automate Stripe operations
- When integrating Stripe into a workflow or pipeline
- When performing bulk operations on Stripe data

## Instructions

1. Verify Stripe API credentials are configured in `.env`
2. Identify the specific operation requested (CRUD, search, bulk, etc.)
3. Use the Composio Rube MCP tool slugs for Stripe
4. Execute the operation with proper error handling
5. Return structured results and confirm completion

## Prerequisites

- Stripe API key or OAuth credentials in `.env`
- Composio Rube MCP server configured and running

## Known Pitfalls

- Rate limits vary by Stripe plan tier
- Bulk operations may require pagination
- OAuth tokens may need refresh for long-running operations
