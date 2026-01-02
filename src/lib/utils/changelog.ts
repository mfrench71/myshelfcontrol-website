/**
 * Changelog Parser
 * Parses CHANGELOG.md to extract entries for display
 * Used by About page to show version history
 */

import fs from 'fs';
import path from 'path';

export type ChangelogEntry = {
  date: string;
  displayDate: string;
  items: string[];
};

/**
 * Format ISO date (YYYY-MM-DD) to human-readable British format
 */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Parse CHANGELOG.md and return structured entries
 * This runs at build time / on the server
 */
export function getChangelog(): ChangelogEntry[] {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  let content: string;
  try {
    content = fs.readFileSync(changelogPath, 'utf8');
  } catch {
    console.warn('CHANGELOG.md not found');
    return [];
  }

  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;

  for (const line of content.split('\n')) {
    // Match date headings: ## 2025-01-02
    const dateMatch = line.match(/^## (\d{4}-\d{2}-\d{2})$/);
    if (dateMatch) {
      if (currentEntry) entries.push(currentEntry);
      currentEntry = {
        date: dateMatch[1],
        displayDate: formatDate(dateMatch[1]),
        items: [],
      };
      continue;
    }

    // Match bullet points: - Some text here
    if (currentEntry && line.startsWith('- ')) {
      const item = line.slice(2).trim();
      if (item) {
        currentEntry.items.push(item);
      }
    }
  }

  if (currentEntry) entries.push(currentEntry);

  return entries;
}

/**
 * Get the build version from environment
 * Format: YYYY.MM.DD
 */
export function getBuildVersion(): string {
  return process.env.NEXT_PUBLIC_BUILD_VERSION || 'dev';
}
