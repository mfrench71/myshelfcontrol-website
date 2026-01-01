/**
 * Genre Validation Schemas
 * Zod schemas for genre form validation
 */
import { z } from 'zod';

/**
 * Hex colour validation
 */
const hexColorSchema = z
  .string()
  .regex(/^#([0-9A-Fa-f]{6})$/, 'Invalid colour format (use #RRGGBB)')
  .optional();

/**
 * Schema for creating/editing a genre
 */
export const GenreFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .transform((s) => s.trim()),
  color: hexColorSchema,
});

/**
 * Schema for updating a genre (all fields optional)
 */
export const GenreUpdateSchema = GenreFormSchema.partial();

/** Inferred types from schemas */
export type GenreFormData = z.infer<typeof GenreFormSchema>;
export type GenreUpdateData = z.infer<typeof GenreUpdateSchema>;
