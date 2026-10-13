import http from 'node:http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { attachSocket } from './realtime/socket.js';
import { pool } from './db/pool.js';

const app = createApp();
const server = http.createServer(app);
attachSocket(server);

server.listen(env.PORT, () => {
  console.log(`Market Store API on :${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown() {
  await pool.end();
  server.close(() => process.exit(0));
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
