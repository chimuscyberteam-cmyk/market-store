'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ItemCard from '@/components/ItemCard';
import { apiFetch } from '@/lib/api';

const CATEGORIES = [
  { slug: 'all',         name: 'All',         icon: '🛍️' },
  { slug: 'food',        name: 'Food',        icon: '🍔' },
  { slug: 'clothing',    name: 'Fashion',     icon: '👕' },
  { slug: 'electronics', name: 'Electronics', icon: '📱' },
  { slug: 'books',       name: 'Books',       icon: '📚' },
  { slug: 'home',        name: 'Home',        icon: '🏠' },
  { slug: 'beauty',      name: 'Beauty',      icon: '💅' },
  { slug: 'sports',      name: 'Sports',      icon: '⚽' },
  { slug: 'services',    name: 'Services',    icon: '✂️' },
  { slug: 'other',       name: 'Other',       icon: '📦' }
];

function HomeInner() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState(urlQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQuery);
  const timer = useRef(null);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

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

  const isFiltered = category !== 'all' || Boolean(debouncedSearch);
  const activeCategory = CATEGORIES.find((c) => c.slug === category);

  return (
    <div className="animate-in">
      {!isFiltered ? (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-emerald-800 dark:from-brand-800 dark:via-brand-900 dark:to-emerald-950 text-white px-6 py-10 md:py-14 mb-8 shadow-card">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white/15 backdrop-blur px-3 py-1 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Mulungushi University
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Buy &amp; sell on campus.
            </h1>
            <p className="text-white/85 mt-3 text-base md:text-lg max-w-xl">
              Fast delivery from sellers around you. Post anything in seconds.
            </p>
            <div className="flex flex-wrap gap-2 mt-6 text-xs md:text-sm">
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full font-semibold">
                ⚡ Fast delivery
              </span>
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full font-semibold">
                🛡️ Safe payments
              </span>
              <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full font-semibold">
                📍 Campus only
              </span>
            </div>
          </div>

          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5 pointer-events-none"></div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">Browse categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition ${
                  active
                    ? 'bg-brand-600 text-white shadow-card'
                    : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-card'
                }`}
              >
                <span className="text-2xl">{c.icon}</span>
                <span className={`text-[11px] font-bold ${active ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold">
            {isFiltered ? 'Results' : 'Recent listings'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {debouncedSearch
              ? `for "${debouncedSearch}"`
              : category === 'all'
                ? 'Fresh finds around campus'
                : `${activeCategory?.name ?? ''} listings`}
          </p>
        </div>
        {isFiltered ? (
          <button
            onClick={() => { setCategory('all'); setSearch(''); setDebouncedSearch(''); }}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Clear filters
          </button>
        ) : null}
      </section>

      {error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-2xl p-4 mb-6">
          <p className="font-semibold">Couldn't reach API</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <EmptyState search={debouncedSearch} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
        >
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 animate-pulse"></div>
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse mt-3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
        {search ? `No results for "${search}"` : 'Nothing here yet'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        {search ? 'Try a different search or browse all categories' : 'Be the first to post an item'}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  );
}
