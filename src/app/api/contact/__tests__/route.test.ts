/**
 * Contact API Route Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Resend with a proper class mock
const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = {
        send: mockSend,
      };
    },
  };
});

// Helper to create a mock Request
function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Set env before importing route
process.env.RESEND_API_KEY = 'test-api-key';

// Import after setting env and mocks
import { POST } from '../route';

describe('Contact API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
  });

  describe('validation', () => {
    it('returns 400 when name is missing', async () => {
      const request = createRequest({
        email: 'test@example.com',
        message: 'This is a test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      // Zod returns different error for missing vs empty
      expect(data.error).toContain('expected string');
    });

    it('returns 400 when name is empty', async () => {
      const request = createRequest({
        name: '',
        email: 'test@example.com',
        message: 'This is a test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name is required');
    });

    it('returns 400 when email is invalid', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'not-an-email',
        message: 'This is a test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Valid email is required');
    });

    it('returns 400 when email is missing', async () => {
      const request = createRequest({
        name: 'Test User',
        message: 'This is a test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      // Zod returns different error for missing vs invalid
      expect(data.error).toContain('expected string');
    });

    it('returns 400 when message is too short', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Short',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message must be at least 10 characters');
    });

    it('returns 400 when message is missing', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      // Zod returns different error for missing vs too short
      expect(data.error).toContain('expected string');
    });

    it('accepts valid subject values', async () => {
      const subjects = ['general', 'bug', 'feature', 'account'];

      for (const subject of subjects) {
        mockSend.mockResolvedValue({ data: { id: 'test-id' }, error: null });
        const request = createRequest({
          name: 'Test User',
          email: 'test@example.com',
          subject,
          message: 'This is a valid test message',
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });

    it('defaults subject to general when not provided', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('returns 400 when name exceeds max length', async () => {
      const request = createRequest({
        name: 'A'.repeat(101),
        email: 'test@example.com',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('successful submission', () => {
    it('returns success on valid submission', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'general',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('sends email to support and auto-reply', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'bug',
        message: 'This is a bug report message',
      });

      await POST(request);

      // Should be called twice: support email and auto-reply
      expect(mockSend).toHaveBeenCalledTimes(2);

      // First call: support email
      expect(mockSend).toHaveBeenNthCalledWith(1, expect.objectContaining({
        to: 'hello@bookassembly.co.uk',
        replyTo: 'test@example.com',
        subject: '[Bug Report] from Test User',
      }));

      // Second call: auto-reply
      expect(mockSend).toHaveBeenNthCalledWith(2, expect.objectContaining({
        to: 'test@example.com',
        subject: "We've received your message",
      }));
    });
  });

  describe('email sending errors', () => {
    it('returns 500 when support email fails', async () => {
      mockSend.mockResolvedValue({ data: null, error: { message: 'Send failed' } });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to send message. Please try again.');
    });

    it('succeeds even if auto-reply fails', async () => {
      mockSend
        .mockResolvedValueOnce({ data: { id: 'test-id' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Auto-reply failed' } });

      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('XSS prevention', () => {
    it('escapes HTML in name', async () => {
      const request = createRequest({
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        message: 'This is a valid test message',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify HTML was escaped in the email body
      const htmlCall = mockSend.mock.calls[0][0].html;
      expect(htmlCall).toContain('&lt;script&gt;');
      expect(htmlCall).not.toContain('<script>');
    });

    it('escapes HTML in message', async () => {
      const request = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test with <b>HTML</b> & "quotes"',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const htmlCall = mockSend.mock.calls[0][0].html;
      expect(htmlCall).toContain('&lt;b&gt;');
      expect(htmlCall).toContain('&amp;');
      expect(htmlCall).toContain('&quot;');
    });
  });
});
