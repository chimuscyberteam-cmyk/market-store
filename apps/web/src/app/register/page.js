'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!agreed) return toast.error('You must agree to the Terms and Privacy Policy.');
    setBusy(true);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: { fullName, email, phone, password, role }
      });
      toast.success('Account created! Check your email for the verification code.');
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-3xl font-extrabold text-center mb-8 dark:text-white">Create an account</h1>
      
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Full Name</label>
          <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Phone Number</label>
          <input type="text" className="input" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Email</label>
          <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Password</label>
          <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <p className="text-xs text-gray-500 mt-1">At least 8 characters</p>
        </div>

        {/* SCROLLABLE TERMS BOX */}
        <div className="mt-6 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Terms & Privacy Summary</h3>
          </div>
          <div className="h-32 overflow-y-auto p-4 text-xs text-slate-600 dark:text-slate-400 space-y-3">
            <p><strong>1. Campus Only:</strong> Market Store is exclusively for Mulungushi University students.</p>
            <p><strong>2. Trade at Your Own Risk:</strong> We connect buyers and sellers. We are not responsible for scams or the quality of goods. Cash on Delivery only.</p>
            <p><strong>3. Safety First:</strong> Always meet at public landmarks (Library, Main Gate). Never share your room number.</p>
            <p><strong>4. Privacy:</strong> We collect your name, phone, and email. We use GPS only to calculate delivery fees. We never sell your data.</p>
            <p>By checking the box below, you agree to our full <Link href="/terms" target="_blank" className="text-brand-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-brand-600 hover:underline">Privacy Policy</Link>.</p>
          </div>
        </div>

        <label className="flex items-start gap-3 mt-4 cursor-pointer">
          <input 
            type="checkbox" 
            checked={agreed} 
            onChange={e => setAgreed(e.target.checked)} 
            className="mt-1 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" 
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            I agree to the Terms of Service and Privacy Policy.
          </span>
        </label>

        <button type="submit" disabled={busy || !agreed} className="w-full btn-primary py-3 mt-4 disabled:opacity-50">
          {busy ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account? <Link href="/login" className="text-brand-600 font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
