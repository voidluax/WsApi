'use strict';

/**
 * ==========================================================================
 *  RELAY — real-time chat server (REST rooms API + WebSocket on one port)
 * ==========================================================================
 *
 *  A single-file, dependency-light backend designed for Render's free tier.
 *
 *    Build Command : npm install
 *    Start Command : node server.js
 *
 *  Endpoints
 *    REST  → https://<app-name>.onrender.com/api/rooms      (GET / POST)
 *    REST  → https://<app-name>.onrender.com/api/rooms/:code (GET)
 *    WS    → wss://<app-name>.onrender.com                   (then send "join")
 *
 *  Storage is fully in-memory: rooms and usernames reset on restart, which
 *  is the expected behavior for a free-tier Web Service.
 *
 *  The only runtime dependency is `ws`.
 */

const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const store = require('./src/lib/chat-store');

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const PORT = Number(process.env.PORT) || 3000; // Render injects PORT
const MAX_BODY_BYTES = 16 * 1024;
const MAX_USERNAME_LEN = 24;
const MAX_MESSAGE_LEN = 500;
const HEARTBEAT_MS = 30_000;
const SWEEP_INTERVAL_MS = 10 * 60_000;
const EMPTY_ROOM_TTL_MS = 60 * 60_000;

const startedAt = Date.now();

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendWs(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendWsError(ws, code, message) {
  sendWs(ws, { type: 'error', code, message, timestamp: new Date().toISOString() });
}

/* ------------------------------------------------------------------ */
/* REST API                                                            */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  // CORS preflight for browser-based clients
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  // GET / → friendly service descriptor (handy for Render's root check)
  if (path === '/' && method === 'GET') {
    sendJson(res, 200, {
      service: 'relay-chat',
      status: 'ok',
      docs: 'See README.md for the full API & WebSocket reference.',
      endpoints: {
        createRoom: 'POST /api/rooms',
        listRooms: 'GET /api/rooms',
        roomInfo: 'GET /api/rooms/:code',
        health: 'GET /api/health',
        websocket: 'wss://<your-app>.onrender.com (send {"type":"join", ...})',
      },
    });
    return;
  }

  // GET /api/health → liveness probe
  if (path === '/api/health' && method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      uptime: Math.round((Date.now() - startedAt) / 1000),
      rooms: store.getRooms().size,
      connections: wss.clients.size,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // POST /api/rooms → create a room, returns a freshly generated code
  if (path === '/api/rooms' && method === 'POST') {
    readBody(req)
      .then((raw) => {
        if (raw && raw.trim() !== '') {
          try {
            JSON.parse(raw); // body is optional, but must be valid JSON
          } catch {
            sendJson(res, 400, {
              error: 'INVALID_JSON',
              message: 'Request body must be valid JSON (or empty).',
            });
            return;
          }
        }
        const room = store.createRoom();
        sendJson(res, 201, {
          roomCode: room.code,
          createdAt: room.createdAt,
          join: 'Connect via WebSocket and send {"type":"join","roomCode":"' + room.code + '","username":"<name>"}',
        });
      })
      .catch(() =>
        sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Could not read request body.' }),
      );
    return;
  }

  // GET /api/rooms → list active rooms
  if (path === '/api/rooms' && method === 'GET') {
    const rooms = store.listRooms();
    sendJson(res, 200, { totalRooms: rooms.length, rooms });
    return;
  }

  // GET /api/rooms/:code → room details (or 404)
  const roomMatch = path.match(/^\/api\/rooms\/([A-Za-z0-9]{6})$/);
  if (roomMatch && method === 'GET') {
    const room = store.getRoom(roomMatch[1]);
    if (!room) {
      sendJson(res, 404, {
        error: 'ROOM_NOT_FOUND',
        message: `Room "${roomMatch[1].toUpperCase()}" does not exist or has expired.`,
      });
      return;
    }
    sendJson(res, 200, store.roomSummary(room));
    return;
  }

  // Known paths with a wrong verb → 405
  if (path === '/api/rooms' || roomMatch) {
    sendJson(res, 405, { error: 'METHOD_NOT_ALLOWED', message: `${method} is not allowed on ${path}.` });
    return;
  }

  sendJson(res, 404, { error: 'NOT_FOUND', message: `No route matches ${method} ${path}.` });
});

