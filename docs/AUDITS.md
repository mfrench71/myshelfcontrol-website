# Periodic Audit Checklists

Comprehensive checklists for periodic code quality and compliance reviews. Run these audits regularly (monthly or before major releases).

---

## Quick Commands

```bash
npm audit                    # Check for vulnerabilities
npm outdated                 # Check for outdated packages
npm run lint                 # ESLint check
npm run build                # TypeScript + build check
npm test                     # Unit tests
npm run test:e2e             # E2E + accessibility tests
npm run check:unused         # Knip unused deps/exports check
npm run check:circular       # Madge circular dependency check
npm run analyze              # Bundle analyzer (opens browser)
npx lighthouse http://localhost:3000 --view  # Performance audit
```

---

## Dependencies Audit

```bash
npm audit
npm outdated
```

- [ ] No high/critical vulnerabilities (`npm audit`)?
- [ ] Dependencies reasonably up to date (`npm outdated`)?
- [ ] No unused dependencies in package.json?
- [ ] Dependabot PRs reviewed and merged?

---

## PWA/Service Worker Audit

- [ ] Service worker registered successfully?
- [ ] Offline page works when network unavailable?
- [ ] Cache strategy appropriate? (network-first for API, cache-first for assets)
- [ ] manifest.json valid? (icons, theme colours, display mode)
- [ ] App installable on mobile?
- [ ] Cache version incremented after asset changes?

---

## Error Handling Audit

- [ ] All async operations have try/catch?
- [ ] User-friendly error messages shown (not raw `error.message`)?
- [ ] Errors logged to console for debugging?
- [ ] Network failures handled gracefully?
- [ ] Form submission errors don't lose user input?
- [ ] Firebase error codes mapped to friendly messages?

---

## SEO Audit

### Meta Tags & Open Graph
- [ ] Every page has unique `<title>` tag (50-60 chars)?
- [ ] Every page has `<meta name="description">` (150-160 chars)?
- [ ] Open Graph tags present? (`og:title`, `og:description`, `og:image`, `og:url`)
- [ ] Twitter Card meta tags present?
- [ ] Canonical URL set on all pages?
- [ ] Language attribute on `<html>` tag?

### Semantic HTML & Structure
- [ ] Single `<h1>` per page matching page purpose?
- [ ] Heading hierarchy correct? (h1 → h2 → h3, no skips)
- [ ] Semantic elements used? (`<main>`, `<nav>`, `<article>`, `<section>`)
- [ ] Images have descriptive `alt` text?
- [ ] Links have descriptive text (not "click here")?

### Technical SEO
- [ ] sitemap.xml exists and lists all public pages?
- [ ] robots.txt exists and allows crawling of public pages?
- [ ] No broken internal links (404s)?
- [ ] Page load time acceptable? (< 3 seconds)
- [ ] Mobile-friendly? (responsive, readable text, tap targets)

---

## Mobile UX Audit

### Touch Targets
- [ ] All interactive elements (buttons, links, inputs) minimum 44x44px?
- [ ] Icon-only buttons use `min-w-[44px] min-h-[44px]` with centered content?
- [ ] Adequate spacing between adjacent touch targets (8px+ gap)?

### Viewport & Safe Areas
- [ ] Viewport meta includes `viewport-fit=cover` for notch handling?
- [ ] Fixed elements use `env(safe-area-inset-*)` padding?
- [ ] Bottom sheets account for home indicator on iOS?

### Scrolling & Overflow
- [ ] No horizontal scroll on any page?
- [ ] Long text uses `break-words` or `truncate` where appropriate?
- [ ] Images constrained with `max-w-full`?
- [ ] Modals/sheets scrollable if content overflows?

### Forms & Input
- [ ] Input font size 16px+ to prevent iOS zoom on focus?
- [ ] Appropriate `inputmode` for keyboard type (`numeric`, `email`, `tel`)?
- [ ] `autocomplete` attributes for autofill support?
- [ ] Form errors visible without scrolling?

---

## Form Validation Audit

- [ ] All forms use Zod schemas (no manual `if (!value)` checks)?
- [ ] Input `name` attributes match schema field names exactly?
- [ ] Required fields marked with asterisk (`<span className="text-red-500">*</span>`)?
- [ ] Validation errors shown inline near field (not toast-only)?
- [ ] Error messages are helpful (not just "Invalid")?
- [ ] Form state preserved on validation failure?
- [ ] Submit button disabled during submission?
- [ ] Modal forms clear errors when opening?
- [ ] Success feedback shown after submission?

---

## UI Consistency Audit

