'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

export default function Messages() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await apiFetch('/api/chat/conversations');
        setConversations(data.conversations || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6">Messages</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-1">Messages</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Your conversations with buyers and sellers
      </p>

      {conversations.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-bold">No messages yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 px-6">
            Tap "Chat with seller" on any item to start a conversation
          </p>
          <Link href="/" className="btn-primary mt-6 inline-flex">
            Browse items
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Link
              key={`${c.item_id}-${c.other_user_id}`}
              href={`/chat/${c.item_id}/${c.other_user_id}`}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-card card-hover animate-in"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                  {c.other_user_name?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className="font-bold truncate">{c.other_user_name}</h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {timeAgo(c.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {c.item_title}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                    {c.last_message_body}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
