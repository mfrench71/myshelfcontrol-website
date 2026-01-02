/**
 * Unit Tests for lib/utils/changelog.ts
 * Tests for changelog parsing and version utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module before importing changelog
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}));

import fs from 'fs';
import { getChangelog, getBuildVersion, type ChangelogEntry } from '../changelog';

describe('changelog', () => {
  const mockReadFileSync = vi.mocked(fs.readFileSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChangelog', () => {
    it('returns empty array when CHANGELOG.md not found', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const result = getChangelog();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('CHANGELOG.md not found');
      consoleSpy.mockRestore();
    });

    it('parses single entry correctly', () => {
      const changelogContent = `# Changelog

## 02-01-2025
- Added new feature
- Fixed a bug
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('02-01-2025');
      expect(result[0].items).toEqual(['Added new feature', 'Fixed a bug']);
    });

    it('parses multiple entries correctly', () => {
      const changelogContent = `# Changelog

## 02-01-2025
- Second update
- Another change

## 01-01-2025
- First update
- Initial change
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('02-01-2025');
      expect(result[0].items).toEqual(['Second update', 'Another change']);
      expect(result[1].date).toBe('01-01-2025');
      expect(result[1].items).toEqual(['First update', 'Initial change']);
    });

    it('formats display date in British format', () => {
      const changelogContent = `## 25-12-2025
- Christmas update
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].displayDate).toBe('25 December 2025');
    });

    it('handles single item entries', () => {
      const changelogContent = `## 01-01-2025
- Single item
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].items).toEqual(['Single item']);
    });

    it('ignores empty bullet points', () => {
      const changelogContent = `## 01-01-2025
- Valid item
-
-
- Another valid item
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].items).toEqual(['Valid item', 'Another valid item']);
    });

    it('ignores non-date headings', () => {
      const changelogContent = `# Changelog

## Introduction
Some text here

## 01-01-2025
- Actual entry
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('01-01-2025');
    });

    it('ignores lines that are not headings or bullet points', () => {
      const changelogContent = `## 01-01-2025
- First item
Some random text
Another random line
- Second item
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].items).toEqual(['First item', 'Second item']);
    });

    it('handles empty changelog file', () => {
      mockReadFileSync.mockReturnValue('');

      const result = getChangelog();

      expect(result).toEqual([]);
    });

    it('handles changelog with only heading', () => {
      mockReadFileSync.mockReturnValue('# Changelog\n');

      const result = getChangelog();

      expect(result).toEqual([]);
    });

    it('handles date with no items', () => {
      const changelogContent = `## 01-01-2025

## 02-01-2025
- Has items
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result).toHaveLength(2);
      expect(result[0].items).toEqual([]);
      expect(result[1].items).toEqual(['Has items']);
    });

    it('trims whitespace from items', () => {
      const changelogContent = `## 01-01-2025
-    Lots of spaces
- Normal item
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].items).toEqual(['Lots of spaces', 'Normal item']);
    });

    it('parses various UK date formats correctly', () => {
      const changelogContent = `## 01-01-2025
- January entry

## 15-06-2025
- June entry

## 31-12-2025
- December entry
`;
      mockReadFileSync.mockReturnValue(changelogContent);

      const result = getChangelog();

      expect(result[0].displayDate).toBe('1 January 2025');
      expect(result[1].displayDate).toBe('15 June 2025');
      expect(result[2].displayDate).toBe('31 December 2025');
    });
  });

  describe('getBuildVersion', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns version from environment variable', () => {
      process.env.NEXT_PUBLIC_BUILD_VERSION = '2025.01.02';

      const result = getBuildVersion();

      expect(result).toBe('2025.01.02');
    });

    it('returns "dev" when environment variable is not set', () => {
      delete process.env.NEXT_PUBLIC_BUILD_VERSION;

      const result = getBuildVersion();

      expect(result).toBe('dev');
    });

    it('returns "dev" when environment variable is empty', () => {
      process.env.NEXT_PUBLIC_BUILD_VERSION = '';

      const result = getBuildVersion();

      expect(result).toBe('dev');
    });
  });
});
