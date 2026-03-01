import http from 'http';
import dotenv from 'dotenv';
import syncWorker from './workers/syncWorker.js';

dotenv.config();

// Minimal health server so Render free web service tier keeps this process alive.
const PORT = process.env.PORT || 3099;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, service: 'new-platform-worker', ts: Date.now() }));
}).listen(PORT, () => console.log(`[Sync Worker] Health server listening on ${PORT}`));

const shutdown = (signal) => {
  console.log(`[Sync Worker] Shutdown signal received: ${signal}`);
  syncWorker.stop();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

syncWorker.start();
console.log('[Sync Worker] Credit sync worker started');
