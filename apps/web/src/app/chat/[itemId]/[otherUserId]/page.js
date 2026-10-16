'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { apiFetch, getToken, API_URL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const itemId = params.itemId;
  const otherUserId = params.otherUserId;

  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user || !itemId) return;
    (async () => {
      try {
        const itemData = await apiFetch(`/api/items/${itemId}`, { auth: false });
        setItem(itemData.item);
        const history = await apiFetch(`/api/chat/${itemId}/${otherUserId}`);
        setMessages(history.messages || []);
        // Mark this thread as read
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://market-store-api.onrender.com'}/api/chat/${itemId}/${otherUserId}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('ms.accessToken') || ''}` }
        }).catch(() => {});
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, itemId, otherUserId]);

  useEffect(() => {
    if (!user || !itemId) return;
    const token = getToken();
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { itemId, otherUserId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat:message', (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    socket.on('connect_error', (e) => setError(`Socket: ${e.message}`));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, itemId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit(
      'chat:send',
      { itemId, receiverId: otherUserId, body: text },
      (res) => {
        setSending(false);
        if (res?.error) alert(res.error);
      }
    );
    setBody('');
  }

  if (authLoading || loading || !user) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-600 font-semibold">{error}</p>
        <Link href="/messages" className="text-brand-600 font-semibold mt-4 inline-block">
          ← Back to messages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl border border-gray-100 dark:border-gray-800 border-b-0 p-4 flex items-center gap-3">
        <Link href="/messages" className="text-gray-500 hover:text-brand-600 text-lg shrink-0">
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold truncate">{item?.title ?? 'Chat'}</h1>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`}
              title={connected ? 'Connected' : 'Connecting…'}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            with {item?.seller_name ?? 'user'}
          </p>
        </div>
        <Link
          href={`/items/${itemId}`}
          className="text-sm text-brand-600 font-semibold shrink-0"
        >
          View item
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            No messages yet. Say hi 👋
          </div>
        ) : null}

        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl animate-in ${
                  mine
                    ? 'bg-brand-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-green-100 text-right' : 'text-gray-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="bg-white dark:bg-gray-900 rounded-b-2xl border border-gray-100 dark:border-gray-800 border-t-0 p-3 flex gap-2"
      >
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending || !connected}
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary px-6"
          disabled={sending || !body.trim() || !connected}
        >
          Send
        </button>
      </form>
    </div>
  );
}
