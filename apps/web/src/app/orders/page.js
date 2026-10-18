'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';

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

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [modalOrderId, setModalOrderId] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [cashReceived, setCashReceived] = useState(false);

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
    setCodeError('');
    try {
      await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status, code: code || undefined }
      });
      setDeliveryModalOpen(false);
      setCodeInput('');
      setCashReceived(false);
      toast.success(`Order marked as ${status}!`);
      await load();
    } catch (e) {
      if (status === 'delivered') {
        setCodeError(e.message);
      } else {
        toast.error(e.message);
      }
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
            tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
          }`}
        >
          Buying ({buyerOrders.length})
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            tab === 'selling' ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 border border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
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
          <p className="text-lg font-bold dark:text-white">
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

            // 1. Digital Receipt View
            if (o.status === 'delivered') {
              return (
                <div key={o.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-6 right-6 border-4 border-green-500 text-green-500 font-black text-xl px-3 py-1 opacity-30 rounded-lg uppercase tracking-widest rotate-12 pointer-events-none">
                    Paid
                  </div>

                  <div className="text-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-4 mb-4">
                    <h2 className="font-extrabold text-xl dark:text-white tracking-tight">Market<span className="text-brand-600">Store</span></h2>
                    <p className="text-xs text-slate-500 mt-1">Official Digital Receipt</p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Order ID</span>
                      <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{o.id.split('-')[0].toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(o.created_at).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{o.item_title} (x{o.quantity || 1})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{tab === 'mine' ? 'Seller' : 'Buyer'}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{counterparty}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item Subtotal</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">K{(o.total_zmw - o.delivery_fee_zmw).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Fee</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">K{o.delivery_fee_zmw}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-slate-900 dark:text-white">Total Paid</span>
                      <span className="font-extrabold text-xl text-brand-600">K{o.total_zmw}</span>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-[10px] text-slate-400">Verified via Delivery Code: {o.delivery_code}</p>
                  </div>
                </div>
              );
            }

            // 2. Standard Order Card
            return (
              <div key={o.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${color}`}>
                    {o.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString()}
                  </span>
                </div>

                <h3 className="font-bold text-lg dark:text-white">{o.item_title}</h3>

                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 space-y-1">
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

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Total</span>
                    <p className="text-2xl font-extrabold text-brand-600">K{o.total_zmw}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {tab === 'selling' && o.status === 'pending' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => updateStatus(o.id, 'confirmed')}
                        className="btn-primary disabled:opacity-60 text-sm px-4 py-2"
                      >
                        Confirm Order
                      </button>
                    ) : null}
                    
                    {tab === 'selling' && o.status === 'confirmed' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => { 
                          setModalOrderId(o.id); 
                          setCodeInput(''); 
                          setCodeError(''); 
                          setCashReceived(false); 
                          setDeliveryModalOpen(true); 
                        }}
                        className="btn-primary disabled:opacity-60 text-sm px-4 py-2"
                      >
                        Mark Delivered
                      </button>
                    ) : null}
                    
                    {tab === 'mine' && o.status !== 'cancelled' && o.delivery_code ? (
                       <div className="mr-4 text-right">
                         <p className="text-[10px] uppercase font-bold text-brand-600">Your Code</p>
                         <p className="font-mono font-extrabold text-lg tracking-widest text-slate-800 dark:text-slate-200">{o.delivery_code}</p>
                       </div>
                    ) : null}

                    {o.status === 'pending' ? (
                      <button
                        disabled={busyId === o.id}
                        onClick={() => updateStatus(o.id, 'cancelled')}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    ) : null}
                    <Link
                      href={`/items/${o.item_id}`}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
                    >
                      View Item
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Code Modal */}
      <Modal isOpen={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} title="Confirm Delivery">
        <p className="text-sm text-slate-500 mb-6 text-center">Ask the buyer for their 6-digit code to complete the order.</p>
        
        <input
          type="text"
          maxLength={6}
          placeholder="000000"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-3xl tracking-[0.5em] font-extrabold px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 outline-none transition mb-2"
          autoFocus
        />
        
        {codeError ? (
          <p className="text-red-500 text-xs font-semibold text-center mb-4">{codeError}</p>
        ) : <div className="mb-4"></div>}

        <label className="flex items-start gap-3 mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <input 
            type="checkbox" 
            checked={cashReceived}
            onChange={(e) => setCashReceived(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded text-brand-600 focus:ring-brand-500" 
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-tight">
            I confirm I have received the cash payment from the buyer.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => setDeliveryModalOpen(false)}
            className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => updateStatus(modalOrderId, 'delivered', codeInput)}
            disabled={codeInput.length !== 6 || busyId === modalOrderId || !cashReceived}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition shadow-lg shadow-brand-500/30"
          >
            {busyId === modalOrderId ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
