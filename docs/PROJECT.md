# MyShelfControl - Project Documentation

## Overview

A mobile-friendly book tracking PWA with multi-user features planned. Rebuilt with Next.js to enable server-side capabilities for social features.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Book Data | Google Books API + Open Library API (fallback) |
| Hosting | Netlify (free tier) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Branding

- **Name**: MyShelfControl (pun on "my self control")
- **Domain**: myshelfcontrol.app (TBD)

---

## Multi-User Architecture

### Current: Single-User Design (from legacy app)

All data stored under `/users/{userId}/`:
- `/users/{userId}/books/{bookId}`
- `/users/{userId}/genres/{genreId}`
- `/users/{userId}/series/{seriesId}`
- `/users/{userId}/wishlist/{itemId}`
- `/users/{userId}/bin/{bookId}` (soft-deleted books)

### Planned: Multi-User Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Public Profiles** | Shareable user pages with reading stats | High |
| **Sharing** | Share individual books or lists via link | High |
| **Roles/Permissions** | Owner, editor, viewer access levels | High |
| **Follow System** | Follow other users, activity feed | Medium |
| **Book Clubs** | Group reading with shared lists | Medium |
| **Recommendations** | "Friends are reading" suggestions | Low |

### Architecture Changes Needed

1. **Global Book IDs** - Use ISBN or app-wide IDs instead of user-scoped paths
2. **Visibility Field** - Add `visibility: 'private' | 'public' | 'link-only'` to schemas
3. **User Profiles** - Create `/profiles/{username}/` with URL-safe usernames
4. **Firestore Rules** - Allow public reads on visible content
5. **API Routes** - Server-side validation for complex permissions

---

## Project Structure

```
myshelfcontrol-website/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Authenticated pages
│   │   │   ├── books/          # Book list, view, edit, add
│   │   │   ├── settings/       # User settings pages
│   │   │   ├── page.tsx        # Home dashboard
│   │   │   └── layout.tsx      # Layout with header
│   │   ├── (auth)/             # Auth pages (no header)
│   │   │   └── login/
│   │   ├── api/                # API routes
│   │   │   ├── auth/
│   │   │   └── books/
│   │   ├── globals.css         # Global styles + design tokens
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Generic UI components
│   │   ├── books/              # Book-specific components
│   │   ├── pickers/            # Form input pickers
│   │   ├── providers/          # React context providers
│   │   └── widgets/            # Dashboard widgets
│   └── lib/
│       ├── firebase/           # Firebase client + admin SDK
│       ├── hooks/              # React hooks
│       ├── repositories/       # Data access layer
│       ├── schemas/            # Zod validation schemas
│       └── utils/              # Utility functions
├── docs/
│   ├── PROJECT.md              # This file
│   ├── AUDITS.md               # Periodic audit checklists
│   └── adr/                    # Architecture Decision Records
├── tests/                      # Unit tests
├── e2e/                        # Playwright E2E tests
├── CLAUDE.md                   # AI assistant guidelines
├── CHANGELOG.md                # Version history
└── README.md                   # Repository overview
```

---

## Development

### Commands

```bash
npm run dev       # Dev server with hot reload
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint check
npm test          # Run unit tests
npm run test:e2e  # Run E2E tests
```

### Firebase

