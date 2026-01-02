# Changelog

All notable changes to MyShelfControl are documented here.

---

## 02-01-2026

- Add pre-commit hooks with husky (runs lint and tests before commit)
- Expand test coverage to all lib and component files (82% coverage)
- Add tests for AuthorPicker, RatingInput, CoverPicker, ErrorBoundary, SettingsHubCard, ServiceWorkerRegister, and changelog utilities
- Improve barcode scanner UI: full-screen camera, corner brackets, 10-second timeout hint
- Remove reading dates and notes from book add/edit pages (now managed via book view accordion)
- Refactor Reading Log and Notes into accordion UI on book view
- Add collapsible sections with smooth CSS grid animations
- Move status pill next to book title
- Add scroll fade indicators for filter panel (position-aware)
- Change 'Currently Reading' status label to 'Reading'
- Add clear button for finished date in edit dates modal
- Add tests for reading activity components and book-filters utilities
- Document form dirty state tracking pattern in PROJECT.md
- Make mobile filter bottom sheet footer sticky with Reset/Apply buttons
- Add disabled states to filter buttons when no filters active
- Update wishlist card styling to match book cards (cover size, font sizes, action placement)
- Add section sub-links to settings sidebar (desktop only)
- Add mobile section pills to Profile and Maintenance pages
- Remove duplicate "In this section" navigation from Library/Preferences pages
- Add section IDs to Profile and Maintenance pages
- Document cover image upload and barcode scanner in PROJECT.md
- Implement settings hub pattern with desktop sidebar
- Add fade transitions to add book page (search/form swap)
- Remove placeholder text from wishlist notes textarea
- Document wishlist competitor analysis and gaps in PROJECT.md
- Document settings hub vs tabs analysis in PROJECT.md
- Add wishlist button to search results (heart icon to add directly to wishlist)
- Add date added display to wishlist items (matches book card format)
- Fix duplicate key error in search results by using Google Books volume IDs
- Fix unnecessary API calls when search input unchanged
- Add dynamic indicator updates for wishlist, bin, and maintenance counts
- Update book-api to return ISBNs from search results
- Document wishlist features and OpenLibrary search enhancement in PROJECT.md
- Document admin documentation/FAQ system in PROJECT.md
- Add ErrorBoundary component for graceful error handling
- Fix orphaned data when deleting genres (books now updated atomically)
- Fix orphaned data when deleting series (books now updated atomically)
- Add batch merge functions for genres and series
- Extract shared book utilities (RatingInput, filterBooks, sortBooks)
- Fix React keys using array index in multiple components
- Update PWA service worker cache (add /settings/profile)
- Remove unused firebase-admin dependency
- Add code quality audit sections to documentation
- Add Knip for unused dependency/export detection
- Add Madge for circular dependency detection
- Add bundle analyzer for build size analysis
- Remove unused Prettier dependency
- Add ADR for code quality tooling decisions

---

## 31-12-2024

- Add Gravatar support for profile avatars
- Add email verification status with resend option
- Fix bottom sheet consistency across mobile/tablet
- Add password strength indicator to change password modal
- Add floating action button for quick book addition
- Add dirty state tracking for form save buttons
- Add double confirmation for account deletion

---

## 30-12-2024

- Add widget system for home dashboard
- Add series progress tracking widget
- Add recently finished books widget
- Add top rated books widget
- Add infinite scroll pagination to books list
- Add multi-select filters (genre, status, series)
- Add faceted filter counts
- Add URL state for shareable filtered views

---

## 29-12-2024

- Initial Next.js migration from 11ty
- Book list with filtering and sorting
- Add and edit book forms with validation
- ISBN barcode scanner for quick book entry
- Settings pages (Profile, Library, Preferences, Maintenance)
- PWA support with service worker
