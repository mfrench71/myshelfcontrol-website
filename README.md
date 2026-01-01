# MyShelfControl

A mobile-friendly book tracking PWA built with Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Hosting**: Netlify

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant guidelines
- [docs/PROJECT.md](./docs/PROJECT.md) - Full project documentation
- [docs/AUDITS.md](./docs/AUDITS.md) - Periodic audit checklists
- [docs/adr/](./docs/adr/) - Architecture Decision Records

## Features

- Book collection management (CRUD)
- ISBN barcode scanning
- Google Books + Open Library API integration
- Custom genres with colours
- Book series tracking
- Reading status (Want to Read, Reading, Finished)
- Star ratings
- Wishlist for books to buy
- Soft-delete bin (30-day restore)
- Dashboard widgets (configurable)
- Custom cover image upload
- Export/import backup (JSON)
- PWA with offline support
