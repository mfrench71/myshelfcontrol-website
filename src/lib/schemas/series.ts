/**
 * Series Validation Schemas
 * Zod schemas for series form validation
 */
import { z } from 'zod';

/**
 * Expected book in a series
 */
export const ExpectedBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  isbn: z.string().nullable().optional(),
  position: z.number().nullable().optional(),
  source: z.enum(['api', 'manual']).optional(),
});

/**
 * Schema for creating/editing a series
 */
export const SeriesFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or less')
    .transform((s) => s.trim()),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or less')
    .nullable()
    .optional()
    .transform((s) => s?.trim() || null),
  totalBooks: z
    .number()
    .int()
    .min(1, 'Total books must be at least 1')
    .max(1000, 'Total books seems too high')
    .nullable()
    .optional(),
  expectedBooks: z.array(ExpectedBookSchema).optional(),
});

/**
 * Schema for updating a series (all fields optional)
 */
export const SeriesUpdateSchema = SeriesFormSchema.partial();

/** Inferred types from schemas */
export type SeriesFormData = z.infer<typeof SeriesFormSchema>;
export type SeriesUpdateData = z.infer<typeof SeriesUpdateSchema>;
export type ExpectedBook = z.infer<typeof ExpectedBookSchema>;
