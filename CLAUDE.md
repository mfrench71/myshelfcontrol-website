# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

**MyShelfControl** - A Next.js book tracking PWA with multi-user features planned.

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Auth/DB**: Firebase (Auth, Firestore, Storage)
- **Hosting**: Netlify (free tier)

## Core Guidelines

- **No auto-push**: Wait for explicit user approval before pushing
- **Logical commits**: Group related changes, commit after each logical unit
- **Tests required**: Write/update tests for all changes
- **British English**: Use colour, favourite, organised (not American spellings)
- **User-friendly errors**: Never expose raw `error.message` - show helpful messages
- **Minimise Firebase**: Consider read/write impact for all changes

## Build Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
npm test          # Run tests
```

## Architecture

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Authenticated pages (with header)
│   │   ├── books/          # Book list, view, edit, add
│   │   ├── settings/       # User settings
│   │   └── layout.tsx      # App layout with header
│   ├── (auth)/             # Auth pages (no header)
│   │   └── login/
│   ├── api/                # API routes
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + design tokens
├── components/
│   ├── ui/                 # Generic UI (Button, Modal, Header)
│   ├── books/              # Book-specific components
│   ├── pickers/            # Form pickers (Genre, Series)
│   ├── providers/          # React context providers
│   └── widgets/            # Dashboard widgets
└── lib/
    ├── firebase/           # Firebase client + admin config
    ├── hooks/              # React hooks
    ├── repositories/       # Data access layer
    ├── schemas/            # Zod validation schemas
    └── utils/              # Utility functions
```

### Key Patterns

- **Route Groups**: `(app)` for authenticated pages, `(auth)` for login
- **Server Components**: Use for data fetching, pass data to client components
- **Client Components**: Mark with `'use client'` for interactivity
- **API Routes**: Use for mutations and complex server logic
- **Middleware**: Protects routes, redirects unauthenticated users

## UI/UX Principles

**Mobile-first PWA** - must feel like a native app:
- Touch targets: minimum 44px
- Visual response: within 100ms
- Loading states: skeletons/spinners, never blank screens
- Animations: CSS only, under 300ms

### Colour Scheme
- **Primary (blue)**: Default actions, links
- **Green**: Success, completion, create/add
- **Red**: Destructive actions, errors
- **Purple**: Series-related
- **Amber**: Maintenance/utility
- **Gray**: Neutral, cancel

### Toast Types
- `success` (green): Completed actions
- `error` (red): Failed operations
- `info` (grey): Settings toggles, state changes

## Code Style

### Naming Conventions
- Files: `kebab-case.ts` or `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`

### TypeScript
- Prefer `type` over `interface` for object types
- Use strict mode
- Avoid `any` - use `unknown` if type is uncertain

### Components
```tsx
// Component file structure
'use client'; // Only if needed

import { ... } from 'react';
import { ... } from '@/lib/...';
import { ... } from '@/components/...';

interface Props {
  // ...
}

export function ComponentName({ prop1, prop2 }: Props) {
  // ...
}
```

## Environment Variables

Required in `.env.local`:
```
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-only)
FIREBASE_SERVICE_ACCOUNT_KEY=
```

## Firebase

- **Project**: `book-tracker-b786e` (same as old project)
- **Collections**: `/users/{userId}/books`, `/genres`, `/series`, `/bin`, `/wishlist`

## Development Notes

### Changelog
Update `CHANGELOG.md` in the project root when making user-facing changes. Add a new date section (format: `## DD-MM-YYYY`) with bullet points describing changes. The changelog is parsed at build time and displayed on the About page.

Version number is generated automatically from the build date (DD.MM.YYYY UK format) - no manual version updates needed.

### Backup Export/Import
The backup export/import functionality in `/settings/library` must be updated whenever new data types are added. Currently exports:
- Books (with genre/series ID remapping on import)
- Genres
- Series
- Wishlist (with cross-check against owned books)
- Bin

**Review `handleExport` and `handleImport` in `src/app/(app)/settings/library/page.tsx` when adding new collections or fields.**

## Migration Status

This project is a migration from 11ty. Migration is complete.

### Completed
- [x] Project setup with Next.js 16
- [x] Directory structure
- [x] Firebase SDK integration
- [x] Tailwind CSS with design tokens
- [x] Auth middleware and context
- [x] Base layout with header
- [x] All pages ported from old project
- [x] All components ported
- [x] E2E testing (Playwright - 74 tests)
- [x] PWA configuration

### Pending
- [ ] Multi-user features
