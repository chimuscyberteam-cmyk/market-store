'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItemData, setEditItemData] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isPro, setIsPro] = useState(user?.subscription_tier === 'pro');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const load = async () => {
    try {
      const res = await apiFetch('/api/items/mine/list');
      setItems(res.items || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const updateStatus = async (id, status) => {
    if (status === 'removed') { setDeleteId(id); return; }
    
    try {
      await apiFetch(`/api/items/${id}/status`, { method: 'PATCH', body: { status } });
      load();
    } catch (e) { toast.error(e.message); }
  };

  
  
  const handleBoost = async (id) => {
    try {
      await apiFetch('/api/items/' + id + '/boost', { method: 'POST' });
      toast.success('Item boosted to the top of the homepage! ⭐');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleGoPro = async () => {
    try {
      await apiFetch('/api/users/subscribe-pro', { method: 'POST' });
      toast.success('You are now a PRO seller! 👑');
      setIsPro(true);
    } catch (e) { toast.error(e.message); }
  };

  const openEdit = (item) => {
    setEditItemData(item);
    setEditPrice(item.price_zmw);
    setEditQty(item.quantity);
  };

  const saveEdit = async () => {
    try {
      await apiFetch(`/api/items/${editItemData.id}`, { 
        method: 'PATCH', 
        body: { priceZmw: parseFloat(editPrice), quantity: parseInt(editQty) } 
      });
      toast.success('Item updated successfully!');
      setEditItemData(null);
      load();
    } catch (e) { toast.error(e.message); }
  };
;

  if (authLoading || loading) return <div className="text-center py-20 text-gray-500">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">My Listings</h1>
          <p className="text-gray-500">Manage your posted items.</p>
        </div>
        <div className="flex gap-2">
          {!isPro && <button onClick={handleGoPro} className="bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold px-4 py-2 rounded-xl shadow-md">👑 Go Pro</button>}
          <Link href="/items/new" className="btn-primary">+ Post New Item</Link>
        </div>
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
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:underline">Edit</button>
                  {item.status === 'active' && (
                    <>
                      <button onClick={() => handleBoost(item.id)} className="text-amber-500 hover:underline">Boost</button>
                      <button onClick={() => updateStatus(item.id, 'removed')} className="text-red-600 hover:underline">Remove</button>
                    </>
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
    
      {/* Edit Modal */}
      <Modal isOpen={!!editItemData} onClose={() => setEditItemData(null)} title="Edit Listing">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Price (ZMW)</label>
            <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Stock Quantity</label>
            <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="w-full mt-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-brand-500" />
          </div>
          <button onClick={saveEdit} className="w-full py-3 mt-2 rounded-xl font-bold text-white bg-brand-600 hover:bg-brand-700">Save Changes</button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove Item?">
        <p className="text-slate-500 mb-6">This will hide the item from the marketplace. You can relist it later.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button onClick={() => { updateStatus(deleteId, 'removed'); setDeleteId(null); }} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700">Remove</button>
        </div>
      </Modal>
</div>
  );
}