### Toast Notifications
- [ ] Settings toggles use `info` type (grey)?
- [ ] Completed actions use `success` type (green)?
- [ ] Failed operations use `error` type (red)?

### Visual Styling
- [ ] Similar components styled consistently?
- [ ] Button colours follow semantic scheme (see CLAUDE.md)?
- [ ] Empty states use consistent icon size and text colours?
- [ ] Loading states (spinners/skeletons) consistent across pages?

---

## Core Web Vitals Audit

Test with Lighthouse or PageSpeed Insights.

### LCP (Largest Contentful Paint) - Target: < 2.5s
- [ ] Hero images optimised?
- [ ] Critical CSS inlined or loaded early?
- [ ] Web fonts preloaded?
- [ ] No render-blocking resources in `<head>`?

### CLS (Cumulative Layout Shift) - Target: < 0.1
- [ ] Images have explicit `width`/`height` or aspect-ratio?
- [ ] Dynamic content has reserved space (skeleton loaders)?
- [ ] No content inserted above existing content after load?

### INP (Interaction to Next Paint) - Target: < 200ms
- [ ] Event handlers complete quickly (< 50ms)?
- [ ] Heavy computations moved to Web Workers?
- [ ] DOM updates batched to minimise reflows?

---

## Privacy/GDPR Audit

### Data Collection & Consent
- [ ] Privacy policy exists and is up to date?
- [ ] Privacy policy accurately describes all data collected?
- [ ] Third-party services disclosed? (Firebase, book APIs)

### User Rights (GDPR Article 15-22)
- [ ] Users can view their data?
- [ ] Users can export their data?
- [ ] Users can delete their account and all data?
- [ ] Data deletion is complete?

### Data Security
- [ ] Sensitive data encrypted in transit? (HTTPS)
- [ ] No sensitive data in localStorage?
- [ ] Firestore rules restrict access to own data only?

---

## Accessibility Audit

### Automated Testing
```bash
npm run test:e2e  # Includes axe-core accessibility tests
```
- [ ] All axe-core tests pass?
- [ ] No critical or serious violations?

### Keyboard Navigation
- [ ] All interactive elements focusable with Tab?
- [ ] Focus order is logical?
- [ ] Focus indicator visible on all focusable elements?
- [ ] No keyboard traps?

### Screen Readers
- [ ] Page structure announced correctly?
- [ ] Images have appropriate alt text?
- [ ] Form inputs have associated labels?
- [ ] Error messages announced to screen readers?

### Visual
- [ ] Colour contrast meets WCAG AA (4.5:1 text)?
- [ ] Information not conveyed by colour alone?
- [ ] Animations respect `prefers-reduced-motion`?

---

## Security Audit

### XSS Prevention
- [ ] All user input escaped before rendering?
- [ ] No `dangerouslySetInnerHTML` with unsanitised user data?
- [ ] URL parameters validated before use?

### Input Validation
- [ ] All forms use Zod schemas?
- [ ] Server-side validation via API routes?
- [ ] File uploads validated (type, size)?

### Authentication & Authorisation
- [ ] Firestore rules restrict access to own data only?
- [ ] No sensitive data in localStorage?
- [ ] Session handling secure?
- [ ] Password requirements enforced (8+ chars)?

---

## Code Quality Audit

### Duplication & Dead Code
- [ ] No significant code duplication (DRY principle)?
- [ ] No unused exports or dead code?
- [ ] No commented-out code blocks?
- [ ] TODO/FIXME comments addressed or tracked?

### Complexity & Readability
- [ ] Functions under 50 lines?
- [ ] Components under 300 lines?
- [ ] Cyclomatic complexity reasonable (no deeply nested conditionals)?
- [ ] Variable/function names descriptive and consistent?
- [ ] Magic numbers extracted to named constants?

### Code Organisation
- [ ] Related code grouped logically?
- [ ] Consistent file naming conventions?
- [ ] Imports organised (external, internal, relative)?

---

## Performance Audit

### Bundle Size
```bash
npm run build  # Check .next output size
```
- [ ] No unnecessarily large dependencies?
- [ ] Dynamic imports used for heavy components?
- [ ] Tree-shaking working (no importing entire libraries)?

### React Rendering
- [ ] Expensive computations memoized with `useMemo`?
- [ ] Callback functions memoized with `useCallback` where needed?
- [ ] Components memoized with `React.memo` where beneficial?
- [ ] No unnecessary re-renders (check with React DevTools)?
- [ ] Lists have stable `key` props (not array index)?

