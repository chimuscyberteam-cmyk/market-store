'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-extrabold">Invalid reset link</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3">
          The link is missing a token. Start over.
        </p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
          Start over
        </Link>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError("Passwords don't match");

    setBusy(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: { resetToken: token, newPassword: password },
        auth: false
      });
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold">Password updated</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3">
          Redirecting you to sign in…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-extrabold mb-1">Set a new password</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Minimum 8 characters.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">New password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              required
              className="input pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
              aria-label="Toggle password"
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Confirm password</label>
          <input
            type={showPwd ? 'text' : 'password'}
            required
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
