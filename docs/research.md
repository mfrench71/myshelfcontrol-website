# Research & Competitor Analysis

This document contains all competitor research, feature analysis, and market insights for Book Assembly.

---

## Key Competitors

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

---

## Multi-User Features Research

### Feature Comparison Matrix

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

### Privacy & Visibility Options

| App | Profile Visibility | Notes |
|-----|-------------------|-------|
| **Goodreads** | Public / Members / Friends | Reviews always public on book pages |
| **StoryGraph** | Public / Community / Private | Reviews visible regardless of profile setting |
| **Hardcover** | Public / Private / Friends | Per-book privacy available |
| **BookTrack** | Private only | No social features by design |

### Key Insights

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

---

## Display Name & User Profile Research (Jan 2026)

### Current State

Book Assembly uses **email as the primary identifier**:
- Email displayed in header menus (mobile & desktop)
- Avatar shows: custom photo → Gravatar → first letter of email
- No editable display name or profile info beyond email
- Firebase `displayName` field exists but is unused

### Competitor Comparison

| Feature | Goodreads | StoryGraph | Hardcover | Literal |
|---------|-----------|------------|-----------|---------|
| **Display Name** | First + Last | Username only | Username | First + Last |
| **Username/URL** | Yes | Yes | Yes | Yes |
| **Pronouns** | No | Yes | ? | ? |
| **Bio** | Yes | Yes (160 chars) | Yes | Yes |
| **Last Name Privacy** | Yes | N/A | N/A | ? |
| **Per-Book Privacy** | No | No | Yes | No |

### Goodreads

**Fields available:**
- First Name (required) - what's publicly displayed
- Middle Name (optional)
- Last Name (optional)
- Custom Username/URL for profile

**Privacy options:**
- "Show my last name to" with radio options:
  - "Anyone (including search engines)"
  - "Friends only"

**Key insight:** Users can put full name in "First Name" field for display purposes.

### StoryGraph

**Current fields:**
- Username (required, used for profile URL)
- Profile photo
- Pronouns
- Bio (160 chars max)
- Social media links

**No display name yet** - it's a [popular feature request](https://roadmap.thestorygraph.com/requests-ideas/posts/add-display-name-for-user-profile). Users want real names shown instead of usernames like "r3adalotofbooks".

**Privacy levels:**
- Private (friends only see profile)
- Community (signed-in users only)
- Public (anyone)

### Hardcover

**Profile options:**
- Username for profile URL
- Profile photo
- Per-book privacy: public, friends only, private
- Overall profile: public, private, friends-only

### Literal Club

**Fields collected:**
- Email
- First Name
- Last Name
- Username

### Recommendations for Book Assembly

**Minimum Viable Profile:**
1. **Display Name** (optional) - shown instead of email
2. **Privacy toggle** - "Show email to others" (for future social features)

**Enhanced Profile (Future):**
- Pronouns
- Short bio
- Social links
- Username for shareable profile URL

