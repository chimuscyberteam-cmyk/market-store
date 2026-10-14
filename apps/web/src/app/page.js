'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import ItemCard from '@/components/ItemCard';
import { apiFetch, API_URL } from '@/lib/api';

const CATEGORIES = [
  { slug: 'all',         name: 'All' },
  { slug: 'food',        name: 'Food' },
  { slug: 'clothing',    name: 'Clothing' },
  { slug: 'electronics', name: 'Electronics' },
  { slug: 'books',       name: 'Books' },
  { slug: 'home',        name: 'Home' },
  { slug: 'beauty',      name: 'Beauty' },
  { slug: 'sports',      name: 'Sports' },
  { slug: 'services',    name: 'Services' },
  { slug: 'other',       name: 'Other' }
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => timer.current && clearTimeout(timer.current);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const qs = params.toString();
      const data = await apiFetch(`/api/items${qs ? `?${qs}` : ''}`, { auth: false });
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">What are you looking for?</h1>
        <p className="text-gray-600 mt-1">Buy and sell on Mulungushi campus.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="Search items, services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((c) => {
          const active = category === c.slug;
          return (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition ${
                active
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-brand-500'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
          <p className="font-semibold">Couldn't reach API</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-3">🔍</p>
          <h2 className="text-xl font-bold text-gray-900">Nothing here yet</h2>
          <p className="text-gray-500 mt-1">
            {debouncedSearch ? `No results for "${debouncedSearch}"` : 'Try another category or post the first item'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
