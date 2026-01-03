# ADR-003: Author Sorting Logic

## Status

Implemented

## Context

Authors need to be sorted differently depending on the context:
- Filter dropdowns should prioritise frequently-used authors
- Book list sorting by author should follow library conventions (by surname)
- Typeahead suggestions should show most relevant first

## Decision

Use different sorting logic depending on context:

| Context | Sorting Logic |
|---------|--------------|
| **Author Filter Dropdown** | By book count first (most used), then alphabetically by full name |
| **Book List "Author A-Z"** | By surname (last word of author name) |
| **Author Typeahead** | By book count first, then alphabetically |

### Surname Extraction

The `getAuthorSurname()` utility extracts surnames:

- "First Last" → "last"
- "First Middle Last" → "last"
- "Last, First" → "last" (comma format)

## Consequences

### Positive

- Filter dropdown shows most relevant authors first
- Book list sorting matches library conventions
- Typeahead surfaces frequently-used authors

### Negative

- Surname extraction is heuristic and may fail for:
  - Non-Western name formats
  - Pseudonyms
  - Single-name authors

### Future Enhancement

Consider adding surname display in author dropdowns if users request it.
