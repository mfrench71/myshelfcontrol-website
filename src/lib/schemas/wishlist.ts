/**
 * Wishlist Validation Schemas
 * Zod schemas for wishlist form validation
 */
import { z } from 'zod';
import { BookCoversSchema } from './book';

/**
 * Priority levels for wishlist items
 */
export const WishlistPrioritySchema = z.enum(['high', 'medium', 'low']).nullable();

/**
 * ISBN validation - accepts ISBN-10 or ISBN-13 with optional dashes
 */
const isbnSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => val?.replace(/[-\s]/g, '') || null)
  .refine(
    (val) => {
      if (!val) return true; // Optional
      return /^(\d{10}|\d{9}X|\d{13})$/i.test(val);
    },
    { message: 'Invalid ISBN format' }
  );

/**
 * Schema for creating/editing a wishlist item
 */
export const WishlistItemSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .transform((s) => s.trim()),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(200, 'Author must be 200 characters or less')
    .transform((s) => s.trim()),
  isbn: isbnSchema,
  coverImageUrl: z.string().url().nullable().optional().or(z.literal('')),
  covers: BookCoversSchema.nullable().optional(),
  publisher: z
    .string()
    .max(200, 'Publisher must be 200 characters or less')
    .nullable()
    .optional()
    .transform((s) => s?.trim() || null),
  publishedDate: z.string().nullable().optional(),
  pageCount: z
    .number()
    .int()
    .min(1, 'Page count must be at least 1')
    .max(50000, 'Page count seems too high')
    .nullable()
    .optional(),
  priority: WishlistPrioritySchema.optional(),
  notes: z
    .string()
    .max(5000, 'Notes must be 5000 characters or less')
    .nullable()
    .optional()
    .transform((s) => s?.trim() || null),
});

/**
 * Schema for updating a wishlist item (all fields optional except ID)
 */
export const WishlistUpdateSchema = WishlistItemSchema.partial();

/**
 * Schema for quick-add wishlist item (minimal required fields)
 */
export const QuickAddWishlistSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .transform((s) => s.trim()),
  author: z
    .string()
    .min(1, 'Author is required')
    .max(200, 'Author must be 200 characters or less')
    .transform((s) => s.trim()),
  isbn: isbnSchema,
  coverImageUrl: z.string().url().nullable().optional().or(z.literal('')),
  priority: WishlistPrioritySchema.optional(),
});

/** Inferred types from schemas */
export type WishlistItemData = z.infer<typeof WishlistItemSchema>;
export type WishlistUpdateData = z.infer<typeof WishlistUpdateSchema>;
export type QuickAddWishlistData = z.infer<typeof QuickAddWishlistSchema>;
export type WishlistPriority = z.infer<typeof WishlistPrioritySchema>;
