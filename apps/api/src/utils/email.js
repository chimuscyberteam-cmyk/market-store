import { Resend } from 'resend';
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  try {
    const data = await resend.emails.send({
      from: env.EMAIL_FROM || 'Market Store <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

export async function sendPasswordResetCodeEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: 'Reset your Market Store password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your Market Store password. Use the 6-digit code below to proceed:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; text-align: center; border-radius: 8px;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `
  });
}

export async function sendVerificationCodeEmail({ to, name, code }) {
  return sendEmail({
    to,
    subject: 'Verify your Market Store account',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Market Store!</h2>
        <p>Hi ${name},</p>
        <p>Please use the 6-digit code below to verify your email address and activate your account:</p>
        <h1 style="font-size: 32px; letter-spacing: 5px; background: #f4f4f4; padding: 10px; text-align: center; border-radius: 8px;">${code}</h1>
        <p>This code will expire in 15 minutes.</p>
      </div>
    `
  });
}
