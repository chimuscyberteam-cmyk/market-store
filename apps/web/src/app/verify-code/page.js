'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

function VerifyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resendIn, setResendIn] = useState(60);
  const [resending, setResending] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  function setDigit(i, v) {
    const clean = v.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onPaste(e, i) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split('');
    while (next.length < 6) next.push('');
    setDigits(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  }

  function onKeyDown(e, i) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  async function submit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return setError('Enter all 6 digits');
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch('/api/auth/verify-code', {
        method: 'POST',
        body: { email, code },
        auth: false
      });
      router.push(`/reset-password?token=${encodeURIComponent(data.resetToken)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || resending) return;
    setResending(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false
      });
      setResendIn(60);
      setDigits(['', '', '', '', '', '']);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-5xl mb-4">📬</div>
      <h1 className="text-2xl font-extrabold mb-1">Enter your code</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        We sent a 6-digit code to <strong className="text-gray-700 dark:text-gray-200">{email}</strong>.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div className="flex gap-2 justify-between" onPaste={(e) => onPaste(e, 0)}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(e, i)}
              inputMode="numeric"
              maxLength={1}
              className="w-12 h-14 text-center text-2xl font-extrabold rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          ))}
        </div>

        {error ? (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={busy || digits.some((d) => !d)} className="btn-primary w-full disabled:opacity-60">
          {busy ? 'Verifying…' : 'Verify code'}
        </button>
      </form>

      <div className="mt-6 text-sm text-center">
        {resendIn > 0 ? (
          <span className="text-gray-500 dark:text-gray-400">
            Resend code in {resendIn}s
          </span>
        ) : (
          <button onClick={resend} disabled={resending} className="text-brand-600 font-semibold">
            {resending ? 'Resending…' : 'Resend code'}
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-6 text-center">
        <Link href="/forgot-password" className="text-brand-600 font-semibold">
          Use a different email
        </Link>
      </p>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
