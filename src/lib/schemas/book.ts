/**
 * Book Validation Schemas
 * Zod schemas for book form validation
 */
import { z } from 'zod';

/**
 * Physical format options for books
 */
export const PhysicalFormatSchema = z.enum([
  '',
  'Paperback',
  'Hardcover',
  'Mass Market Paperback',
  'Trade Paperback',
  'Library Binding',
  'Spiral-bound',
  'Audio CD',
  'Ebook',
]);

/**
 * Reading status options
 */
export const ReadingStatusSchema = z.enum(['to-read', 'reading', 'completed', 'dnf']);

/**
 * ISBN validation - accepts ISBN-10 or ISBN-13 with optional dashes
 */
const isbnSchema = z
  .string()
  .optional()
  .transform((val) => val?.replace(/[-\s]/g, '') || '')
  .refine(
    (val) => {
      if (!val) return true; // Optional
      // ISBN-10: 10 digits (last can be X)
      // ISBN-13: 13 digits
      return /^(\d{10}|\d{9}X|\d{13})$/i.test(val);
    },
    { message: 'Invalid ISBN format' }
  );

/**
 * Reading entry schema
 */
export const BookReadSchema = z.object({
  startedAt: z.union([z.string(), z.number(), z.date(), z.null()]).optional(),
  finishedAt: z.union([z.string(), z.number(), z.date(), z.null()]).optional(),
});

/**
 * Book image schema
 */
export const BookImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  storagePath: z.string(),
  isPrimary: z.boolean(),
  caption: z.string().optional(),
  uploadedAt: z.number(),
  sizeBytes: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Cover sources schema
 */
export const BookCoversSchema = z.record(z.string(), z.string().optional());

/**
 * Schema for creating/editing a book
 */
export const BookFormSchema = z.object({
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
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  publisher: z
    .string()
    .max(200, 'Publisher must be 200 characters or less')
    .optional()
    .transform((s) => s?.trim() || undefined),
  publishedDate: z.string().optional(),
  physicalFormat: PhysicalFormatSchema.optional(),
  pageCount: z
    .number()
    .int()
    .min(1, 'Page count must be at least 1')
    .max(50000, 'Page count seems too high')
    .nullable()
    .optional(),
  rating: z
    .number()
    .min(0, 'Rating must be at least 0')
    .max(5, 'Rating must be at most 5')
    .nullable()
    .optional(),
  genres: z.array(z.string()).optional(),
  seriesId: z.string().nullable().optional(),
  seriesPosition: z
    .number()
    .min(0, 'Series position must be positive')
    .nullable()
    .optional(),
  notes: z
    .string()
    .max(10000, 'Notes must be 10000 characters or less')
    .optional()
    .transform((s) => s?.trim() || undefined),
  reads: z.array(BookReadSchema).optional(),
  covers: BookCoversSchema.optional(),
  images: z.array(BookImageSchema).optional(),
});

/**
 * Schema for updating a book (all fields optional)
 */
export const BookUpdateSchema = BookFormSchema.partial();

/**
 * Schema for quick-add book (minimal required fields)
 */
export const QuickAddBookSchema = z.object({
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
  coverImageUrl: z.string().url().optional().or(z.literal('')),
});

/** Inferred types from schemas */
export type BookFormData = z.infer<typeof BookFormSchema>;
export type BookUpdateData = z.infer<typeof BookUpdateSchema>;
export type QuickAddBookData = z.infer<typeof QuickAddBookSchema>;
export type PhysicalFormat = z.infer<typeof PhysicalFormatSchema>;
export type ReadingStatus = z.infer<typeof ReadingStatusSchema>;
export type BookRead = z.infer<typeof BookReadSchema>;
export type BookImage = z.infer<typeof BookImageSchema>;