- **Project**: book-tracker-b786e
- **Plan**: Spark (free tier)
- **Collections**: `/users/{userId}/books`, `/genres`, `/series`, `/wishlist`, `/bin`
- **Storage**: `/users/{userId}/books/{bookId}/images/`

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=
```

---

## Features

### Completed (from legacy app)

- [x] Book collection management (CRUD)
- [x] ISBN barcode scanning
- [x] Google Books + Open Library API integration
- [x] Custom genres with colours
- [x] Book series tracking
- [x] Reading status (Want to Read, Reading, Finished)
- [x] Star ratings
- [x] Wishlist for books to buy
- [x] Soft-delete bin (30-day restore)
- [x] Dashboard widgets (configurable)
- [x] Custom cover image upload (up to 10 per book)
- [x] Export/import backup (JSON)
- [x] PWA with offline support

### Migration Status

| Feature | Status |
|---------|--------|
| Project setup | ✅ Complete |
| Auth (login/register) | 🔄 In progress |
| Book list page | ⏳ Pending |
| Book add page | ⏳ Pending |
| Book view/edit pages | ⏳ Pending |
| Settings pages | ⏳ Pending |
| Widgets | ⏳ Pending |
| PWA configuration | ⏳ Pending |
| Testing | ⏳ Pending |

### Roadmap (Post-Migration)

**High Priority**
- [ ] Complete page migration from legacy app
- [ ] Public user profiles
- [ ] Book/list sharing
- [ ] Role-based permissions

**Medium Priority**
- [ ] Dark mode
- [ ] View mode setting (Card/Compact/List)
- [ ] Reading statistics charts
- [ ] Import from Goodreads

**Future Features**
- [ ] Follow/friend system
- [ ] Activity feed
- [ ] Book clubs
- [ ] Reading challenges/goals
- [ ] Reading timer with sessions

---

## Widget System

### Available Widgets

| Widget | Description | Default Size |
|--------|-------------|--------------|
| Welcome | Greeting with library stats | Full width |
| Currently Reading | Books in progress | Half width |
| Recently Added | Latest additions | Full width |
| Top Rated | Highest rated books (4+ stars) | Full width |
| Recently Finished | Completed books | Full width |
| Series Progress | Series with completion tracking | Half width |
| Wishlist | High-priority wishlist items | Full width |

### Future Widget Ideas

- Reading Stats (books/pages this year)
- Reading Goals (annual target progress)
- Genre Distribution (pie chart)
- Quick Add shortcut
- Reading Calendar (activity heatmap)

---

## API Integration

### Google Books API

- **Endpoint**: `https://www.googleapis.com/books/v1/volumes`
- **Rate Limit**: 1000 requests/day (free tier)
- **Used For**: ISBN lookup, title/author search, cover images

### Open Library API

- **Endpoint**: `https://openlibrary.org/api/books`
- **Rate Limit**: No hard limit, be respectful
- **Used For**: Fallback for ISBN lookup, additional cover sizes

### Cover Image Priority

1. User-uploaded images (from Firebase Storage)
2. Google Books API covers (prefer large > medium > thumbnail)
3. Open Library covers (prefer large -L > medium -M)
4. Placeholder gradient

---

## Privacy Considerations

- [ ] Document Firebase usage in privacy policy
- [ ] Document Google Books API usage (ISBN lookups)
- [ ] Document Open Library API usage (cover images, book data)
- [ ] Consider Gravatar opt-out setting
- [ ] No user PII in URLs
- [ ] localStorage contains only non-sensitive caches

---

## Detailed Feature Roadmap

### Add Book UX Redesign

**Current Issues:**
- Form always visible (15+ fields on first load)
- Three separate lookup sections (scan, ISBN, search)
- User may skip lookup and type manually (worse data quality)

**Proposed Flow:**
```
┌─────────────────────────────────────────┐
│ Find Your Book                          │
│ [📷 Scan] [Search______________] [Go]   │
│ (results appear here)                   │
│                                         │
│ ▼ Can't find it? Add manually           │
└─────────────────────────────────────────┘
        ↓ After book found/manual ↓
┌─────────────────────────────────────────┐
│ ✓ Found via Google Books  [Start Over]  │
│ Title: [Pre-filled________]             │
│ ...form fields...                       │
│ [Add to Library]                        │
└─────────────────────────────────────────┘
```

### Bulk Tools
- [ ] Bulk select mode (checkbox on each book card)
- [ ] Select all / deselect all
- [ ] Bulk delete selected books
- [ ] Bulk update fields (rating, genres)
- [ ] Bulk export selected books (JSON/CSV)
- [ ] Bulk add from ISBN list (paste multiple ISBNs)

