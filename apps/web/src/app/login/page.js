'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      signIn(res.user, res.accessToken, res.refreshToken);
      toast.success('Logged in successfully!');
      router.push('/');
      router.refresh();
    } catch (err) {
      // UX FIX: If the backend says they need to verify, send them straight to the verify page
      if (err.message.includes('verify your email')) {
        toast.error(err.message);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
      <h1 className="text-2xl font-extrabold text-center mb-6 dark:text-white">Welcome back</h1>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={busy} className="w-full btn-primary py-3 mt-2 disabled:opacity-50">
          {busy ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <Link href="/register" className="text-brand-600 font-semibold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
