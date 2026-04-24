# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Zerowaste is a Spanish-language family meal planning app that helps users plan meals, reduce food waste, and save money. It uses AI-powered features for receipt processing, meal planning, and waste reduction recommendations.

## Commands

```bash
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript validation
pnpm db:setup     # Initialize database schema (runs scripts/setup-db.ts)
```

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router, React 19, TypeScript
- **Database**: Supabase (PostgreSQL) with RLS policies
- **AI**: OpenAI GPT-4o with vision capabilities via Vercel AI SDK
- **UI**: Tailwind CSS + Shadcn/ui components (Radix-based)
- **Forms**: react-hook-form with zod validation
- **Package Manager**: pnpm

## Architecture

```
app/
├── actions.ts          # Server Actions - entry point for all mutations
├── api/generate/       # OpenAI text generation endpoint
├── (routes)/           # Page routes (menu-semanal, receta, configuracion, etc.)
└── layout.tsx          # Root layout with Inter font

components/
├── ui/                 # Shadcn/ui primitives (50+ components)
├── welcome-screen.tsx  # Home page with quick access grid
├── menu-semanal.tsx    # Weekly menu with BottomNavigation
├── detalle-receta.tsx  # Full recipe view with ingredients/steps
└── onboarding-familiar.tsx  # Family setup wizard

lib/
├── openai.ts           # AI functions: processReceiptImage, generateWeeklyMenu, etc.
├── supabase.ts         # Client factories (server/client separation)
└── utils.ts            # Helpers (cn for classnames)

services/
└── supabase-service.ts # All database CRUD operations with transactions
```

## Data Flow

1. **UI Components** → trigger server actions via form submissions or events
2. **Server Actions** (app/actions.ts) → orchestrate AI and database calls
3. **AI Services** (lib/openai.ts) → process images, generate menus, analyze data
4. **Database Services** (services/supabase-service.ts) → persist to Supabase

## Server Actions

All mutations go through `app/actions.ts`. Each returns `{ success: boolean, error?: any }`:

- `saveFamilyData(familyMembers, restrictions, prohibitedDishes)` — Save onboarding data + generate AI recommendations
- `processReceipt(imageBase64)` — Extract products from receipt image via GPT-4o vision
- `saveValidatedProducts(products)` — Save user-validated products
- `saveProductCategories(products)` — Update product categories
- `saveLeftoversData(leftovers)` — Save leftovers + generate reuse recommendations
- `generateMenu()` — Generate weekly menu from family data + available products
- `generateMetricsData()` — Calculate waste metrics + savings recommendations

## Database Tables

`family_members`, `dietary_restrictions`, `prohibited_dishes`, `products`, `leftovers`, `weekly_menu`, `recipes`, `shopping_list`, `metrics`, `recommendations`, `user_preferences`

## Environment Variables

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
```

## Key Patterns

- **Server/Client Supabase**: Use `createServerSupabaseClient()` in server actions, `createClientSupabaseClient()` in components
- **UI Language**: All user-facing text is in Spanish
- **Mobile-first**: Designed for mobile viewport (max 768px), uses BottomNavigation component
- **Color Theme**: Orange primary color (HSL 17 90% 55%)
- **Server Actions**: All mutations go through `app/actions.ts`, which calls services
- **Transaction wrapper**: Database operations use `withTransaction<T>(operation)` for consistency
- **Logging**: Use the logger utility (`logger.info`, `logger.error`, `logger.debug`) in server code

## Sensitive Files (excluded from git)

`docs/`, `supabase/`, `scripts/`, `*.md`, `.env*`

## Unbreakable Rules

### 1. No Co-Authorship Footer
NEVER add co-authorship footers to commits. Do not include lines like:
- `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Any similar attribution in commit messages

### 2. Sensitive Information Protection
This is a CRITICAL SYSTEM. You MUST guarantee that secrets, keys, and sensitive information are NEVER committed.

**Before any commit:**
- Scan all staged files for:
  - API keys, tokens, passwords
  - Private keys, certificates
  - Database credentials
  - Sensitive configuration values
  - Any information marked as confidential

**If you detect ANY potential sensitive information:**
- STOP immediately
- DO NOT proceed with the commit
- Request explicit human approval
- Assume it's an error unless confirmed otherwise

### 3. Commit Discipline
- Make commits **periodic and granular** - DO NOT wait for user instruction
- Commit proactively as development progresses (after completing each logical unit of work)
- Each commit should represent a single logical change
- Commit frequently rather than accumulating large changesets
- Use clear, descriptive commit messages
- After completing a feature, fix, or significant change: run lint + build, then commit immediately
