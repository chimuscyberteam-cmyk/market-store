'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

function metersLabel(m) {
  if (!m) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState('mine');
  const [buyerOrders, setBuyerOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [mine, selling] = await Promise.all([
        apiFetch('/api/orders/mine'),
        apiFetch('/api/orders/selling')
      ]);
      setBuyerOrders(mine.orders || []);
      setSellerOrders(selling.orders || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function updateStatus(orderId, status, code = null) {
    setBusyId(orderId);
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status, code: code || undefined }
      });
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || loading) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }

  const data = tab === 'mine' ? buyerOrders : sellerOrders;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Orders</h1>
      <p className="text-gray-500 mb-6">Track purchases and incoming sales.</p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Buying ({buyerOrders.length})
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            tab === 'selling' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Selling ({sellerOrders.length})
        </button>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          {error}
        </div>
      ) : null}

      {data.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-lg font-bold">
            {tab === 'mine' ? 'No orders yet' : 'No incoming orders'}
          </p>
          <p className="text-gray-500 mt-1">
            {tab === 'mine'
              ? 'Browse items and tap "Buy now" to place an order'
              : 'When someone buys your items, orders appear here'}
          </p>
          {tab === 'mine' ? (
            <Link href="/" className="btn-primary mt-4 inline-flex">
              Browse items
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((o) => {
            const color = STATUS_COLORS[o.status] || STATUS_COLORS.pending;
            const counterparty = tab === 'mine' ? o.seller_name : o.buyer_name;
            return (
              <div key={o.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${color}`}>
                    {o.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-bold text-lg">{o.item_title}</h3>

                  {tab === 'mine' && o.status !== 'delivered' && o.status !== 'cancelled' && o.delivery_code ? (
                    <div className='mt-3 p-3 bg-brand-50 border border-brand-200 rounded-lg text-center'>
                      <p className='text-xs text-brand-700 font-semibold uppercase tracking-wider'>Your Delivery Code</p>
                      <p className='text-3xl font-extrabold text-brand-800 tracking-widest'>{o.delivery_code}</p>
                      <p className='text-xs text-brand-600 mt-1'>Give this to the seller when they arrive.</p>
                    </div>
                  ) : null}


                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p>
                    <span className="text-gray-500">
                      {tab === 'mine' ? 'Seller' : 'Buyer'}:
                    </span>{' '}
                    <span className="font-medium">{counterparty}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">Delivery:</span>{' '}
                    {metersLabel(o.distance_meters)} · K{o.delivery_fee_zmw}
                  </p>
                  <p>
                    <span className="text-gray-500">Payment:</span>{' '}
                    {o.payment_method === 'pod' ? 'Pay on delivery' : 'Mobile Money'} · {o.payment_status}
                  </p>
                  {tab === 'selling' && o.buyer_phone ? (
                    <p>
                      <span className="text-gray-500">Phone:</span> {o.buyer_phone}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Total</span>
                    <p className="text-2xl font-extrabold text-brand-600">K{o.total_zmw}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {tab === 'selling' && o.status === 'pending' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => updateStatus(o.id, 'confirmed')}
                        className="btn-primary disabled:opacity-60"
                      >
                        Confirm
                      </button>
                    ) : null}
                    {tab === 'selling' && o.status === 'confirmed' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => { const code = prompt('Enter the 6-digit delivery code from the buyer:'); if (code) updateStatus(o.id, 'delivered', code); }}
                        className="btn-primary disabled:opacity-60"
                      >
                        Mark delivered
                      </button>
                    ) : null}
                    {o.status === 'pending' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => updateStatus(o.id, 'cancelled')}
                        className="btn-outline disabled:opacity-60 text-red-600 border-red-300"
                      >
                        Cancel
                      </button>
                    ) : null}
                    <Link
                      href={`/items/${o.item_id}`}
                      className="btn-outline"
                    >
                      View item
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
