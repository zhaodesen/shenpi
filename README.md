# CRM Approval Workflow Demo

A frontend demo of an end-to-end CRM contract approval process, from permissions and staff setup to multi-stage review and customer records.

[English](./README.md) | [简体中文](./README.zh-CN.md)

## Features

- Organization, group, role, and permission configuration
- Staff management with function-level access control
- Dynamic product application forms
- Contract applications for new or existing customers
- Finance-first review followed by configurable reviewers
- Applicant information-completion step between review stages
- Customer visibility rules for applicants, reviewers, managers, and administrators
- Built-in demo identities and resettable local data

## Tech Stack

Vue 3 · Vite 6 · Vue Router · Pinia · Element Plus · localStorage

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` unless Vite prints a different address.

## Approval Flow

```text
Submit application
  → finance review
  → applicant completes required information
  → sequential reviewer approval
  → customer and product enter the customer library
```

Finance approval and applicant completion must both be satisfied before the next reviewer can act.

## Main Routes

| Route | Module |
| --- | --- |
| `/org` | Organization and permissions |
| `/personnel` | Staff management |
| `/product-form` | Product application forms |
| `/apply-create` | New contract application |
| `/apply-list` | Application list and completion tasks |
| `/review` | Approval workspace |
| `/customer` | Customer library |

## Demo Data

Use the identity switcher in the top-right corner to experience sales, finance, reviewer, manager, and administrator perspectives. Data is stored in the browser and can be restored with **Reset demo data**.

## Project Structure

```text
src/
├── components/   # Dynamic forms and shared UI
├── constants/    # Permissions and statuses
├── layouts/      # Main application layout
├── mock/         # Demo seed data
├── router/       # Routes and permission guards
├── stores/       # Pinia business stores
└── views/        # Feature pages
```

## Scope

This is a frontend workflow demonstration. It uses local mock data and is not a production CRM backend.
