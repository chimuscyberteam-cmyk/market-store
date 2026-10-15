'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getRefreshToken } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (newPassword !== confirm) return setError("Passwords don't match");
    if (currentPassword === newPassword) return setError('New password must be different');

    setBusy(true);
    try {
      await apiFetch('/api/users/me/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword,
          keepRefreshToken: getRefreshToken() || undefined
        }
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className="text-center py-20 text-gray-500">Loading…</div>;
  if (!user) return null;

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-extrabold">Password updated</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-3">
          You've been signed out of all other devices for security.
        </p>
        <Link href="/settings" className="btn-primary mt-6 inline-flex">
          Back to settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <Link href="/settings" className="text-sm text-gray-500 hover:text-brand-600 inline-block mb-4">
        ← Back to settings
      </Link>

      <h1 className="text-2xl font-extrabold mb-1">Change password</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        You'll stay signed in here. Other devices will be signed out.
      </p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Current password</label>
          <input
            type="password"
            required
            className="input"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">New password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              required
              className="input pr-12"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          <label className="block text-sm font-semibold mb-1">Confirm new password</label>
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
