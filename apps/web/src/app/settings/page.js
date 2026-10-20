'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const becomeSeller = async () => {
    try {
      await apiFetch('/api/users/become-seller', { method: 'POST' });
      toast.success('You are now a Seller! Log out and log back in to apply changes.');
    } catch (e) { toast.error(e.message); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword }
      });
      toast.success('Password changed! Please log in again.');
      signOut();
      router.push('/login');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiFetch('/api/auth/account', {
        method: 'DELETE',
        body: { password: deletePassword }
      });
      toast.success('Account deleted permanently.');
      signOut();
      router.push('/');
    } catch (e) {
      toast.error(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <h1 className="text-2xl font-extrabold dark:text-white">Settings</h1>

      {/* Account Role */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg dark:text-white">Account Role</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Currently you are a <strong className="text-brand-600 capitalize">{user?.role || 'Buyer'}</strong>.</p>
        {user?.role !== 'seller' && user?.role !== 'admin' && (
          <button onClick={becomeSeller} className="bg-brand-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-brand-700 transition">
            Become a Seller
          </button>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg dark:text-white">Change Password</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Forgot your current password? <Link href="/forgot-password" className="text-brand-600 hover:underline">Reset it via email</Link>.
        </p>
        <form onSubmit={changePassword} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-semibold mb-1 dark:text-gray-300">Current Password</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 dark:text-gray-300">New Password</label>
            <input type="password" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-50">
            {busy ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/50 p-6">
        <h2 className="font-bold text-lg text-red-700 dark:text-red-400">Danger Zone</h2>
        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-4">
          Once you delete your account, there is no going back. All your items, chats, and orders will be permanently removed.
        </p>
        <button onClick={() => setDeleteModalOpen(true)} className="bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-red-700 transition">
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account?">
        <p className="text-sm text-slate-500 mb-4 text-center">
          This action is permanent. To confirm, please enter your password.
        </p>
        <input
          type="password"
          placeholder="Enter your password"
          value={deletePassword}
          onChange={e => setDeletePassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-red-500 outline-none mb-6"
        />
        <div className="flex gap-3">
          <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Cancel
          </button>
          <button onClick={deleteAccount} disabled={deleting || !deletePassword} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
