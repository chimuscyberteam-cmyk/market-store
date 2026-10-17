'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const load = async () => {
    try {
      const res = await apiFetch('/api/items/mine/list');
      setItems(res.items || []);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const updateStatus = async (id, status) => {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
    try {
      await apiFetch(`/api/items/${id}/status`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) { alert(e.message); }
  };

  const editItem = async (id, currentPrice, currentQty) => {
    const price = prompt('Enter new price (ZMW):', currentPrice);
    if (!price) return;
    const qty = prompt('Enter new stock quantity:', currentQty);
    if (!qty) return;
    
    try {
      await apiFetch(`/api/items/${id}`, { 
        method: 'PATCH', 
        body: { priceZmw: parseFloat(price), quantity: parseInt(qty) } 
      });
      load();
    } catch (e) { alert(e.message); }
  };

  if (authLoading || loading) return <div className="text-center py-20 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">My Listings</h1>
          <p className="text-gray-500">Manage your posted items.</p>
        </div>
        <Link href="/items/new" className="btn-primary">+ Post New Item</Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-lg font-bold">No items posted yet</p>
          <Link href="/items/new" className="btn-primary mt-4 inline-flex">Post an item</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {item.image_urls?.[0] ? (
                  <img src={item.image_urls[0]} alt={item.title} className="w-full h-full object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-gray-400">No Img</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold truncate">{item.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-brand-600 font-bold mt-1">K{item.price_zmw}</p>
                <p className="text-xs text-gray-500">Stock: {item.quantity}</p>
                
                <div className="flex gap-3 mt-3 text-sm font-semibold">
                  <button onClick={() => editItem(item.id, item.price_zmw, item.quantity)} className="text-blue-600 hover:underline">Edit</button>
                  {item.status === 'active' && (
                    <button onClick={() => updateStatus(item.id, 'removed')} className="text-red-600 hover:underline">Remove</button>
                  )}
                  {item.status === 'removed' && (
                    <button onClick={() => updateStatus(item.id, 'active')} className="text-green-600 hover:underline">Relist</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
