# ADR-002: Form Dirty State Tracking

## Status

Implemented

## Context

Forms throughout the app need to track whether the user has made unsaved changes. This prevents:
- Accidental data loss when navigating away
- Unnecessary API calls when nothing changed
- Confusion about whether changes have been saved

## Decision

Track unsaved changes by comparing current form values against initial values.

### Implementation Pattern

```tsx
const [initialValues] = useState(props.initial);
const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);

<button disabled={!hasChanges || saving}>Save</button>
```

### Current Usage

- Book add/edit forms
- Settings forms (profile, preferences)
- Reading dates modal (compares initial vs current dates)
- Notes modal (compares initial vs current text)
- Series/Genre edit modals

### Visual Indicators

- **Save button:** Disabled when no changes detected
- **Optional:** Visual indicator when form has unsaved changes

## Consequences

### Positive

- Prevents accidental data loss
- Clear feedback about save button state
- Reduces unnecessary API calls
- Consistent pattern across all forms

### Negative

- JSON.stringify comparison can be slow for very large objects
- Deep equality check may miss some edge cases

### Future Enhancement

- Add `beforeunload` warning for unsaved changes
- Consider `useBeforeUnload` hook from React Router patterns
- Add visual "unsaved changes" indicator