/* ------------------------------------------------------------------ */
/* WebSocket layer                                                     */
/* ------------------------------------------------------------------ */

const wss = new WebSocketServer({ server });

/**
 * Broadcast a payload to every client in a room.
 * @param {object} room
 * @param {object} payload
 * @param {string|null} excludeClientId - skip one client (e.g. the joiner)
 */
function broadcast(room, payload, excludeClientId = null) {
  const raw = JSON.stringify(payload);
  for (const client of room.clients.values()) {
    if (excludeClientId && client.id === excludeClientId) continue;
    if (client.ws && client.ws.readyState === client.ws.OPEN) client.ws.send(raw);
  }
}

function systemMessage(room, message, excludeClientId = null) {
  broadcast(
    room,
    { type: 'system', message, roomCode: room.code, timestamp: new Date().toISOString() },
    excludeClientId,
  );
}

function detachFromRoom(ws, { silent = false, ackLeave = false } = {}) {
  const info = ws.__relay;
  if (!info || !info.roomCode) return;
  const room = store.getRoom(info.roomCode);
  if (room) {
    const client = room.clients.get(info.clientId);
    room.clients.delete(info.clientId);
    if (!silent && client) {
      systemMessage(room, `${client.username} has left the room`);
    }
    if (ackLeave) {
      sendWs(ws, { type: 'left', roomCode: room.code, timestamp: new Date().toISOString() });
    }
    store.removeRoomIfEmpty(room.code); // free the code + usernames
  }
  info.roomCode = null;
  info.username = null;
}

function handleJoin(ws, msg) {
  const roomCode = typeof msg.roomCode === 'string' ? msg.roomCode.trim().toUpperCase() : '';
  const username = typeof msg.username === 'string' ? msg.username.trim() : '';

  if (!roomCode) return sendWsError(ws, 'MISSING_ROOM_CODE', 'Field "roomCode" is required to join.');
  if (!username) return sendWsError(ws, 'MISSING_USERNAME', 'Field "username" is required to join.');
  if (username.length > MAX_USERNAME_LEN) {
    return sendWsError(ws, 'USERNAME_TOO_LONG', `Usernames are limited to ${MAX_USERNAME_LEN} characters.`);
  }

  const room = store.getRoom(roomCode);
  if (!room) {
    return sendWsError(ws, 'ROOM_NOT_FOUND', `Room "${roomCode}" does not exist. Create it first with POST /api/rooms.`);
  }

  // Re-joining from the same socket? Leave the previous room first.
  if (ws.__relay.roomCode) detachFromRoom(ws);

  const client = {
    id: ws.__relay.clientId,
    username,
    joinedAt: new Date().toISOString(),
    ws,
  };
  room.clients.set(client.id, client);
  ws.__relay.roomCode = room.code;
  ws.__relay.username = username;

  // NOTE (by design): usernames are NOT unique-checked here. A taken name
  // never blocks a join, and every disconnect frees the name instantly.

  sendWs(ws, {
    type: 'joined',
    roomCode: room.code,
    username,
    users: Array.from(room.clients.values()).map((c) => c.username),
    activeUsers: room.clients.size,
    timestamp: new Date().toISOString(),
  });
  systemMessage(room, `${username} has joined the room`, client.id);
}

