'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { apiFetch, getToken, API_URL } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { Modal } from '@/components/Modal';
import { toast } from 'sonner';

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
  
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [deleteMsgId, setDeleteMsgId] = useState(null);
  const [selectedMsgId, setSelectedMsgId] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

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

    const socket = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] });
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
    socket.on('chat:edited', (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
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

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'market-store-unsigned');
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || 'rxept7vj'}/image/upload`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      socketRef.current.emit('chat:send', { itemId, receiverId: otherUserId, body: '', imageUrl: data.secure_url }, (res) => {
        if (res?.error) toast.error(res.error);
      });
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function send(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !socketRef.current) return;
    setSending(true);
    socketRef.current.emit('chat:send', { itemId, receiverId: otherUserId, body: text }, (res) => {
      setSending(false);
      if (res?.error) toast.error(res.error);
    });
    setBody('');
  }

  function saveEdit(id) {
    const text = editBody.trim();
    if (!text) return;
    setEditingId(null);
    socketRef.current.emit('chat:edit', { messageId: id, body: text, itemId, otherUserId }, (res) => {
      if (res?.error) toast.error(res.error);
    });
  }

  function confirmDelete(id) {
    socketRef.current.emit('chat:delete', { messageId: id, itemId, otherUserId }, (res) => {
      if (res?.error) toast.error(res.error);
      setDeleteMsgId(null);
    });
  }

  if (authLoading || loading || !user) {
    return <div className="text-center py-20 text-gray-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-red-600 font-semibold">{error}</p>
        <Link href="/messages" className="text-brand-600 font-semibold mt-4 inline-block">← Back to messages</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100vh-200px)] min-h-[500px] mb-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl border border-gray-100 dark:border-gray-800 border-b-0 p-4 flex items-center gap-3">
        <Link href="/messages" className="text-gray-500 hover:text-brand-600 text-lg shrink-0">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold truncate">{item?.title ?? 'Chat'}</h1>
            <span className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-emerald-500' : 'bg-gray-300'}`} title={connected ? 'Connected' : 'Connecting…'} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">with {item?.seller_name ?? 'user'}</p>
        </div>
        <Link href={`/items/${itemId}`} className="text-sm text-brand-600 font-semibold shrink-0">View item</Link>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">No messages yet. Say hi 👋</div>
        ) : null}

        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              <div
                onClick={() => { if (mine && !m.is_deleted && !editingId) setSelectedMsgId(m.id === selectedMsgId ? null : m.id); }}
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl animate-in ${
                  mine
                    ? 'bg-brand-600 text-white rounded-br-md cursor-pointer active:scale-[0.98] transition-transform'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-md'
                }`}
              >
                {editingId === m.id ? (
                  <div className="flex flex-col gap-3 min-w-[220px]">
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-lg text-sm text-slate-900 bg-white border-none focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(m.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-white/20 hover:bg-white/30 transition">Cancel</button>
                      <button type="button" onClick={() => saveEdit(m.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-white hover:bg-slate-100 transition shadow-sm">Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {m.is_deleted ? (
                      <span className="italic opacity-70 text-sm">🚫 This message was deleted</span>
                    ) : (
                      <>
                        {m.image_url && (
                          <img src={m.image_url} alt="attachment" className="rounded-lg mb-2 max-w-full h-auto max-h-60 object-cover cursor-pointer" onClick={() => window.open(m.image_url, '_blank')} />
                        )}
                        {m.body && <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>}
                      </>
                    )}
                  </>
                )}
                {editingId !== m.id && (
                  <div className={`flex items-center gap-2 mt-1 text-[10px] ${mine ? 'text-green-100 justify-end' : 'text-gray-400'}`}>
                    {m.edited_at && !m.is_deleted && <span>(edited)</span>}
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
              
              {selectedMsgId === m.id && !m.image_url && (
                <div className="flex gap-3 mt-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 text-xs font-bold animate-in fade-in zoom-in-95">
                  <button onClick={() => { setEditingId(m.id); setEditBody(m.body); setSelectedMsgId(null); }} className="text-blue-600 hover:text-blue-700">Edit</button>
                  <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                  <button onClick={() => { setDeleteMsgId(m.id); setSelectedMsgId(null); }} className="text-red-600 hover:text-red-700">Delete</button>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="bg-white dark:bg-gray-900 rounded-b-2xl border border-gray-100 dark:border-gray-800 border-t-0 p-3 flex gap-2 items-center pb-6 md:pb-3 shadow-sm">
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0">
          {uploading ? '⏳' : '📎'}
        </button>
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={sending || !connected}
          autoFocus
        />
        <button type="submit" className="btn-primary px-6" disabled={sending || !body.trim() || !connected}>
          Send
        </button>
      </form>

      <Modal isOpen={!!deleteMsgId} onClose={() => setDeleteMsgId(null)} title="Delete Message?">
        <p className="text-slate-500 mb-6">This message will be replaced with "This message was deleted".</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteMsgId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">Cancel</button>
          <button onClick={() => confirmDelete(deleteMsgId)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
