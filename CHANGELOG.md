# Changelog

All notable changes to MyShelfControl are documented here.

---

## 2025-01-02

- Add ErrorBoundary component for graceful error handling
- Fix orphaned data when deleting genres (books now updated atomically)
- Fix orphaned data when deleting series (books now updated atomically)
- Add batch merge functions for genres and series
- Extract shared book utilities (RatingInput, filterBooks, sortBooks)
- Fix React keys using array index in multiple components
- Update PWA service worker cache (add /settings/profile)
- Remove unused firebase-admin dependency
- Add code quality audit sections to documentation

---

## 2024-12-31

- Add Gravatar support for profile avatars
- Add email verification status with resend option
- Fix bottom sheet consistency across mobile/tablet
- Add password strength indicator to change password modal
- Add floating action button for quick book addition
- Add dirty state tracking for form save buttons
- Add double confirmation for account deletion

---

## 2024-12-30

- Add widget system for home dashboard
- Add series progress tracking widget
- Add recently finished books widget
- Add top rated books widget
- Add infinite scroll pagination to books list
- Add multi-select filters (genre, status, series)
- Add faceted filter counts
- Add URL state for shareable filtered views

---

## 2024-12-29

- Initial Next.js migration from 11ty
- Book list with filtering and sorting
- Add and edit book forms with validation
- ISBN barcode scanner for quick book entry
- Settings pages (Profile, Library, Preferences, Maintenance)
- PWA support with service worker
