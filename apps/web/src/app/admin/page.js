'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const ROLE_COLORS = {
  buyer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  seller: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditActions, setAuditActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    (async () => {
      try {
        const [s, u, o, a] = await Promise.all([
          apiFetch('/api/admin/stats'),
          apiFetch('/api/admin/users'),
          apiFetch('/api/admin/orders'),
          apiFetch('/api/admin/audit')
        ]);
        setStats(s);
        setUsers(u.users || []);
        setOrders(o.orders || []);
        setAuditActions(a.actions || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function changeRole(userId, role) {
    if (!confirm(`Change role to ${role}?`)) return;
    try {
      await apiFetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: { role }
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      // Refresh audit log
      const a = await apiFetch('/api/admin/audit');
      setAuditActions(a.actions || []);
    } catch (e) {
      alert(e.message);
    }
  }

  if (authLoading || loading) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }
  if (error) {
    return <div className="text-center py-20 text-red-600 font-semibold">{error}</div>;
  }
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Admin panel</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Manage users, orders and platform health
      </p>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Users" value={stats.users} icon="👥" />
          <StatCard label="Active items" value={stats.activeItems} icon="📦" />
          <StatCard label="Orders" value={stats.orders} icon="🛒" />
          <StatCard label="Delivered (ZMW)" value={`K${Number(stats.deliveredRevenue).toFixed(0)}`} icon="💰" />
        </div>
      ) : null}

      <div className="flex gap-2 mb-4 flex-wrap">
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
          Users ({users.length})
        </TabBtn>
        <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')}>
          Orders ({orders.length})
        </TabBtn>
        <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}>
          Audit ({auditActions.length})
        </TabBtn>
      </div>

      {tab === 'users' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-semibold">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-800 dark:border-gray-700"
                      >
                        <option value="buyer">buyer</option>
                        <option value="seller">seller</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'orders' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Seller</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                ) : orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-semibold">{o.item_title}</td>
                    <td className="px-4 py-3 text-gray-500">{o.buyer_name}</td>
                    <td className="px-4 py-3 text-gray-500">{o.seller_name}</td>
                    <td className="px-4 py-3 font-bold text-brand-600">K{o.total_zmw}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-bold uppercase">{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {auditActions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No admin actions yet
                    </td>
                  </tr>
                ) : auditActions.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold">{a.admin_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold uppercase bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {a.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.target_type ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {JSON.stringify(a.metadata).slice(0, 60)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="text-2xl">{icon}</div>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
        active
          ? 'bg-brand-600 text-white'
          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {children}
    </button>
  );
}