### Images & Assets
- [ ] Images use Next.js `<Image>` component?
- [ ] Appropriate image formats (WebP where possible)?
- [ ] Images sized appropriately (not oversized)?
- [ ] Lazy loading for below-fold images?

### Data Fetching
- [ ] API calls cached/deduplicated where appropriate?
- [ ] Pagination for large datasets?
- [ ] Loading states prevent layout shift?

---

## Scalability Audit (Expanded)

### Firestore Patterns
- [ ] Queries use proper indexes (check Firebase console)?
- [ ] No N+1 query patterns (fetching in loops)?
- [ ] Batch writes used for multiple operations?
- [ ] Pagination implemented for collections that could grow large?
- [ ] Data denormalised where it reduces reads?

### Client-Side Performance
- [ ] Large lists virtualised (react-window/react-virtual)?
- [ ] Search/filter operations debounced?
- [ ] Heavy computations offloaded or cached?

### Data Structure
- [ ] Collections structured for query efficiency?
- [ ] No unbounded arrays in documents?
- [ ] Timestamps used for ordering (not client-side sorting)?

### Orphaned Data
- [ ] Deleted genres don't leave orphaned references in books?
- [ ] Deleted series don't leave orphaned references in books?
- [ ] Soft-deleted books properly moved to bin collection?
- [ ] Permanently deleted books remove associated images from storage?
- [ ] User account deletion removes all subcollections?
- [ ] No stale widget settings referencing deleted widgets?

---

## Architecture Audit

### Separation of Concerns
- [ ] UI components don't contain business logic?
- [ ] Data fetching separated from presentation?
- [ ] Repositories abstract database operations?
- [ ] Schemas handle validation (not components)?

### Dependency Direction
- [ ] No circular dependencies between modules?
- [ ] Components don't import from pages?
- [ ] Utilities don't import from components?

### Component Design
- [ ] Components have single responsibility?
- [ ] Props interfaces well-defined and minimal?
- [ ] No prop drilling beyond 2-3 levels (use context)?
- [ ] Shared UI in `components/ui/`, domain-specific in feature folders?

### File Structure
- [ ] Consistent directory structure?
- [ ] Colocated tests (`__tests__/` folders)?
- [ ] No orphaned files?

---

## React Best Practices Audit

### Hooks Usage
- [ ] `useEffect` dependencies complete and correct?
- [ ] No missing dependencies causing stale closures?
- [ ] Cleanup functions in effects that create subscriptions?
- [ ] No `useEffect` for derived state (use `useMemo`)?
- [ ] Custom hooks extract reusable logic?

### State Management
- [ ] State colocated to where it's used?
- [ ] No unnecessary lifting of state?
- [ ] Context used appropriately (not for frequently changing values)?
- [ ] No state that can be derived from other state?

### Component Patterns
- [ ] Controlled components for forms?
- [ ] Error boundaries for graceful failure?
- [ ] Suspense boundaries for async components?
- [ ] Forward refs where needed for DOM access?

---

## TypeScript Audit

### Type Safety
```bash
grep -r "any" src/ --include="*.ts" --include="*.tsx" | wc -l
```
- [ ] Minimal use of `any` type?
- [ ] No `@ts-ignore` or `@ts-expect-error` without justification?
- [ ] Strict mode enabled in tsconfig?
- [ ] No implicit `any` from missing types?

### Type Quality
- [ ] Props interfaces defined for all components?
- [ ] Return types explicit on exported functions?
- [ ] Discriminated unions for variant types?
- [ ] Proper type narrowing (not type assertions)?

### Type Organisation
- [ ] Types colocated with their usage?
- [ ] Shared types in central location?
- [ ] No duplicate type definitions?

---

## Test Coverage Audit

### Coverage Thresholds
- [ ] Lines: ≥60%
- [ ] Functions: ≥60%
- [ ] Branches: ≥50%
- [ ] Statements: ≥60%

```bash
npm run test:coverage
```

### Coverage Gaps
- [ ] New features have corresponding tests?
- [ ] Edge cases covered (empty states, errors, boundaries)?
- [ ] Integration points tested (API calls, Firebase)?
- [ ] UI components have render tests?

---

## Audit Schedule

| Audit | Frequency | Last Run |
|-------|-----------|----------|
| Dependencies | Weekly | |
| Security | Weekly | |
| Accessibility | Monthly | |
| Performance | Monthly | |
| Mobile UX | Monthly | |
| SEO | Quarterly | |
| Privacy/GDPR | Quarterly | |
| Browser Compatibility | Before major release | |

---

*Last updated: 2026-01-02*
