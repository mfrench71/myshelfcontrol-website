/**
 * Schema Exports
 * Central export point for all Zod validation schemas
 */

// Auth schemas
export {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
  DeleteAccountSchema,
  type LoginData,
  type RegisterData,
  type ChangePasswordData,
  type ResetPasswordData,
  type DeleteAccountData,
} from './auth';

// Book schemas
export {
  BookFormSchema,
  BookUpdateSchema,
  QuickAddBookSchema,
  BookReadSchema,
  BookImageSchema,
  BookCoversSchema,
  PhysicalFormatSchema,
  ReadingStatusSchema,
  type BookFormData,
  type BookUpdateData,
  type QuickAddBookData,
  type BookRead,
  type BookImage,
  type PhysicalFormat,
  type ReadingStatus,
} from './book';

// Wishlist schemas
export {
  WishlistItemSchema,
  WishlistUpdateSchema,
  QuickAddWishlistSchema,
  WishlistPrioritySchema,
  type WishlistItemData,
  type WishlistUpdateData,
  type QuickAddWishlistData,
  type WishlistPriority,
} from './wishlist';

// Genre schemas
export {
  GenreFormSchema,
  GenreUpdateSchema,
  type GenreFormData,
  type GenreUpdateData,
} from './genre';

// Series schemas
export {
  SeriesFormSchema,
  SeriesUpdateSchema,
  ExpectedBookSchema,
  type SeriesFormData,
  type SeriesUpdateData,
  type ExpectedBook,
} from './series';
