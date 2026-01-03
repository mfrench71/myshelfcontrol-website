# ADR-004: Book Notes - Single Field

## Status

Implemented

## Context

Users need a way to add personal notes to books. Two approaches were considered:
1. Single note field (static, overwritten)
2. Multiple journal entries (timestamped, chronological)

### Competitor Analysis (Jan 2026)

| App | Approach | Notes |
|-----|----------|-------|
| **Goodreads** | Single note field | One private notes field, updated/overwritten. Browser-only (not in app). |
| **StoryGraph** | Multiple journal entries | Each progress update can include a note. Creates chronological "Reading Journal" per book. Private by default. |

**Key differences:**
- Goodreads: Single field for static info ("who recommended this")
- StoryGraph: Journal entries tied to reading progress, allowing reactions/quotes as you read

## Decision

Start with a **single note field** for MVP.

### Single Note Works Well For

- Who recommended the book
- Brief personal thoughts
- Quick reference info

### Journal Entries Would Enable (Future)

- Reading reactions over time
- Tracking favourite quotes with page numbers
- Detailed progress thoughts
- Timestamped reading experience log

## Consequences

### Positive

- Simple implementation
- Covers most common use cases
- No complex UI needed

### Negative

- Can't track thoughts over time
- Overwrites previous notes
- No quote capture with page numbers

### Future Implementation Path

1. **Phase 1 (current):** Single note field ✓
2. **Phase 2:** Add optional note when updating reading progress
3. **Phase 3:** Full reading journal view (per-book and combined)

## References

- [StoryGraph Private Notes Feature Request](https://roadmap.thestorygraph.com/requests-ideas/posts/private-notes-on-books-1)
- [Goodreads vs StoryGraph Comparison](https://laurieisreading.com/2024/01/07/discussion-goodreads-vs-the-storygraph/)
