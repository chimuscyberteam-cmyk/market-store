'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false
      });
      router.push(`/verify-code?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-extrabold mb-1">Forgot your password?</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Enter your email and we'll send you a 6-digit code.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Sending…' : 'Send code'}
        </button>
      </form>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
        Remembered it?{' '}
        <Link href="/login" className="text-brand-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
