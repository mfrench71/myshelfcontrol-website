/**
 * Contact Form API Route
 * Handles support form submissions via Resend
 */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

// Contact form schema
const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required'),
  subject: z.enum(['general', 'bug', 'feature', 'account']).optional().default('general'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
});

// Subject line mapping
const subjectLabels: Record<string, string> = {
  general: 'General Enquiry',
  bug: 'Bug Report',
  feature: 'Feature Request',
  account: 'Account Issue',
};

export async function POST(request: Request) {
  try {
    // Check API key at request time (allows runtime config and testing)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = ContactSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message);
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }

    const { name, email, subject, message } = result.data;
    const resend = new Resend(resendApiKey);

    // Send email to support
    const supportEmail = await resend.emails.send({
      from: 'Book Assembly <hello@bookassembly.co.uk>',
      to: 'hello@bookassembly.co.uk',
      replyTo: email,
      subject: `[${subjectLabels[subject]}] from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subjectLabels[subject]}\n\nMessage:\n${message}`,
      html: `
        <h2>New Support Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${subjectLabels[subject]}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
      `,
    });

    if (supportEmail.error) {
      console.error('Failed to send support email:', supportEmail.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    // Send auto-reply to user
    const autoReply = await resend.emails.send({
      from: 'Book Assembly <hello@bookassembly.co.uk>',
      to: email,
      subject: "We've received your message",
      text: `Hi ${name},\n\nThanks for contacting Book Assembly. We've received your message and will respond within 48 hours.\n\nBest regards,\nThe Book Assembly Team`,
      html: `
        <p>Hi ${escapeHtml(name)},</p>
        <p>Thanks for contacting Book Assembly. We've received your message and will respond within 48 hours.</p>
        <p>Best regards,<br />The Book Assembly Team</p>
      `,
    });

    if (autoReply.error) {
      // Log but don't fail - the main email was sent
      console.error('Failed to send auto-reply:', autoReply.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
