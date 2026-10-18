'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'admin') router.push('/');
    }
  }, [authLoading, user, router]);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, itemsRes] = await Promise.all([
        apiFetch('/api/admin/stats'),
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/items')
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
      setItems(itemsRes.items || []);
    } catch (e) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user?.role === 'admin') loadData(); }, [user]);

  
  const changeRole = async (id, newRole) => {
    try {
      await apiFetch(`/api/admin/users/${id}/role`, { method: 'PATCH', body: { role: newRole } });
      toast.success('Role updated successfully');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const toggleVerify = async (id) => {
    try {
      await apiFetch(`/api/admin/users/${id}/verify`, { method: 'PATCH' });
      toast.success('Verification status updated');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const toggleSuspend = async (id) => {
    try {
      await apiFetch(`/api/admin/users/${id}/suspend`, { method: 'PATCH' });
      toast.success('User status updated');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  const removeItem = async (id) => {
    if (!confirm('Are you sure you want to remove this item from the marketplace?')) return;
    try {
      await apiFetch(`/api/admin/items/${id}/remove`, { method: 'PATCH' });
      toast.success('Item removed');
      loadData();
    } catch (e) { toast.error(e.message); }
  };

  if (authLoading || loading || user?.role !== 'admin') {
    return <div className="text-center py-20 text-gray-500">Loading Admin Data…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Control Center</h1>
          <p className="text-slate-500">Manage users, listings, and platform metrics.</p>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Users</p>
            <p className="text-3xl font-extrabold text-brand-600 mt-2">{stats.total_users}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Active Listings</p>
            <p className="text-3xl font-extrabold text-blue-500 mt-2">{stats.active_items}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Orders</p>
            <p className="text-3xl font-extrabold text-amber-500 mt-2">{stats.total_orders}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Revenue</p>
            <p className="text-3xl font-extrabold text-emerald-500 mt-2">K{stats.total_revenue}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
        <button
          onClick={() => setTab('users')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'users' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Manage Users
        </button>
        <button
          onClick={() => setTab('listings')}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'listings' ? 'bg-brand-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
        >
          Manage Listings
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {tab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Role / Badge</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="text-sm dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {u.full_name}
                        {u.is_verified && <span className="text-blue-500 text-lg" title="Verified Seller">✔️</span>}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <select 
                        value={u.role} 
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-full p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      {u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-bold">Suspended</span>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">Active</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 flex-wrap">
                      <button
                        onClick={() => toggleVerify(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${u.is_verified ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {u.is_verified ? 'Remove Tick' : 'Give Tick'}
                      </button>
                      <button
                        onClick={() => toggleSuspend(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${u.suspended_until && new Date(u.suspended_until) > new Date() ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {u.suspended_until && new Date(u.suspended_until) > new Date() ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'listings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">Item</th>
                  <th className="p-4 font-semibold">Seller</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(i => (
                  <tr key={i.id} className="text-sm dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {i.is_featured && <span>⭐</span>}
                      {i.title}
                    </td>
                    <td className="p-4">{i.seller_name}</td>
                    <td className="p-4 font-semibold text-brand-600">K{i.price_zmw}</td>
                    <td className="p-4 capitalize">{i.status}</td>
                    <td className="p-4">
                      {i.status === 'active' && (
                        <button
                          onClick={() => removeItem(i.id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition"
                        >
                          Force Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
