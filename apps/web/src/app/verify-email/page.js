'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        body: { email, code }
      });
      
      // Save tokens and redirect
      localStorage.setItem('ms.accessToken', res.accessToken);
      localStorage.setItem('ms.refreshToken', res.refreshToken);
      localStorage.setItem('ms.user', JSON.stringify(res.user));
      
      toast.success('Email verified successfully! Welcome.');
      router.push('/');
      router.refresh(); // Force a refresh so the header updates
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!email) return <div className="text-center py-20 dark:text-white">Invalid link. Please register again.</div>;

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
      <h1 className="text-2xl font-extrabold text-center mb-2 dark:text-white">Verify your email</h1>
      <p className="text-sm text-slate-500 text-center mb-6">We sent a 6-digit code to <strong>{email}</strong>.</p>
      
      <form onSubmit={submit} className="space-y-4">
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-3xl tracking-[0.5em] font-extrabold px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-brand-500 outline-none mb-4"
          autoFocus
        />
        <button type="submit" disabled={busy || code.length !== 6} className="w-full py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50">
          {busy ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="text-center py-20 dark:text-white">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
