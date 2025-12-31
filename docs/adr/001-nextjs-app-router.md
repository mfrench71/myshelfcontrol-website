# ADR 001: Next.js App Router for Multi-User Features

**Status**: Accepted

**Date**: 2025-12-31

## Context

The original MyBookShelf application was built with 11ty (static site generator) and vanilla JavaScript. While this worked well for a single-user book tracking app, we now want to add multi-user features:

- **Public profiles**: Shareable user pages with reading stats
- **Sharing**: Share individual books or lists via link
- **Roles/permissions**: Owner, editor, viewer access levels
- **Follow system**: Follow other users, activity feed
- **Book clubs**: Group reading with shared lists

11ty generates static HTML at build time, which is fundamentally incompatible with:

1. **Server-side data fetching** - Need to fetch user-specific data on each request
2. **Complex permissions** - Server-side validation for who can see what
3. **SEO for dynamic content** - Public profiles need server-rendered meta tags
4. **Real-time features** - Activity feeds, notifications
5. **API routes** - Server-side logic for complex operations

## Decision

Migrate to **Next.js 16 with the App Router** for the following reasons:

### Why Next.js?

| Feature | 11ty | Next.js |
|---------|------|---------|
| Server Components | No | Yes |
| API Routes | No | Yes |
| Middleware | No | Yes |
| Dynamic rendering | No | Yes |
| Static generation | Yes | Yes |
| TypeScript | Manual | Built-in |

### Why App Router (not Pages Router)?

- **Server Components by default** - Better performance, smaller bundles
- **Nested layouts** - Route groups for auth vs app layouts
- **Parallel routes** - Useful for modals and complex UI
- **Loading/error states** - Built-in loading.tsx and error.tsx
- **Future-proof** - App Router is the recommended approach for new projects

### Why not other frameworks?

| Framework | Considered | Reason for Not Choosing |
|-----------|------------|------------------------|
| **SvelteKit** | Yes | Smaller ecosystem, team familiarity with React |
| **Remix** | Yes | More complex deployment, App Router now matches features |
| **Astro** | Yes | Better for content sites, less suited for app-like features |
| **Vue/Nuxt** | No | Team has React experience |

## Consequences

### Positive

- **Server-side capabilities** - Can implement complex permissions and API routes
- **Better SEO** - Server-rendered meta tags for public profiles
- **TypeScript first** - Built-in TypeScript support with strict mode
- **Modern React** - Server Components, Suspense, streaming
- **Ecosystem** - Large community, many compatible libraries
- **Free hosting** - Netlify supports Next.js on free tier

### Negative

- **Migration effort** - Need to rewrite all pages and components
- **Learning curve** - App Router has different patterns than Pages Router
- **Larger bundle** - More JavaScript than static HTML (mitigated by Server Components)
- **Complexity** - More moving parts than static site

### Neutral

- **Firebase remains** - Same backend, just different frontend
- **Same features** - All existing features will be preserved
- **Tailwind CSS** - Same styling approach, same design tokens

## Implementation Notes

### Route Groups

```
src/app/
├── (app)/           # Authenticated routes (with header)
│   ├── layout.tsx   # Header, navigation
│   ├── books/
│   └── settings/
├── (auth)/          # Unauthenticated routes (no header)
│   └── login/
└── (public)/        # Public routes (future: profiles, shared lists)
```

### Server vs Client Components

- **Server Components** (default): Data fetching, static content
- **Client Components** (`'use client'`): Interactivity, browser APIs, hooks

### Migration Strategy

1. Set up project structure and Firebase config
2. Port pages one at a time, starting with auth
3. Add multi-user features incrementally
4. Run both apps in parallel during migration
