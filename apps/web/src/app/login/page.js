'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth(); // Get the signIn function from our new AuthProvider
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      
      // THIS IS THE CRITICAL FIX: Use signIn instead of manually saving
      signIn(res.user, res.accessToken, res.refreshToken);
      
      toast.success('Logged in successfully!');
      router.push('/');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
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
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={busy} className="w-full btn-primary py-3 mt-4 disabled:opacity-50">
          {busy ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
      
      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account? <Link href="/register" className="text-brand-600 font-semibold hover:underline">Sign up</Link>
      </p>
    </div>
  );
}
