# MyShelfControl - Project Documentation

## Table of Contents

1. [Overview & Tech Stack](#overview)
2. [Project Structure](#project-structure)
3. [Development](#development)
4. [Features & Migration Status](#features)
5. [Widget System](#widget-system)
6. [API Integration](#api-integration)
7. [Architecture](#architecture)
   - [Current Data Model](#current-single-user-design-from-legacy-app)
   - [Multi-User Architecture](#planned-multi-user-features)
   - [Architecture Decisions](#architecture-decisions)
8. [Feature Roadmap](#feature-roadmap)
   - [Priorities](#roadmap-post-migration)
   - [Detailed Feature Specs](#detailed-feature-specs)
9. [Research & Competitor Analysis](#research--competitor-analysis)
   - [Key Competitors](#key-competitors)
   - [Multi-User Features](#multi-user-features-research)
   - [Additional Features](#additional-features-research)
   - [Feature Inspiration](#feature-inspiration)
10. [Public Frontend (Marketing)](#public-frontend-marketing-site)
11. [Demo Account & Monetisation](#demo-account--monetisation)
12. [Legal & Compliance](#legal--compliance)
    - [UK Legal Requirements](#uk-legal-requirements)
    - [Privacy & Data Protection](#privacy--data-protection)
13. [Operations](#operations)
    - [Growth & Marketing](#growth--marketing)
    - [Import/Export](#importexport--portability)
    - [Scalability](#scalability-checkpoints)
    - [Internationalisation](#internationalisation-i18n)
14. [Security](#security-considerations)
15. [Performance](#performance-targets)
16. [Testing](#testing-strategy)
17. [Known Limitations](#known-limitations)
18. [Technical Reference](#technical-reference)

---

## Overview

A mobile-friendly book tracking PWA with multi-user features planned. Rebuilt with Next.js to enable server-side capabilities for social features.

**Name:** MyShelfControl (pun on "my self control")
**Domain:** myshelfcontrol.app (TBD)

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

---

## Architecture

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

### Architecture Decisions

#### Settings Page: Hub Pattern

Settings uses a hub-and-drill-down pattern: main Settings page lists categories, each linking to a sub-page. This differs from the legacy app which used horizontal tabs with in-section links.

| Aspect | **Hub Pattern** (Current) | **Horizontal Tabs** (Legacy) |
|--------|---------------------------|------------------------------|
| Clicks to setting | 2-3 clicks | 1-2 clicks |
| Mobile friendliness | Excellent (vertical list) | Moderate (horizontal scroll) |
| Scalability | High (unlimited sections) | Limited (5-7 tabs max) |
| Cognitive load | Low (one section at a time) | Higher (multiple visible) |
| iOS/Android convention | ✓ Follows native patterns | ✗ Custom pattern |

**Decision:** Keep hub pattern. It follows iOS/Android conventions, scales well, and settings are infrequently accessed. Consider adding desktop sidebar layout as future enhancement.

**Potential improvements:**
1. Keyboard shortcut (Cmd/Ctrl+,) for power users
2. Surface frequent settings outside hub (dark mode toggle in header)
3. Desktop sidebar (>768px): show settings categories always visible

#### Author Sorting

| Context | Sorting Logic |
|---------|--------------|
| **Author Filter Dropdown** | By book count first (most used), then alphabetically by full name |
| **Book List "Author A-Z"** | By surname (last word of author name) |
| **Author Typeahead** | By book count first, then alphabetically |

**Surname extraction** uses `getAuthorSurname()` utility:
- "First Last" → "last"
- "First Middle Last" → "last"
- "Last, First" → "last" (comma format)

**Decision:** Keep current approach (count first, then full name A-Z). Add surname display as future enhancement if users request it.

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
| Auth (login/register) | ✅ Complete |
| Book list page | ✅ Complete |
| Book add page | ✅ Complete |
| Book view/edit pages | ✅ Complete |
| Settings hub page | ✅ Complete |
| Settings sub-pages | ✅ Complete |
| Widgets (dashboard) | ✅ Complete |
| PWA configuration | ✅ Complete |
| E2E Testing | ✅ Complete (74 tests) |

### Roadmap (Post-Migration)

**High Priority**
- [x] Complete page migration from legacy app
- [ ] Public user profiles
- [ ] Book/list sharing
- [ ] Role-based permissions

**Medium Priority**
- [ ] Dark mode
- [ ] View mode setting (Card/Compact/List)
- [ ] User-defined physical formats (see below)
- [ ] Reading statistics charts
- [ ] Import from Goodreads

**Future Features**
- [ ] Follow/friend system
- [ ] Activity feed
- [ ] Book clubs
- [ ] Reading challenges/goals
- [ ] Reading timer with sessions
- [ ] Error logging & admin dashboard (requires role system)

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

## Feature Roadmap

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
- [ ] Remove book from series (without deleting book) - button on view page
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

### Year in Review / Reading Wrapped
- [ ] Annual summary page (Spotify Wrapped-style)
- [ ] Top rated book of the year
- [ ] Most read authors
- [ ] Genre distribution breakdown
- [ ] Total books/pages/hours read
- [ ] Reading streaks summary
- [ ] Shareable social cards (image generation)
- [ ] Compare with previous years

### Paused & DNF Status
- [ ] Add "Paused" as reading status (separate from DNF)
- [ ] Paused books in collapsed section
- [ ] Exclude paused time from reading speed calculations
- [ ] DNF with pages-read tracking
- [ ] Optional "Why I DNF'd" notes field
- [ ] DNF books don't count against reading goals

### Sub-Ratings System
- [ ] Overall rating (current half-star system)
- [ ] Enjoyment rating (how much you liked it)
- [ ] Quality rating (writing/craft)
- [ ] Characters rating
- [ ] Plot rating
- [ ] Optional: show breakdown on book view page
- [ ] Use sub-ratings to improve recommendations

### Edition & Reread Tracking
- [ ] Track multiple editions of same book (physical + audiobook)
- [ ] "You've read another edition" indicator
- [ ] Explicit reread tracking with dates
- [ ] Reread count displayed on book card
- [ ] Rereads count toward reading challenges

### New Release Notifications
- [ ] Follow authors from author page
- [ ] Email alerts when followed authors release new books
- [ ] In-app notification centre
- [ ] Wishlist items: notify when released
- [ ] Weekly digest option (vs immediate alerts)

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

---

## Legal & Compliance

### UK Legal Requirements

#### Current Requirements (Single-User)

| Legislation | Requirement | Impact |
|-------------|-------------|--------|
| **UK GDPR / Data Protection Act 2018** | Privacy policy, consent, data rights | Already compliant ✓ |
| **Consumer Rights Act 2015** | Digital content must be as described | Clear feature descriptions |
| **Consumer Contracts Regulations 2013** | 14-day cooling-off period | Must offer refunds within 14 days |
| **VAT (digital services)** | 20% VAT on UK sales | Use Paddle/Stripe Tax to handle |

#### Additional Requirements for Multi-User (Research Dec 2025)

##### Age Appropriate Design Code (Children's Code)

**Applies if:** Service likely to be accessed by under-18s (even if not aimed at them).

| Requirement | Implementation |
|-------------|----------------|
| High privacy by default | Default profiles to private, opt-in for public |
| Minimum data collection | Only collect essential data |
| No nudge techniques | Don't push users toward less private options |
| Age-appropriate privacy info | Clear, simple language in privacy policy |
| Parental controls option | Consider for future |
| Geolocation off by default | N/A (no location features) |

**Risk Assessment:** Book tracking app is low-risk. Not aimed at children, no chat features, no algorithmically-recommended content. However, if users under 18 may access (likely), should apply Code standards to all users.

**Action:** Add age verification or apply Code standards universally.

Sources: [ICO Children's Code](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/)

##### Online Safety Act 2023

**Applies if:** User-to-user service where content can be encountered by other users.

| Duty | Applies? | Notes |
|------|----------|-------|
| Illegal content duty | ✓ Yes | Risk assessment required, remove illegal content |
| Children's safety duty | ✓ If accessible | Age assurance or apply protections to all |
| Categorised service duties | ✗ No | Only for 7M+ UK users with recommender system |

**Risk Assessment:** Low-risk platform. No algorithmic recommendations, no chat/messaging, limited UGC (reviews only). Falls under smallest tier of regulation.

**Requirements:**
- [ ] Conduct illegal content risk assessment (by March 2025 ✓)
- [ ] Implement basic moderation for reviews/comments
- [ ] Terms of service must prohibit illegal content
- [ ] Simple reporting mechanism for users

**Exemptions that may apply:**
- Comments/reviews only (limited UGC)
- No private messaging
- No content recommender system

Sources: [Ofcom Guide](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/guide-for-services), [Gov.uk Explainer](https://www.gov.uk/government/publications/online-safety-act-explainer/online-safety-act-explainer)

##### PECR Cookie Consent

**Current requirements:**
- Consent required before setting non-essential cookies
- Reject must be as easy as accept
- No pre-ticked boxes
- Clear information about what cookies do

**Exempt (no consent needed):**
- Session cookies for authentication
- Shopping basket / essential functionality
- Analytics cookies (from June 2025 under DUA Act - with opt-out)

**Action:**
- [ ] Cookie consent banner if using analytics
- [ ] Document cookies in privacy policy
- [ ] Ensure reject is equally prominent as accept

Sources: [ICO Cookie Guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)

##### Right to Erasure (Multi-User Implications)

When user data is shared with others (reviews, public profiles, activity feeds):

| Scenario | Obligation |
|----------|------------|
| User deletes account | Must erase all personal data |
| Data shared with other users | Must inform recipients of erasure |
| Public reviews on book pages | Must remove or anonymise |
| Activity feed mentions | Must remove from other users' feeds |
| Data made public | Take reasonable steps to inform other controllers |

**Implementation considerations:**
- [ ] Cascade delete for all user content
- [ ] Anonymise rather than delete if review is valuable
- [ ] Offer "delete account" vs "delete account and all content" options
- [ ] Log data recipients for erasure notifications

Sources: [ICO Right to Erasure](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/)

##### Data Controller/Processor (Multi-User)

| Role | When |
|------|------|
| **Sole Controller** | Processing user's own data for their library |
| **Controller** | Processing data to show to other users (activity feeds, public profiles) |
| **Joint Controller** | If integrating social media plugins that share data back |

**Actions:**
- [ ] Document controller status in privacy policy
- [ ] If using third-party social plugins, establish joint controller arrangement
- [ ] Data sharing agreements if sharing with other controllers

Sources: [ICO Controllers & Processors](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/what-are-controllers-and-processors/)

##### Digital Markets, Competition and Consumers Act 2024

**Relevant consumer protection changes (from April 2025):**

| Requirement | Impact |
|-------------|--------|
| Fake reviews prohibition | Must not post or commission fake reviews |
| Subscription clarity | Clear pre-contract info, renewal reminders |
| Easy cancellation | Cancellation must be simple (not buried) |
| Drip pricing ban | Show full price upfront, not hidden fees |

**Subscription requirements (from Spring 2026):**
- [ ] Pre-contract information in durable medium
- [ ] Regular renewal reminders
- [ ] Simple cancellation mechanism

Sources: [Lewis Silkin Guide](https://www.lewissilkin.com/en/insights/2024/09/12/our-guide-digital-markets-competition-consumers-bill-focusing-consumer-law)

##### Accessibility (Equality Act 2010)

| Requirement | Standard | Applies |
|-------------|----------|---------|
| Reasonable adjustments | WCAG 2.1 AA recommended | Private sector |
| WCAG 2.2 AA mandatory | UK public sector only | ✗ Not required |
| European Accessibility Act | WCAG 2.1 AA | Only if serving EU customers |

**Best practice:**
- [ ] WCAG 2.1 AA compliance for core features
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Colour contrast ratios
- [ ] Alt text for images

Sources: [Bird & Bird UK Accessibility](https://www.twobirds.com/en/insights/2025/uk/uk-accessibility-requirements-for-websites-and-mobile-applications)

##### Terms of Service Requirements

**Required legal documents:**
- [ ] Privacy Policy (legally required if collecting personal data)
- [ ] Cookie Policy (if using cookies)
- [ ] Terms & Conditions (recommended, not legally required)

**Terms must include:**
- Acceptable use policy
- User content rights and restrictions
- Payment and refund terms (if applicable)
- Service limitations
- Plain English (consumer protection requirement)

Sources: [Orrick FAQ](https://www.orrick.com/en/tech-studio/resources/faq/what-legal-terms-do-I-need-for-my-UK-company-website-or-mobile-app)

#### Multi-User Legal Checklist

**Before launch of multi-user features:**
- [ ] Update privacy policy for data sharing between users
- [ ] Add content moderation capability
- [ ] Implement user reporting mechanism
- [ ] Document approach to under-18 users (age gate or universal protections)
- [ ] Cascade delete for account erasure
- [ ] Cookie consent if adding analytics
- [ ] Clear subscription terms if adding premium tier

### Privacy & Data Protection

#### Privacy Policy Requirements

- [ ] Document Firebase usage (authentication, database, storage)
- [ ] Document Google Books API usage (ISBN lookups, metadata)
- [ ] Document Open Library API usage (cover images, book data)
- [ ] Explain data retention policies
- [ ] Detail user rights (access, rectification, erasure, portability)

#### Technical Privacy Measures

- [ ] No user PII in URLs (use IDs, not usernames/emails)
- [ ] localStorage contains only non-sensitive caches
- [ ] Session tokens secured with httpOnly cookies
- [ ] Consider Gravatar opt-out setting (if using)

#### Privacy-Respecting Analytics Options

| Option | Cost | Notes |
|--------|------|-------|
| **Plausible** | ~$9/mo | Privacy-friendly, GDPR compliant, hosted |
| **Fathom** | ~$14/mo | Privacy-friendly, GDPR compliant |
| **Self-hosted Umami** | Free | Open source, own your data |
| **None** | Free | Just track signups, trust the product |

---

## Operations

### Growth & Marketing

| Channel | Effort | Cost | Notes |
|---------|--------|------|-------|
| **SEO/Content** | High | Free | Blog posts, book lists, reading tips |
| **Reddit/forums** | Medium | Free | r/books, r/52book, book communities |
| **Product Hunt** | Low | Free | One-time launch boost |
| **Word of mouth** | Low | Free | Referral program? |

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

## Research & Competitor Analysis

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
| BookTrack | Native iOS, OCR quote capture, loan tracking | iOS only |
| Pagebound | Per-book forums, sub-ratings, anonymous social | New/smaller |
| Basmo | AI chat, Kindle sync, emotion journaling | Premium features |

### Multi-User Features Research

#### Feature Comparison Matrix

| Feature | Goodreads | StoryGraph | Hardcover | Literal | Fable | Oku | BookTrack |
|---------|-----------|------------|-----------|---------|-------|-----|-----------|
| **Friends/Following** | Both systems | Opt-in friends | Follow | Follow | Follow | Follow | None |
| **Friend Limit** | 5,000 / ∞ followers | Unlimited | — | — | — | — | N/A |
| **Activity Feed** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Book Clubs** | ✓ Groups | ✓ | — | ✓ | ✓ Strong | ✗ | ✗ |
| **Buddy Reads** | ✗ | ✓ ≤15 people | ✗ | ✗ | ✓ | ✗ | ✗ |
| **Share to Social** | ✓ Facebook | ✓ | ✓ | ✓ Highlights | ✓ | ✓ | ✓ Stats |
| **Shareable Lists** | ✓ Shelves | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| **Direct Messaging** | ✓ | ✗ | — | ✗ | ✓ | ✗ | ✗ |
| **Book Lending Tracker** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ Unique |
| **Per-Book Privacy** | ✗ | Requested | ✓ | — | — | — | N/A |

#### Privacy & Visibility Options

| App | Profile Visibility | Notes |
|-----|-------------------|-------|
| **Goodreads** | Public / Members / Friends | Reviews always public on book pages |
| **StoryGraph** | Public / Community / Private | Reviews visible regardless of profile setting |
| **Hardcover** | Public / Private / Friends | Per-book privacy available |
| **BookTrack** | Private only | No social features by design |

#### Key Insights

**High-Value Features (Table Stakes):**
1. Profile visibility controls (public/private/friends-only)
2. Follow/friends system
3. Activity feed (see what friends are reading)
4. Shareable lists/shelves (public or link-only)

**Potential Differentiators:**
1. **Per-book privacy** (only Hardcover has this) — highly requested on StoryGraph
2. **Book lending tracker** (only BookTrack has this) — practical for physical collections
3. **Buddy reads with spoiler protection** (StoryGraph) — complex but loved

**Privacy Gotchas to Avoid:**
- Goodreads/StoryGraph: Reviews are public on book pages even with private profile
- Consider separating review visibility from profile visibility

**Simplest MVP Path:**
1. Profile visibility (public/private)
2. Follow system (one-way, no approval needed)
3. Activity feed of followed users
4. Shareable book lists (public link)

### Additional Features Research (Dec 2025)

| Feature | App(s) | Notes |
|---------|--------|-------|
| **Paused Book Status** | StoryGraph | Most upvoted request ever. Separate from DNF, excludes paused time from stats |
| **Favorites Showcase** | StoryGraph | Pin up to 5 books to profile, used for recommendations |
| **Sub-Ratings** | Pagebound | Rate enjoyment, quality, characters, plot separately |
| **Per-Book Forums** | Pagebound | Each book has discussion forum, posts sorted by % read (unique) |
| **Year in Review** | BookTrack, StoryGraph | Spotify Wrapped-style annual summary, shareable cards |
| **AI Book Chat** | Basmo, Bookly | Ask questions about current book, summaries without spoilers |
| **Kindle/Notion Sync** | Basmo | Import highlights and notes automatically |
| **Match Percentage** | Hardcover | See reading taste overlap with other users |
| **Similar Users ML** | StoryGraph | ML-powered suggestions for reading buddies |
| **Reading Speed Prediction** | Bookly, Basmo | Estimate time to finish based on pace |
| **Ambient Sounds** | Bookly | Rain, coffee shop sounds during reading timer |
| **Book Characters Tracker** | Bookly | Track character names and relationships |
| **Emotion Journaling** | Basmo | Log how each reading session made you feel |
| **Anonymous Social** | Pagebound | No profile photos, private follower counts |
| **GraphQL API** | Hardcover | Developer-friendly public API |

#### DNF Tracking

- **StoryGraph/Pagebound/Tome**: DNF in status dropdown
- **Reading Journey**: "DNF Graveyard" feature
- Track pages read before abandoning
- Optional review of why book was abandoned

#### Content Warnings

StoryGraph implementation:
- User specifies content to avoid in preferences survey
- Books filtered from recommendations automatically
- Warning symbols shown on book pages
- Traffic light severity system (planned)
- Community-sourced via [BookTriggerWarnings.com](https://booktriggerwarnings.com/)

#### Edition/Version Handling

- **StoryGraph**: Each edition is separate item (controversial but necessary)
- **BookTrack**: ISBN-based exact matching for metadata accuracy
- **Challenge**: Users want to track physical + audiobook of same title
- **Consideration**: Show "You've read another edition" on book pages

#### Reread Tracking

- **Bookmory**: Explicit "Reread" section with history
- **Goodreads**: Limited - rereads don't count toward reading challenges
- **Best practice**: Track each read date separately, show reread count

### Feature Inspiration Summary

- **Reading Timer**: Track sessions, calculate reading speed, ambient sounds, reading speed prediction
- **Mood Tracking**: Tag by mood, pacing, content warnings with severity levels, emotion journaling per session
- **Gamification**: Streaks, badges, annual challenges, progress bars, Year in Review/Reading Wrapped
- **Quote Capture**: OCR from photos, reading journal, highlight capture, Kindle sync
- **Advanced Stats**: Year-over-year comparison, custom charts, reading speed trends, sub-ratings
- **Privacy**: Per-book visibility, anonymous browsing mode, anonymous social profiles
- **Social**: Buddy reads, readalongs, direct messaging, per-book discussion forums, match percentage
- **Book Management**: Paused status, DNF with page tracking, edition handling, reread tracking, character tracker
- **Notifications**: New release alerts for followed authors, wishlist release notifications
- **AI Features**: Book chat assistant, summaries without spoilers (emerging 2025 trend)

### Research Sources

- [The StoryGraph](https://thestorygraph.com/) | [Roadmap](https://roadmap.thestorygraph.com/)
- [Bookly](https://getbookly.com/)
- [BookTrack App](https://booktrack.app/)
- [Hardcover](https://hardcover.app/) | [API](https://www.emgoto.com/hardcover-book-api/)
- [Literal](https://literal.club/)
- [Oku](https://oku.club/)
- [Pagebound](https://pagebound.co/)
- [Basmo](https://basmo.app/)
- [Fable](https://fable.co/)
- [Goodreads Help](https://help.goodreads.com/)
- [Book Riot Comparison](https://bookriot.com/best-book-tracking-app/)
- [BookTriggerWarnings](https://booktriggerwarnings.com/)

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

## Physical Format Configuration (Future)

### Current Default Formats

The following physical formats are currently hardcoded in the app:

| Format | Description |
|--------|-------------|
| `Paperback` | Standard softcover edition |
| `Hardcover` | Hardback/casebound edition |
| `Mass Market Paperback` | Smaller, cheaper pocket-sized edition |
| `Trade Paperback` | Larger, higher-quality softcover |
| `Library Binding` | Reinforced binding for libraries |
| `Spiral-bound` | Spiral/coil binding |
| `Audio CD` | Physical audiobook format |
| `Ebook` | Digital/electronic format |

### User-Defined Formats Feature

**Goal:** Allow users to customise the physical format list to match their collection.

**Proposed Implementation:**

1. **Settings UI** (in Library Settings):
   - List of enabled formats with checkboxes
   - "Add custom format" input field
   - Drag-and-drop reordering
   - Reset to defaults button

2. **Storage:**
   - Store in `/users/{userId}/settings/physicalFormats`
   - Schema: `{ enabled: string[], custom: string[], order: string[] }`

3. **Migration:**
   - Default to all built-in formats enabled
   - Existing books with formats not in user's list still display correctly

4. **Use Cases:**
   - Disable unused formats (e.g., user never buys Audio CDs)
   - Add regional formats (e.g., "Bunkobon" for Japanese editions)
   - Add collector formats (e.g., "Signed Edition", "Collector's Edition")
   - Distinguish physical vs digital (e.g., "Kindle", "Kobo", "PDF")

5. **Suggested Custom Formats:**
   - `Board Book` (children's books)
   - `Kindle Edition` / `Kobo Edition`
   - `PDF` / `EPUB`
   - `Audiobook (Digital)`
   - `Signed Edition`
   - `Collector's Edition`
   - `First Edition`
   - `ARC` (Advance Reader Copy)
   - `Proof Copy`
   - `Graphic Novel`
   - `Manga`
   - `Comic`

---

## Error Logging & Admin Dashboard (Future)

**Prerequisite:** Role-based permissions system (admin role)

### Overview

Centralised error logging to capture JS errors, API failures, Firebase errors, and unhandled promise rejections. Stored in Firestore with an admin-only view in Settings.

### Firestore Structure

**Collection:** `/errorLogs` (top-level, admin-accessible)

```typescript
type ErrorLog = {
  id: string;
  message: string;
  stack?: string;
  type: 'runtime' | 'api' | 'firebase' | 'unhandled-rejection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  userAgent: string;
  userId?: string | null;
  userEmail?: string | null;
  context?: Record<string, unknown>;
  fingerprint: string;           // Hash for deduplication
  count: number;                 // Occurrence count
  firstOccurredAt: Timestamp;
  lastOccurredAt: Timestamp;
  resolved: boolean;
  resolvedAt?: Timestamp;
  resolvedBy?: string;
};
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `ErrorBoundary` | Catch React rendering errors, show fallback UI |
| `ErrorLoggerProvider` | Initialise global error handlers (window.onerror, unhandledrejection) |
| `error-logger.ts` | Core utility with queueing, rate limiting, fingerprinting |
| `/api/errors/log` | POST endpoint to receive and store errors |
| `/settings/error-logs` | Admin UI to view, filter, and resolve errors |

### Cost Control

- **Deduplication:** Same fingerprint updates count instead of new doc
- **Client batching:** Queue errors, flush every 5 seconds
- **Rate limiting:** Max 10 errors per minute client-side
- **Future:** Cloud Function to delete logs older than 30 days

### Admin Access Strategy

Initially use environment variable `ADMIN_USER_IDS` with comma-separated UIDs. Transition to proper role system when implemented:

```typescript
// Phase 1 (temporary): Check env var
const adminUids = process.env.NEXT_PUBLIC_ADMIN_USER_IDS?.split(',') || [];
return adminUids.includes(user.uid);

// Phase 2 (future): Check custom claims or Firestore user doc
// return user.customClaims?.role === 'admin';
```

### Implementation Plan

See `/Users/matthewfrench/.claude/plans/sleepy-rolling-haven.md` for detailed implementation steps.

---

## Security Considerations

### Authentication & Session Security

| Measure | Implementation | Status |
|---------|----------------|--------|
| **Firebase Auth** | Industry-standard auth provider | ✓ Active |
| **Session cookies** | httpOnly, secure, sameSite=strict | ✓ Active |
| **CSRF protection** | Token-based for mutations | ✓ Active |
| **Rate limiting** | Firebase security rules throttling | ✓ Active |

### Data Protection

| Measure | Implementation | Status |
|---------|----------------|--------|
| **Firestore rules** | User can only access own data | ✓ Active |
| **Storage rules** | User can only access own uploads | ✓ Active |
| **Input validation** | Zod schemas on all API routes | ✓ Active |
| **XSS prevention** | React auto-escaping, no dangerouslySetInnerHTML | ✓ Active |

### Future Security (Multi-User)

| Concern | Mitigation |
|---------|------------|
| **Public content moderation** | Report mechanism, admin review queue |
| **Rate limiting API** | Per-user request quotas |
| **Content size limits** | Max review length, image dimensions |
| **Spam prevention** | Captcha for public forms, email verification |

### Security Checklist

- [x] No secrets in client code (all in env vars)
- [x] Firebase Admin SDK on server only
- [x] User input sanitised before database writes
- [x] File uploads validated (type, size)
- [x] API routes validate authentication
- [ ] CSP headers (future hardening)
- [ ] Subresource Integrity for CDN assets (future)

---

## Performance Targets

### Core Web Vitals

| Metric | Target | Notes |
|--------|--------|-------|
| **LCP** (Largest Contentful Paint) | < 2.5s | Book list initial load |
| **FID** (First Input Delay) | < 100ms | Interaction responsiveness |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Stable layout during load |
| **TTFB** (Time to First Byte) | < 800ms | Server response time |

### App-Specific Targets

| Action | Target | Notes |
|--------|--------|-------|
| **Book list render** | < 500ms | For 100 books with covers |
| **Book lookup (API)** | < 2s | Google Books / Open Library |
| **Image upload** | < 3s | Up to 5MB image |
| **Filter/sort change** | < 100ms | Client-side operation |
| **Offline fallback** | Instant | Service worker cached shell |

### Optimisation Strategies

| Strategy | Implementation |
|----------|----------------|
| **Image optimisation** | Next.js Image component, WebP format |
| **Code splitting** | Dynamic imports for settings pages |
| **Firestore indexing** | Compound indexes for common queries |
| **Client caching** | SWR for book data, 5-minute stale time |
| **Static generation** | Marketing pages pre-rendered at build |

### Monitoring

| Metric | Tool | Frequency |
|--------|------|-----------|
| Core Web Vitals | Lighthouse CI | Per deploy |
| Firebase usage | Firebase Console | Weekly review |
| Error rates | Error logging (future) | Continuous |

---

## Testing Strategy

### Current Coverage

| Type | Tool | Status | Coverage |
|------|------|--------|----------|
| **E2E Tests** | Playwright | ✅ Active | 74 tests |
| **Unit Tests** | Vitest | 🔄 Planned | — |
| **Component Tests** | Vitest + RTL | 🔄 Planned | — |

### E2E Test Categories

| Category | Tests | Notes |
|----------|-------|-------|
| Authentication | Login, logout, session | Firebase Auth mocked |
| Book CRUD | Add, view, edit, delete | Full user flows |
| Book list | Filters, sorting, search | All combinations |
| Settings | All settings pages | Toggle states |
| Widgets | Dashboard widget config | Drag-drop, visibility |
| PWA | Offline behaviour | Service worker |

### Unit Test Priorities (Planned)

| Priority | Area | Reason |
|----------|------|--------|
| High | Utility functions | Pure functions, easy to test |
| High | Zod schemas | Validation edge cases |
| Medium | Hooks | Data fetching, state logic |
| Medium | Repository layer | Firestore query building |
| Low | UI components | Covered by E2E |

### Test Commands

```bash
npm test              # Run unit tests (Vitest)
npm run test:e2e      # Run E2E tests (Playwright)
npm run test:e2e:ui   # Playwright with UI
npm run test:coverage # Unit test coverage report
```

### CI/CD Integration

| Stage | Tests Run | Blocking |
|-------|-----------|----------|
| Pre-commit | Lint only | Yes |
| PR opened | E2E full suite | Yes |
| Merge to main | E2E + deploy preview | Yes |
| Production deploy | E2E smoke tests | Yes |

---

## Known Limitations

### Technical Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Firebase free tier** | 50K reads/day, 20K writes/day | Monitor usage, optimize queries |
| **Google Books API** | 1000 requests/day | Open Library fallback, client caching |
| **Netlify free tier** | 100GB bandwidth/month | Image optimization, CDN caching |
| **No server-side search** | Full-text search client-side only | Consider Algolia at scale |

### Feature Limitations

| Limitation | Impact | Future Solution |
|------------|--------|-----------------|
| **Single user only** | No sharing or social features | Multi-user architecture planned |
| **No dark mode** | User preference not respected | Planned feature |
| **English only** | Limited international audience | i18n infrastructure planned |
| **Manual book entry** | No auto-import from other apps | Import feature planned |
| **No reading timer** | Can't track reading sessions | Timer feature planned |

### Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome/Edge | ✅ Full | Primary development browser |
| Safari | ✅ Full | iOS PWA tested |
| Firefox | ✅ Full | — |
| IE11 | ❌ None | No polyfills provided |

### Known Issues

| Issue | Severity | Workaround |
|-------|----------|------------|
| Large libraries (500+ books) may have slow initial load | Medium | Pagination planned |
| Barcode scanner requires HTTPS | Low | Use production URL |
| Some ISBNs not found in APIs | Low | Manual entry available |

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

### Typography

**Current:** System font stack (default Tailwind)

**Future consideration:** Investigate more distinctive font to strengthen brand identity. Options to explore:
- Serif accent font for headings (literary feel)
- Custom web font for logo/branding only
- Variable font for performance

### API References
- [Firebase Auth](https://firebase.google.com/docs/auth/web/start)
- [Firebase Firestore](https://firebase.google.com/docs/firestore/quickstart)
- [Google Books API](https://developers.google.com/books/docs/v1/using)
- [Open Library API](https://openlibrary.org/dev/docs/api/books)

---

*Last updated: 2026-01-01* (Visual polish: BookCover component with loading spinners, BottomSheet swipe-to-dismiss, profile photo modal improvements)
