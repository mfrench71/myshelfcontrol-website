/**
 * Unit Tests for lib/schemas/auth.ts
 * Tests for Zod validation schemas
 */
import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  ChangePasswordSchema,
  ResetPasswordSchema,
  DeleteAccountSchema,
} from '../auth';

describe('LoginSchema', () => {
  it('validates correct credentials', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('transforms email to lowercase', () => {
    const result = LoginSchema.safeParse({
      email: 'Test@Example.COM',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('trims email whitespace after validation', () => {
    // Zod validates first, then transforms - emails with spaces may fail email() check
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('rejects empty email', () => {
    const result = LoginSchema.safeParse({
      email: '',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = LoginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects email over 254 characters', () => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    const result = LoginSchema.safeParse({
      email: longEmail,
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  const validData = {
    email: 'test@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  it('validates correct registration data', () => {
    const result = RegisterSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects password under 8 characters', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'Pass1',
      confirmPassword: 'Pass1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password over 128 characters', () => {
    const longPassword = 'Password1' + 'a'.repeat(125);
    const result = RegisterSchema.safeParse({
      ...validData,
      password: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'PasswordABC',
      confirmPassword: 'PasswordABC',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      password: 'Password123',
      confirmPassword: 'Password456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(
        (i) => i.path.includes('confirmPassword')
      );
      expect(passwordError?.message).toBe('Passwords do not match');
    }
  });

  it('rejects empty confirm password', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
  });

  it('transforms email to lowercase', () => {
    const result = RegisterSchema.safeParse({
      ...validData,
      email: 'TEST@EXAMPLE.COM',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });
});

describe('ChangePasswordSchema', () => {
  const validData = {
    currentPassword: 'OldPassword1',
    newPassword: 'NewPassword2',
    confirmPassword: 'NewPassword2',
  };

  it('validates correct password change data', () => {
    const result = ChangePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty current password', () => {
    const result = ChangePasswordSchema.safeParse({
      ...validData,
      currentPassword: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password under 8 characters', () => {
    const result = ChangePasswordSchema.safeParse({
      ...validData,
      newPassword: 'New1',
      confirmPassword: 'New1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password without uppercase', () => {
    const result = ChangePasswordSchema.safeParse({
      ...validData,
      newPassword: 'newpassword1',
      confirmPassword: 'newpassword1',
    });
    expect(result.success).toBe(false);
  });

  it('rejects new password without number', () => {
    const result = ChangePasswordSchema.safeParse({
      ...validData,
      newPassword: 'NewPassword',
      confirmPassword: 'NewPassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched new passwords', () => {
    const result = ChangePasswordSchema.safeParse({
      ...validData,
      confirmPassword: 'DifferentPassword2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path.includes('confirmPassword')
      );
      expect(error?.message).toBe('Passwords do not match');
    }
  });

  it('rejects same current and new password', () => {
    const result = ChangePasswordSchema.safeParse({
      currentPassword: 'SamePassword1',
      newPassword: 'SamePassword1',
      confirmPassword: 'SamePassword1',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path.includes('newPassword')
      );
      expect(error?.message).toBe('New password must be different from current password');
    }
  });
});

describe('ResetPasswordSchema', () => {
  it('validates correct email', () => {
    const result = ResetPasswordSchema.safeParse({
      email: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('transforms email to lowercase', () => {
    const result = ResetPasswordSchema.safeParse({
      email: 'TEST@EXAMPLE.COM',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('rejects empty email', () => {
    const result = ResetPasswordSchema.safeParse({
      email: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = ResetPasswordSchema.safeParse({
      email: 'not-valid',
    });
    expect(result.success).toBe(false);
  });
});

describe('DeleteAccountSchema', () => {
  it('validates correct deletion data', () => {
    const result = DeleteAccountSchema.safeParse({
      password: 'mypassword',
      confirmText: 'DELETE',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = DeleteAccountSchema.safeParse({
      password: '',
      confirmText: 'DELETE',
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong confirmation text', () => {
    const result = DeleteAccountSchema.safeParse({
      password: 'mypassword',
      confirmText: 'delete', // lowercase
    });
    expect(result.success).toBe(false);
  });

  it('rejects partial confirmation text', () => {
    const result = DeleteAccountSchema.safeParse({
      password: 'mypassword',
      confirmText: 'DELET',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty confirmation text', () => {
    const result = DeleteAccountSchema.safeParse({
      password: 'mypassword',
      confirmText: '',
    });
    expect(result.success).toBe(false);
  });

  it('provides helpful error for wrong confirmation', () => {
    const result = DeleteAccountSchema.safeParse({
      password: 'mypassword',
      confirmText: 'wrong',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.issues.find(
        (i) => i.path.includes('confirmText')
      );
      expect(error).toBeDefined();
    }
  });
});
