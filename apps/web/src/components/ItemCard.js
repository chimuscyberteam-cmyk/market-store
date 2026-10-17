'use client';
import Link from 'next/link';

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ItemCard({ item }) {
  const img = item.image_urls?.[0];
  const initial = item.category_name?.[0] ?? '?';

  return (
    <Link
      href={`/items/${item.id}`}
      className="card-premium flex flex-col overflow-hidden group"
    >
        {item.is_featured && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
            ⭐ Featured
          </div>
        )}

      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="text-7xl font-extrabold text-gray-300 dark:text-gray-700 select-none">
            {initial}
          </span>
        )}
        <span className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-[11px] font-bold px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-200 shadow-sm">
          {item.category_name}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.title}
        </h3>

        <p className="text-brand-600 font-extrabold text-lg mt-1.5">
          K{Number(item.price_zmw).toFixed(2)}
        </p>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">
            {item.seller_name ? `by ${item.seller_name}` : ''}
          </span>
          <span className="shrink-0 ml-2">{timeAgo(item.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
