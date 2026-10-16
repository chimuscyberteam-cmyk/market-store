'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, canBecomeSeller } from '@market-store/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, updateUser } = useAuth();
  const { dark, toggle } = useTheme();
  const [busy, setBusy] = useState(false);

  if (authLoading) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-6xl mb-4">🔑</div>
        <h1 className="text-2xl font-extrabold">Sign in to view settings</h1>
        <Link href="/login" className="btn-primary mt-6 inline-flex">Sign in</Link>
      </div>
    );
  }

  async function becomeSeller() {
    if (!confirm('Upgrade to seller? You will be able to post items for sale.')) return;
    setBusy(true);
    try {
      const res = await apiFetch('/api/users/me/become-seller', { method: 'POST' });
      if (res.user) updateUser(res.user);
      alert('You are now a seller! You can post items.');
    } catch (e) {
      alert(`Couldn't upgrade: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">Settings</h1>

      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Account</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-600 text-white flex items-center justify-center font-extrabold text-xl">
              {user.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{user.full_name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <span className="inline-block mt-1.5 text-xs font-bold bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-full">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => { signOut(); router.push('/'); }}
            className="mt-5 w-full py-3 rounded-xl border border-red-200 dark:border-red-900 text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Security</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <Link
            href="/settings/change-password"
            className="inline-flex w-full items-center justify-center py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            🔒 Change password
          </Link>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Your role</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <p className="font-bold">{ROLE_LABELS[user.role]} account</p>
          <p className="text-sm text-gray-500 mt-1">{ROLE_DESCRIPTIONS[user.role]}</p>
          {canBecomeSeller(user.role) ? (
            <button
              onClick={becomeSeller}
              disabled={busy}
              className="mt-4 w-full py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? 'Upgrading…' : 'Become a seller'}
            </button>
          ) : null}
          {user.role === 'admin' ? (
            <Link href="/admin" className="mt-4 inline-flex w-full items-center justify-center py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold">
              Open admin panel
            </Link>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Appearance</h2>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Dark mode</p>
              <p className="text-sm text-gray-500 mt-0.5">Easier on the eyes at night</p>
            </div>
            <button
              onClick={toggle}
              className={`relative w-14 h-8 rounded-full transition ${dark ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition transform ${dark ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
