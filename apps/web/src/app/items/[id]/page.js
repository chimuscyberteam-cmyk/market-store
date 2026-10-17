'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';

function metersLabel(m) {
  if (!m) return '';
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutData, setCheckoutData] = useState(null);
  const [coordsCache, setCoordsCache] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/items/${id}`, { auth: false });
        setItem(data.item);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Location not supported'));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        (err) => reject(new Error(err.message || 'Location permission denied')),
        { enableHighAccuracy: false, timeout: 15000 }
      );
    });
  }

  async function calculateFee() {
    setBusy(true);
    try {
      const loc = await getLocation();
      const data = await apiFetch('/api/orders/quote', {
        method: 'POST',
        auth: false,
        body: {
          itemId: id,
          deliveryLat: loc.lat,
          deliveryLng: loc.lng, quantity }
      });
      setQuote(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function initiateBuy() {
    if (!user) { router.push('/login'); return; }
    setBusy(true);
    try {
      const loc = await getLocation();
      const q = await apiFetch('/api/orders/quote', {
        method: 'POST',
        auth: false,
        body: { itemId: id, deliveryLat: loc.lat, deliveryLng: loc.lng, quantity }
      });
      setCoordsCache(loc);
      setCheckoutData(q);
    } catch (e) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  async function confirmBuy() {
    setBusy(true);
    try {
      await apiFetch('/api/orders', {
        method: 'POST',
        body: { itemId: id, deliveryLat: coordsCache.lat, deliveryLng: coordsCache.lng, quantity, paymentMethod: 'pod' }
      });
      toast.success('Order placed! Check Orders tab.');
      setCheckoutData(null);
      router.push('/orders');
    } catch (e) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }
  if (error || !item) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 font-semibold">{error || 'Item not found'}</p>
        <Link href="/" className="text-brand-600 font-semibold mt-3 inline-block">← Back to Browse</Link>
      
      <Modal isOpen={!!checkoutData} onClose={() => setCheckoutData(null)} title="Confirm Purchase">
        {checkoutData && (
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between"><span>Item Price (x{quantity})</span><span className="font-semibold text-slate-900 dark:text-white">K{checkoutData.itemPriceZmw}</span></div>
              <div className="flex justify-between"><span>Delivery Fee ({metersLabel(checkoutData.distanceMeters)})</span><span className="font-semibold text-slate-900 dark:text-white">K{checkoutData.deliveryFeeZmw}</span></div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                <span className="font-bold text-slate-900 dark:text-white">Total to pay on delivery</span>
                <span className="font-extrabold text-brand-600 text-lg">K{checkoutData.totalZmw}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCheckoutData(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
              <button onClick={confirmBuy} disabled={busy} className="flex-1 py-3 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700">{busy ? 'Placing...' : 'Place Order'}</button>
            </div>
          </div>
        )}
      </Modal>
</div>
    );
  }

  const img = item.image_urls?.[0];

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/" className="text-sm text-gray-500 hover:text-brand-600 inline-block mb-4">
        ← Back to Browse
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center">
          {img ? (
            <img src={img} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-9xl font-bold text-gray-300">
              {item.category_name?.[0] ?? '?'}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm text-gray-500">{item.category_name}</p>
          <h1 className="text-2xl font-extrabold mt-1">{item.title}</h1>
          
          <p className="text-3xl font-extrabold text-brand-600 mt-3">
            K{(Number(item.price_zmw) * quantity).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{item.quantity} available</p>

          <div className="flex items-center gap-4 mt-6">
            <span className="text-sm font-bold text-gray-700">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 text-lg">-</button>
              <span className="px-4 py-1 font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(item.quantity, q + 1))} className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 text-lg">+</button>
            </div>
          </div>


          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700">Description</h3>
            <p className="text-gray-700 mt-1 whitespace-pre-wrap">
              {item.description || 'No description provided'}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-700">Seller</h3>
            <p className="text-gray-900">{item.seller_name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Located at {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button onClick={initiateBuy} disabled={busy} className="btn-primary disabled:opacity-60">
              {busy ? 'Working…' : 'Buy now'}
            </button>

            {user && user.id !== item.seller_id ? (
              <button
                onClick={() => router.push(`/chat/${id}/${item.seller_id}`)}
                className="btn-outline"
              >
                💬 Chat with seller
              </button>
            ) : null}

            <button onClick={calculateFee} disabled={busy} className="btn-outline">
              Calculate delivery to my location
            </button>
          </div>

          {quote ? (
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Distance</span><span>{metersLabel(quote.distanceMeters)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mt-2">
                <span>Item</span><span>K{quote.itemPriceZmw}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700 mt-2">
                <span>Delivery</span><span>K{quote.deliveryFeeZmw}</span>
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-extrabold text-brand-600">K{quote.totalZmw}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
