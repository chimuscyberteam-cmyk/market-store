'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          password: form.password,
          role: 'buyer'
        },
        auth: false
      });
      signIn(data);
      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <h1 className="text-2xl font-extrabold mb-1">Create account</h1>
      <p className="text-gray-500 mb-6">Join Market Store in seconds.</p>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Full name</label>
          <input
            required
            className="input"
            value={form.fullName}
            onChange={(e) => update('fullName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Phone</label>
          <input
            required
            placeholder="0971234567"
            className="input"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              className="input pr-12"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xl"
              aria-label="Toggle password"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        ) : null}

        
        <div className="flex items-start gap-3 mt-6 mb-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            I agree to the <a href="/terms" target="_blank" className="text-brand-600 font-semibold hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-brand-600 font-semibold hover:underline">Privacy Policy</a>.
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-6 text-center">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}
