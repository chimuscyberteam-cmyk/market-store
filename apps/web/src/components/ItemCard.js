'use client';
import Link from 'next/link';

export default function ItemCard({ item }) {
  const img = item.image_urls?.[0];
  return (
    <Link
      href={`/items/${item.id}`}
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-6xl font-bold text-gray-300">
            {item.category_name?.[0] ?? '?'}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
          {item.title}
        </h3>
        <p className="text-brand-600 font-bold text-lg mt-1">
          K{Number(item.price_zmw).toFixed(2)}
        </p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          {item.category_name}
        </p>
      </div>
    </Link>
  );
}
