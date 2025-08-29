import { NextResponse } from 'next/server';
import { createWelcomeEmail, sendEmail, isResendConfigured } from '@/lib/email/resend';

export async function POST(req: Request) {
  try {
    if (!isResendConfigured()) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const email: string | undefined = body?.email;
    const locale: 'en' | 'es' = body?.locale === 'es' ? 'es' : 'en';

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const displayName = email.split('@')[0];
    const template = createWelcomeEmail(email, displayName, locale);
    const result = await sendEmail(template);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