function handleMessage(ws, msg) {
  const info = ws.__relay;
  if (!info.roomCode) {
    return sendWsError(ws, 'NOT_JOINED', 'You must join a room before sending messages.');
  }
  const room = store.getRoom(info.roomCode);
  if (!room) detachFromRoom(ws, { silent: true });
  if (!room || !room.clients.has(info.clientId)) {
    return sendWsError(ws, 'ROOM_NOT_FOUND', 'The room you were in no longer exists.');
  }

  const text = typeof msg.message === 'string' ? msg.message.trim() : '';
  if (!text) return sendWsError(ws, 'EMPTY_MESSAGE', 'Field "message" must be a non-empty string.');
  if (text.length > MAX_MESSAGE_LEN) {
    return sendWsError(ws, 'MESSAGE_TOO_LONG', `Messages are limited to ${MAX_MESSAGE_LEN} characters.`);
  }

  broadcast(room, {
    type: 'message',
    id: crypto.randomUUID(),
    username: info.username,
    message: text,
    roomCode: room.code,
    timestamp: new Date().toISOString(),
  });
}

function handleFrame(ws, raw) {
  let msg;
  try {
    msg = JSON.parse(raw.toString());
  } catch {
    return sendWsError(ws, 'INVALID_JSON', 'Messages must be valid JSON.');
  }
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return sendWsError(ws, 'INVALID_MESSAGE', 'Payload must be a JSON object with a string "type".');
  }

  switch (msg.type) {
    case 'join':
      return handleJoin(ws, msg);
    case 'message':
      return handleMessage(ws, msg);
    case 'leave':
      return detachFromRoom(ws, { ackLeave: true });
    case 'ping':
      return sendWs(ws, { type: 'pong', timestamp: new Date().toISOString() });
    default:
      return sendWsError(ws, 'UNKNOWN_TYPE', `Unknown message type "${msg.type}". Use "join", "message" or "leave".`);
  }
}

wss.on('connection', (ws) => {
  ws.__relay = { clientId: crypto.randomUUID(), roomCode: null, username: null };
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  sendWs(ws, {
    type: 'welcome',
    message: 'Connected to Relay. Send {"type":"join","roomCode":"......" ,"username":"..."} to enter a room.',
    timestamp: new Date().toISOString(),
  });

  ws.on('message', (raw) => {
    try {
      handleFrame(ws, raw);
    } catch (err) {
      console.error('[ws] unhandled frame error:', err);
      sendWsError(ws, 'INTERNAL_ERROR', 'Something went wrong handling your message.');
    }
  });

  ws.on('error', (err) => {
    console.error('[ws] socket error:', err && err.message ? err.message : err);
  });

  // Any disconnect (clean close, drop, heartbeat kill) frees the username.
  ws.on('close', () => detachFromRoom(ws));
});

// Heartbeat: drop half-open connections so rooms never leak "ghost" users.
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      /* socket already gone */
    }
  }
}, HEARTBEAT_MS);

// Sweeper: reclaim codes from rooms that have been empty for over an hour.
const sweeper = setInterval(() => {
  const removed = store.sweepStaleRooms(EMPTY_ROOM_TTL_MS);
  if (removed.length) console.log(`[sweep] removed stale rooms: ${removed.join(', ')}`);
}, SWEEP_INTERVAL_MS);

/* ------------------------------------------------------------------ */
/* Startup & graceful shutdown                                         */
/* ------------------------------------------------------------------ */

server.listen(PORT, () => {
  console.log(`[relay] HTTP + WebSocket server listening on :${PORT}`);
  console.log(`[relay] REST  → http://localhost:${PORT}/api/rooms`);
  console.log(`[relay] WS    → ws://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`[relay] ${signal} received — shutting down gracefully`);
  clearInterval(heartbeat);
  clearInterval(sweeper);
  for (const ws of wss.clients) {
    try {
      ws.close(1001, 'Server shutting down');
    } catch {
      /* noop */
    }
  }
  wss.close(() => {
    server.close(() => process.exit(0));
  });
  // Never hang the deploy: force-exit if sockets linger.
  setTimeout(() => process.exit(0), 5_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[relay] unhandledRejection:', reason));
process.on('uncaughtException', (err) => console.error('[relay] uncaughtException:', err));