**Privacy Considerations:**
- Default to private (don't show email)
- Display name optional (fallback to email initial)
- Consider UK GDPR implications for storing additional PII

**Sources:**
- [Goodreads Help - Edit Profile Settings](https://help.goodreads.com/s/article/How-do-I-edit-my-profile-settings)
- [StoryGraph Display Name Request](https://roadmap.thestorygraph.com/requests-ideas/posts/add-display-name-for-user-profile)

---

## Additional Features Research (Dec 2025)

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

### DNF Tracking

- **StoryGraph/Pagebound/Tome**: DNF in status dropdown
- **Reading Journey**: "DNF Graveyard" feature
- Track pages read before abandoning
- Optional review of why book was abandoned

### Content Warnings

StoryGraph implementation:
- User specifies content to avoid in preferences survey
- Books filtered from recommendations automatically
- Warning symbols shown on book pages
- Traffic light severity system (planned)
- Community-sourced via [BookTriggerWarnings.com](https://booktriggerwarnings.com/)

### Edition/Version Handling

- **StoryGraph**: Each edition is separate item (controversial but necessary)
- **BookTrack**: ISBN-based exact matching for metadata accuracy
- **Challenge**: Users want to track physical + audiobook of same title
- **Consideration**: Show "You've read another edition" on book pages

### Reread Tracking

- **Bookmory**: Explicit "Reread" section with history
- **Goodreads**: Limited - rereads don't count toward reading challenges
- **Best practice**: Track each read date separately, show reread count

---

## Feature Inspiration Summary

- **Reading Timer**: Track sessions, calculate reading speed, ambient sounds, reading speed prediction
- **Reading Progress**: Daily page tracking, visual progress bars, reading calendar with covers, multi-device sync
- **Mood Tracking**: Tag by mood, pacing, content warnings with severity levels, emotion journaling per session
- **Gamification**: Streaks, badges, annual challenges, progress bars, Year in Review/Reading Wrapped
- **Quote Capture**: OCR from photos, reading journal, highlight capture, Kindle sync, markdown formatting
- **Advanced Stats**: Year-over-year comparison, custom charts, reading speed trends, sub-ratings, ratings histogram
- **Privacy**: Per-book visibility, anonymous browsing mode, anonymous social profiles, spoiler tags in reviews
- **Social**: Buddy reads, readalongs, direct messaging, per-book discussion forums, match percentage
- **Book Management**: Paused status, DNF with page tracking, edition handling, reread tracking, character tracker
- **TBR Management**: Manual drag-drop sorting, smart tags, priority queue
- **Book Metadata**: Purchase price/date, start/end pages, Bluetooth bulk scanning
- **Wishlist**: Price drop alerts, library availability (Libby/OverDrive)
- **Notifications**: New release alerts for followed authors, wishlist release notifications
- **AI Features**: Book chat assistant, summaries without spoilers (emerging 2025 trend)

---

## Author Pages Competitor Analysis

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

## Wishlist Competitor Analysis

| Feature | Goodreads | StoryGraph | Amazon Kindle |
|---------|-----------|------------|---------------|
| **Price Displayed** | Deals only | No | ✓ |
| **Release Date** | ✓ | ✓ | ✓ |
| **Priority Ranking** | Custom shelves | Up Next (5 books) | List priority |
| **Gift List Feature** | Workaround | Planned | ✓ (registry) |
| **Library Availability** | Via extensions | No | No |

### Additional Wishlist Fields (Gaps to Consider)

Based on competitor analysis (Goodreads, StoryGraph, BookBuddy):

| Field | Competitor Support | Effort | Value | Notes |
|-------|-------------------|--------|-------|-------|
| **Recommended By** | Goodreads ✓ | Low | Medium | Text field - remember who suggested the book |
| **Expected Price** | None | Low | Medium | Currency field for budget tracking |
| **Custom Tags** | Goodreads, StoryGraph ✓ | Medium | Medium | Beyond priority - e.g. "gift idea", "holiday read" |
| **Where to Buy Link** | Goodreads ✓ | Low | Low | URL field - affiliate/ethical concerns |
| **Barcode Scan to Wishlist** | All competitors ✓ | Medium | High | Scan ISBN → add directly to wishlist |

**Current advantage over competitors:** Book Assembly has explicit 3-level priority system. Goodreads requires workarounds (custom shelves, manual shelf positioning). StoryGraph limits "Up Next" to 5 books.

### Recommended Wishlist Implementation

**High Priority:**
1. **Manual Entry** - Quick-add modal
2. **Barcode Scan to Wishlist** - Scan → add to wishlist flow from wishlist page
3. **Import from Goodreads** - CSV import for want-to-read shelf

**Medium Priority:**
4. **Recommended By Field** - Simple text field addition
5. **Release Date Display** - Show publication date for upcoming books
6. **Release Notifications** - Alert when wishlisted books release

**Low Priority:**
7. **Expected Price Field** - Budget tracking
8. **Custom Tags** - Flexible organisation beyond priority
9. **Library Availability** - Check Libby/OverDrive availability
10. **Shareable Wishlists** - Public link for gift coordination
11. **Price Drop Alerts** - Notify when wishlisted books go on sale (integration with price trackers)

---

## Research Sources

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
- [Bookmory](https://play.google.com/store/apps/details?id=net.tonysoft.bookmory)
- [BookBuddy](https://apps.apple.com/us/app/bookbuddy-book-tracker/id395150347)
- [Libby/OverDrive](https://www.overdrive.com/apps/libby)
- [Jelu (self-hosted)](https://github.com/bayang/jelu)
- [Keepa Price Tracker](https://keepa.com/)
