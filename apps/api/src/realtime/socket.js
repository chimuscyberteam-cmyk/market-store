import { Server } from 'socket.io';
import { verifyAccess } from '../utils/jwt.js';
import { pool } from '../db/pool.js';
import { env } from '../config/env.js';

function roomName(itemId, a, b) {
  return `item:${itemId}:${[a, b].sort().join(':')}`;
}

export function attachSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Missing token'));
    try { socket.user = verifyAccess(token); next(); }
    catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    const me = socket.user.sub;

    socket.on('chat:join', ({ itemId, otherUserId }) => {
      if (!itemId || !otherUserId) return;
      socket.join(roomName(itemId, me, otherUserId));
    });

    
    socket.on('chat:send', async ({ itemId, receiverId, body, imageUrl }, ack) => {
      try {
        const text = (body || '').trim();
        if (!text && !imageUrl) return ack && ack({ error: 'Message cannot be empty' });
        if (text.length > 2000) return ack && ack({ error: 'Message too long' });

        const { rows } = await pool.query(
          `INSERT INTO messages (item_id, sender_id, receiver_id, body, image_url)
           VALUES ($1,$2,$3,$4,$5) RETURNING *`,
          [itemId, me, receiverId, text, imageUrl || null]
        );
        const msg = rows[0];
        io.to(roomName(itemId, me, receiverId)).emit('chat:message', msg);
        if (ack) ack({ ok: true, message: msg });
      } catch (err) { if (ack) ack({ error: err.message }); }
    });

  });

  return io;
}
