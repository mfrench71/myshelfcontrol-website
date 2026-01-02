# ADR 003: Code Quality Tooling

**Status**: Accepted

**Date**: 2026-01-02

## Context

As the codebase grows, we need automated tools to catch issues that manual review might miss:

- **Unused dependencies** - Bloat bundle size and create maintenance burden
- **Unused exports** - Dead code that clutters the codebase
- **Circular dependencies** - Can cause runtime issues and indicate poor architecture
- **Bundle size** - PWA performance depends on keeping bundles small

We also had Prettier installed but not configured or used - the codebase was already consistently formatted through manual discipline.

## Decision

### Add: Knip (unused dependency/export detection)

```bash
npm run check:unused
```

Knip scans the codebase for:
- Unused dependencies in package.json
- Unused exports (functions, types, constants)
- Unused files

Configuration in `knip.json` handles Next.js conventions and test files.

### Add: Madge (circular dependency detection)

```bash
npm run check:circular
```

Detects circular import chains that can cause:
- Runtime errors (undefined imports)
- Difficult-to-debug issues
- Poor architectural boundaries

### Add: Bundle Analyzer

```bash
npm run analyze
```

Visualises bundle composition to identify:
- Large dependencies that could be replaced
- Code that should be dynamically imported
- Opportunities for tree-shaking

### Remove: Prettier

Prettier was installed but never configured. Analysis showed:
- 100% consistent single quotes across 305 files
- Consistent semicolon usage
- Consistent 2-space indentation

Since the codebase is already consistently formatted through ESLint and team discipline, Prettier adds complexity without benefit.

### Not chosen: Biome

Biome (Rust-based linter/formatter) was considered but rejected:
- Would require migrating from ESLint 9 flat config (which is modern and working well)
- Less mature ecosystem
- Formatting not needed (code already consistent)
- Migration cost not justified for this project size

## Consequences

### Positive

- **Catch unused code automatically** - Knip found an unused barrel file and confirmed Prettier was unused
- **Prevent architectural issues** - Madge ensures clean dependency graph
- **Monitor bundle size** - Can catch accidental large imports
- **Cleaner dependencies** - Removed unused Prettier

### Negative

- **Additional dev dependencies** - Knip, Madge, @next/bundle-analyzer
- **CI time** - Additional checks to run (though all are fast)

### Neutral

- **No formatter** - Relying on ESLint and discipline; may revisit if consistency degrades

## Commands Added

| Command | Tool | Purpose |
|---------|------|---------|
| `npm run check:unused` | Knip | Find unused deps/exports |
| `npm run check:circular` | Madge | Find circular imports |
| `npm run analyze` | Bundle Analyzer | Visualise bundle size |