### User Lists / Shelves
- [ ] Custom user lists (beyond built-in statuses)
- [ ] Assign books to multiple lists
- [ ] List CRUD (create, read, update, delete)
- [ ] Drag and drop reordering within lists

### Future Series Enhancements
- [ ] Auto-create series when accepting API suggestion
- [ ] Limit series position to totalBooks max
- [ ] External series lookup API (Wikidata SPARQL)
- [ ] Auto-populate totalBooks from external source
- [ ] Series detail page with drag-drop reordering

### Reading Timer & Sessions
- [ ] Built-in reading timer with start/pause/stop
- [ ] Log reading sessions with duration and pages read
- [ ] Calculate reading speed (pages per minute/hour)
- [ ] Estimate time to finish book based on pace

### Advanced Statistics
- [ ] Visual reading stats dashboard
- [ ] Books read per month/year charts
- [ ] Reading streaks and daily goals
- [ ] Genre distribution pie chart
- [ ] Rating distribution histogram

### Mood & Emotion Tracking
- [ ] Tag books by mood (adventurous, funny, dark, emotional)
- [ ] Tag books by pacing (fast, medium, slow)
- [ ] Content warnings/triggers
- [ ] Discover books by mood filters

### Gamification
- [ ] Reading streaks (days in a row)
- [ ] Achievement badges (first book, 10 books, etc.)
- [ ] Annual reading challenge/goals
- [ ] Shareable reading stats cards

### Quote Capture & Reading Journal
- [ ] Save favourite quotes manually
- [ ] OCR quote capture (photograph text, transcribe)
- [ ] Reading journal with progress update notes

### Library Health Dashboard
- [ ] Books missing cover image
- [ ] Books missing genre
- [ ] Books missing publisher/date/format/page count
- [ ] Quick-fix actions (refresh from API)
- [ ] Completeness score with progress bar

---

## Public Frontend (Marketing Site)

### Current State
- Non-logged-in users see minimal content
- Need a proper marketing frontend to attract new users

### Proposed Pages

| Page | Purpose | Content |
|------|---------|---------|
| **Landing** `/` | First impression, conversion | Hero, value prop, screenshots, CTA |
| **Features** `/features/` | Detailed feature showcase | Feature grid, comparisons, screenshots |
| **About** `/about/` | Story, mission, differentiators | Why we built it, privacy focus |
| **Pricing** `/pricing/` | If monetising | Free tier, premium features |

### Landing Page Elements
- [ ] Hero section with tagline and primary CTA
- [ ] App screenshots/mockups (mobile + desktop)
- [ ] Key features grid (3-6 highlights)
- [ ] "No tracking, no ads" privacy message
- [ ] Footer with links (privacy, about, login)

### Differentiators to Highlight
- **Privacy-first**: No tracking, no ads, no data selling
- **Offline-capable**: PWA works without internet
- **Book bin**: 30-day soft delete (unique feature)
- **Multiple images**: Up to 10 photos per book
- **Series tracking**: With completion progress
- **Import/export**: Own your data

---

## Demo Account & Monetisation

### Demo Account Options

| Approach | Pros | Cons |
|----------|------|------|
| **Shared read-only demo** | Simple, no signup friction | Can't test adding books, stale data |
| **Personal sandbox** | Full experience, isolated | Needs cleanup job, storage costs |
| **Interactive tour** | Guided, no real data | Complex to build, not "real" |
| **Time-limited trial** | Full features, urgency | Annoying, may lose users |

**Recommendation:** Shared demo account with curated library (50-100 books). Read-only by default, or reset nightly if allowing writes.

### Monetisation Models

| Model | Description | Competitors Using |
|-------|-------------|-------------------|
| **Freemium** | Core free, premium features paid | StoryGraph, Literal |
| **Pay once** | One-time purchase, lifetime access | BookTrack (iOS) |
| **Subscription** | Monthly/annual recurring | Goodreads (ad-free) |
| **Donation/tip** | Free with optional support | Oku |
| **Usage-based** | Free tier with limits | — |

