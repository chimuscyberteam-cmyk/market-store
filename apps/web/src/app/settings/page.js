'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const becomeSeller = async () => {
    try {
      await apiFetch('/api/users/become-seller', { method: 'POST' });
      
      toast.custom((t) => (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 border border-blue-400">
          <div className="text-4xl bg-white/20 w-14 h-14 flex items-center justify-center rounded-full shrink-0">🏪</div>
          <div>
            <h3 className="font-extrabold text-lg text-white">You are a Seller!</h3>
            <p className="text-sm font-medium text-blue-50 mt-1">Your account is upgraded. Log out and log back in to start posting items.</p>
          </div>
        </div>
      ), { duration: 6000 });
      
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-extrabold mb-6 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div>
          <h2 className="font-bold text-lg dark:text-white">Account Role</h2>
          <p className="text-sm text-slate-500 mt-1">Currently you are a <strong className="text-brand-600 capitalize">{user?.role || 'Buyer'}</strong>.</p>
          
          {user?.role !== 'seller' && user?.role !== 'admin' && (
            <button onClick={becomeSeller} className="mt-4 bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-700 transition">
              Become a Seller
            </button>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <h2 className="font-bold text-lg dark:text-white">Security</h2>
          <p className="text-sm text-slate-500 mt-1">Update your password to keep your account safe.</p>
          <button onClick={() => router.push('/settings/change-password')} className="mt-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-6 rounded-xl hover:bg-slate-200 transition">
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
