# Archive - Completed Features & Historical Documentation

This document contains completed features, migration history, and other historical documentation moved from PROJECT.md.

---

## Environment Variables

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

## Features Completed (from legacy app)

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

---

## Migration Status (Next.js Migration - Completed Dec 2024)

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

---

## Add Book UX Redesign (Completed Jan 2026)

**Implementation:** Search-first flow where the form is hidden until a book is found or user chooses manual entry.

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

**Location:** `src/app/(app)/books/add/page.tsx`

---

## Library Health Dashboard (Completed Jan 2026)

Implemented in Settings > Maintenance page with the following features:

- [x] Books missing cover image
- [x] Books missing genre
- [x] Books missing publisher/date/format/page count
- [x] Books missing ISBN tracking
- [x] Completeness score with progress bar
- [x] List of books with issues and quick-fix links

**Location:**
- `src/app/(app)/settings/maintenance/page.tsx`
- `src/lib/utils/library-health.ts`

---

## SEO References

- [Google: Block Search Indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: Control What You Share](https://developers.google.com/search/docs/crawling-indexing/control-what-you-share)
- [Lumar: How Google Deals With UGC](https://www.lumar.io/office-hours/user-generated-content/)
- [Meta Robots Tag Guide 2025](https://www.conductor.com/academy/meta-robots-tag/)