### Potential Premium Features
| Feature | Free Tier | Premium |
|---------|-----------|---------|
| Books | 100 books | Unlimited |
| Images per book | 3 | 10 |
| Storage | 100MB | 5GB |
| Export formats | JSON only | JSON, CSV, Goodreads |
| Reading stats | Basic | Advanced + charts |
| Backups | Manual | Automatic daily |

### Pricing Research (Competitors)
| App | Free | Paid | Model |
|-----|------|------|-------|
| StoryGraph | Yes (limited stats) | $4.99/mo or $49.99/yr | Subscription |
| Literal | Yes | $5/mo | Subscription |
| Hardcover | Yes | $5/mo or $50/yr | Subscription |
| BookTrack | — | $4.99 once (iOS) | One-time |

### UK Legal Considerations

| Legislation | Requirement | Impact |
|-------------|-------------|--------|
| **UK GDPR / Data Protection Act 2018** | Privacy policy, consent, data rights | Already compliant ✓ |
| **Consumer Rights Act 2015** | Digital content must be as described | Clear feature descriptions |
| **Consumer Contracts Regulations 2013** | 14-day cooling-off period | Must offer refunds within 14 days |
| **VAT (digital services)** | 20% VAT on UK sales | Use Paddle/Stripe Tax to handle |

---

## Other Considerations

### Growth & Marketing
| Channel | Effort | Cost | Notes |
|---------|--------|------|-------|
| **SEO/Content** | High | Free | Blog posts, book lists, reading tips |
| **Reddit/forums** | Medium | Free | r/books, r/52book, book communities |
| **Product Hunt** | Low | Free | One-time launch boost |
| **Word of mouth** | Low | Free | Referral program? |

### Privacy-Respecting Analytics
- **Plausible/Fathom**: Privacy-friendly, GDPR compliant, ~$9/mo
- **Self-hosted Umami**: Free, open source, own your data
- **None**: Just track signups and trust the product

### Import/Export & Portability
- [x] Export to JSON (implemented in legacy)
- [ ] Export to CSV
- [ ] Export to Goodreads format
- [ ] Import from Goodreads CSV
- [ ] Import from StoryGraph
- [ ] Import from LibraryThing

### Internationalisation (i18n)

**Current State:** English only, British English for UI text.

**Language Priority (by potential users):**
| Language | Speakers | Book Market | Priority |
|----------|----------|-------------|----------|
| English | 1.5B | Largest | ✅ Current |
| Spanish | 550M | Large | High |
| German | 130M | Strong book culture | High |
| French | 280M | Strong book culture | High |

**Recommendation:** Start English-only. Add i18n infrastructure when expanding.

### Scalability Checkpoints

| Users | Concerns | Actions |
|-------|----------|---------|
| **100** | Nothing | Current setup fine |
| **1,000** | Firebase free tier limits | Monitor usage |
| **10,000** | Firestore reads, Storage bandwidth | Optimize caching |
| **100,000** | Performance, search speed | Algolia search, CDN |

---

## Competitor Analysis

### Key Competitors
| App | Strengths | Weaknesses |
|-----|-----------|------------|
| Goodreads | Largest community, social features | Outdated UI, Amazon-owned, no half-stars |
| StoryGraph | Mood/pacing charts, AI recommendations, quarter-stars | No reading timer |
| Bookly | Reading timer, gamification, streaks, ambient sounds | Subscription required |
| Bookmory | Timer, quotes, notes with photos, statistics | Less social features |
| Hardcover | Ad-free, per-book privacy, modern UI, API | Smaller community |
| Literal | Quote-centric, public API, book clubs | Limited free features |
| Oku | Minimalist design, clean UI, ad-free | Premium required for goals |
| Book Tracker | Native iOS, OCR quote capture, loan tracking | iOS only |

