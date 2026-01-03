# ADR-001: Settings Page Hub Pattern

## Status

Implemented (02-01-2025)

## Context

The settings page needed a navigation pattern to organise multiple settings categories (Profile, Library, Preferences, Maintenance, Support, About). The previous approach used horizontal tabs.

### Competitor Analysis

| App | Pattern | Notes |
|-----|---------|-------|
| **iOS Settings** | Hub + Drill-down | Gold standard - grouped list with subscreens |
| **Android Settings** | Hub + Drill-down | Material Design recommended pattern |
| **Goodreads** | Hamburger → List | Settings via menu, then list layout |
| **StoryGraph** | Hamburger → Page | Simpler settings, single page with sections |
| **Spotify** | Hub + Drill-down | Profile icon → Settings list → Subscreens |
| **Instagram** | Hub + Drill-down | Settings list with grouped categories |

**Finding:** Native apps and major mobile apps overwhelmingly use hub pattern, not horizontal tabs.

### Pattern Comparison

| Aspect | **Hub Pattern** | **Horizontal Tabs** |
|--------|-----------------|---------------------|
| Clicks to setting | 2-3 clicks | 1-2 clicks |
| Mobile friendliness | Excellent (vertical list) | Moderate (horizontal scroll) |
| Scalability | High (unlimited sections) | Limited (5-7 tabs max) |
| Cognitive load | Low (one section at a time) | Higher (multiple visible) |
| iOS/Android convention | Follows native patterns | Custom pattern |
| Thumb reachability | Natural scrolling | Requires reach to top |
| Hidden content risk | None | Tabs may scroll off-screen |

## Decision

Use the **Hub Pattern** for settings navigation.

Per [Android Design Guidelines](https://developer.android.com/design/ui/mobile/guides/patterns/settings) and [NN/g Tab Guidelines](https://www.nngroup.com/articles/tabs-used-right/):

- Tabs work best with ≤5 options (we have 6)
- Settings are infrequently accessed (hub adds one tap, acceptable)
- Mobile-first PWA should follow mobile conventions
- Hub scales if we add more settings categories

### Implementation Details

- **Mobile:** `/settings` shows hub cards, tap drills down to sub-page
- **Mobile:** Section pills for in-page navigation (visible on md and below)
- **Desktop:** Sidebar always visible, `/settings` redirects to `/settings/profile`
- **Desktop:** Sub-links appear under active section for in-page navigation
- **Components:** `SettingsHubCard`, `SettingsSidebarLink`
- **Animations:** Staggered card fade-in, press effect

### Sub-Section Access from Hub

**Question:** Should hub items show expandable sub-sections inline?

**Decision:** No - keep it simple.

1. **Consistency:** iOS/Android don't expand settings inline
2. **Complexity:** Adds UI state management for minimal benefit
3. **Discoverability:** Users expect tap → drill-down pattern
4. **Alternative:** Show status/summary text on hub items instead

**Better approach:** Show contextual info on hub cards:
```
┌─────────────────────────────────────────┐
│ Maintenance                        (3) →│
│    3 issues found in your library       │
└─────────────────────────────────────────┘
```

## Consequences

### Positive

- Consistent with native app patterns users already know
- Scales well as settings grow
- Works well on mobile (thumb-friendly)
- Clean, uncluttered UI

### Negative

- One extra tap to reach settings (acceptable trade-off)
- Desktop users might prefer seeing all options at once

### Future Improvements

1. Status indicators on hub cards (counts/issues)
2. Settings search for 15+ options
3. Keyboard shortcut (Cmd/Ctrl+,) for power users
4. Surface frequently-used settings (dark mode toggle) in header
