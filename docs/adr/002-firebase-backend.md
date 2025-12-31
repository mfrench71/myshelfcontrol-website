# ADR 002: Firebase as Backend Platform

**Status**: Accepted

**Date**: 2025-12-31

## Context

MyBookShelf needs a backend for:

- **User authentication** - Email/password sign-up and login
- **Data storage** - Books, genres, series, wishlists, user preferences
- **File storage** - User-uploaded book cover images
- **Real-time sync** - Changes sync across devices (future)

We need a solution that:

1. Requires minimal backend code
2. Has generous free tier for development and small user bases
3. Supports offline-first for PWA experience
4. Scales without operational complexity
5. Provides secure, per-user data isolation

## Decision

Continue using **Firebase** (same project from legacy app: `book-tracker-b786e`) with:

- **Firebase Authentication** - Email/password auth
- **Cloud Firestore** - NoSQL document database
- **Firebase Storage** - File storage for images
- **Firebase Admin SDK** - Server-side operations in API routes

### Why Firebase?

| Requirement | Firebase Solution |
|-------------|-------------------|
| Auth | Firebase Auth with email/password |
| Database | Firestore with offline persistence |
| File storage | Firebase Storage |
| Free tier | Generous limits (see below) |
| Offline | Firestore offline persistence |
| Security | Firestore Security Rules |

### Why not other options?

| Alternative | Considered | Reason for Not Choosing |
|-------------|------------|------------------------|
| **Supabase** | Yes | Would require data migration, PostgreSQL less suited for offline |
| **PlanetScale** | Yes | No offline support, separate auth needed |
| **MongoDB Atlas** | Yes | No built-in auth, less offline support |
| **Custom backend** | No | Too much operational complexity |

### Firestore Free Tier Limits (Spark Plan)

| Resource | Free Limit |
|----------|------------|
| Document reads | 50,000/day |
| Document writes | 20,000/day |
| Document deletes | 20,000/day |
| Storage | 1 GB |
| Bandwidth | 10 GB/month |

For a personal book tracking app, this is more than sufficient. A user with 500 books might use ~500-1000 reads per session.

## Consequences

### Positive

- **No migration needed** - Same database as legacy app, existing users keep their data
- **Proven solution** - Already working in production
- **Offline-first** - Firestore has excellent offline persistence
- **Security** - Per-user data isolation via Security Rules
- **Real-time** - Can add real-time sync features later
- **Free** - Spark plan sufficient for development and small user base

### Negative

- **Vendor lock-in** - Firebase is Google-owned, migration would require data export
- **Cost at scale** - Firestore can get expensive with heavy usage
- **NoSQL limitations** - Complex queries can be challenging
- **Rules complexity** - Security Rules can become hard to maintain

### Multi-User Considerations

For multi-user features, we need to update:

1. **Security Rules** - Allow public reads on visible content:
   ```
   allow read: if resource.data.visibility == 'public'
               || request.auth.uid == userId;
   ```

2. **Data structure** - Add visibility fields, user profiles collection

3. **Server-side validation** - Use Firebase Admin SDK in API routes for complex permission checks

## Data Structure

Current (single-user):
```
/users/{userId}/
  /books/{bookId}
  /genres/{genreId}
  /series/{seriesId}
  /wishlist/{itemId}
  /bin/{bookId}
```

Planned (multi-user additions):
```
/profiles/{username}/       # Public user profiles
/shared/{shareId}/          # Shared lists/books
/clubs/{clubId}/            # Book clubs (future)
```