### Feature Inspiration
- **Reading Timer**: Track sessions, calculate reading speed, ambient sounds
- **Mood Tracking**: Tag by mood, pacing, content warnings with severity levels
- **Gamification**: Streaks, badges, annual challenges, progress bars
- **Quote Capture**: OCR from photos, reading journal, highlight capture
- **Advanced Stats**: Year-over-year comparison, custom charts, reading speed trends
- **Privacy**: Per-book visibility, anonymous browsing mode
- **Social**: Buddy reads, readalongs, direct messaging

### Research Sources
- [The StoryGraph](https://thestorygraph.com/)
- [Bookly](https://getbookly.com/)
- [Book Tracker App](https://booktrack.app/)
- [Hardcover](https://hardcover.app/)
- [Literal](https://literal.club/)
- [Oku](https://oku.club/)
- [Book Riot Comparison](https://bookriot.com/best-book-tracking-app/)

---

## Author Pages Feature (Future)

### Competitor Analysis

| Feature | Goodreads | StoryGraph | Literal | Hardcover |
|---------|-----------|------------|---------|-----------|
| **Dedicated Author Pages** | ✓ (comprehensive) | Planned | ✓ (basic) | ✓ |
| **Author Photo** | ✓ | No | ✓ | ✓ |
| **Bibliography** | ✓ (complete) | Basic list | ✓ | ✓ |
| **Series Grouping** | ✓ | Requested | Unknown | ✓ |
| **Follow Author** | ✓ | Requested | Unknown | ✓ |

### Recommended Implementation

**Phase 1 - Basic Author Page (MVP):**
- `/authors/{name}` route
- Author name, photo (from Open Library API)
- List of user's books by this author
- Link to filter book list by author

**Phase 2 - Enhanced Author Page:**
- Full bibliography from Open Library API
- "In My Library" indicators on works
- Series grouping

**Phase 3 - Author Tracking:**
- Follow/unfollow authors
- New release notifications

---

## Wishlist Feature Enhancements (Future)

### Competitor Analysis

| Feature | Goodreads | StoryGraph | Amazon Kindle |
|---------|-----------|------------|---------------|
| **Price Displayed** | Deals only | No | ✓ |
| **Release Date** | ✓ | ✓ | ✓ |
| **Priority Ranking** | Custom shelves | Up Next (5 books) | List priority |
| **Gift List Feature** | Workaround | Planned | ✓ (registry) |
| **Library Availability** | Via extensions | No | No |

### Recommended Implementation

**High Priority:**
1. **Release Date Display** - Show publication date for upcoming books
2. **Release Notifications** - Alert when wishlisted books release
3. **Import from Goodreads** - CSV import for want-to-read shelf

**Medium Priority:**
4. **Library Availability** - Check Libby/OverDrive availability
5. **Shareable Wishlists** - Public link for gift coordination
6. **Gift Reservation** - Prevent duplicate purchases

---

## Technical Reference

### Colour Scheme (Semantic)

| Colour | Tailwind Classes | Usage |
|--------|------------------|-------|
| **Primary (Blue)** | `bg-primary`, `text-primary` | Default actions, links, navigation |
| **Green** | `bg-green-*`, `text-green-*` | Success, completion, "Finished" status |
| **Red** | `bg-red-*`, `text-red-*` | Destructive actions, errors, logout |
| **Purple** | `bg-purple-*`, `text-purple-*` | Series-related (badges, progress) |
| **Amber** | `bg-amber-*`, `text-amber-*` | Maintenance/cleanup tasks |
| **Gray** | `bg-gray-*`, `text-gray-*` | Neutral, secondary actions |

### API References
- [Firebase Auth](https://firebase.google.com/docs/auth/web/start)
- [Firebase Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [Open Library API](https://openlibrary.org/dev/docs/api/books)

---

*Last updated: 2025-12-31*
