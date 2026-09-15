# 🛰️ Relay — Real-Time Chat Server (REST + WebSocket)

A lightweight, dependency-minimal real-time chat backend built for **Render's free tier**.
Create chat rooms with a single HTTP request, then talk in real time over WebSocket.
No database, no accounts, no persistence — rooms and usernames live in memory and reset on restart (perfectly fine for a free-tier demo).

> **One HTTP server. One WebSocket server. One port.** Both run from a single `server.js`.

---

## ✨ Features

- **Random room codes** — `POST /api/rooms` returns a unique 6-character code (e.g. `A7X3K9`)
- **Real-time rooms over WebSocket** — messages broadcast only to members of the same room
- **System messages** — automatic `"Alex has joined the room"` / `"Alex has left the room"` events
- **Usernames as presence tokens** — required to join, scoped per room, freed the moment you disconnect
- **Graceful error handling** — structured error frames (never crashes, never hangs), heartbeat ping/pong to reap dead connections
- **Memory hygiene** — empty rooms are recycled automatically, stale empty rooms swept hourly
- **Graceful shutdown** — drains sockets on `SIGTERM`/`SIGINT` (Render-friendly deploys)
- **Open CORS** — REST endpoints work from browsers, Postman, curl, anything
- **Single dependency** — [`ws`](https://github.com/websockets/ws). That's it.

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 18+ |
| WebSocket | `ws` |
| HTTP REST | Node's built-in `http` module (zero framework) |
| Storage | In-memory `Map` (no database) |
| Hosting | Render Web Service (free tier) |

```
server.js               ← the entire server (REST + WebSocket + lifecycle)
src/lib/chat-store.js   ← shared in-memory room store
scripts/ws-test.js      ← optional end-to-end smoke test
```

---

## 🚀 Run Locally

**Requirements:** Node.js 18+

```bash
# 1. clone & install
git clone https://github.com/<you>/relay-chat.git
cd relay-chat
npm install

# 2. start the server (default port 3000)
node server.js

# or pick a port
PORT=8080 node server.js
```

You should see:

```
[relay] HTTP + WebSocket server listening on :3000
[relay] REST  → http://localhost:3000/api/rooms
[relay] WS    → ws://localhost:3000
```

**Try it** (in two terminals):

```bash
# terminal A — create a room
curl -X POST http://localhost:3000/api/rooms
# → {"roomCode":"A7X3K9", ...}

# terminal B — connect & chat (npm i -g wscat)
wscat -c ws://localhost:3000
> {"type":"join","roomCode":"A7X3K9","username":"Alex"}
> {"type":"message","message":"hello!"}
```

**Optional smoke test** (24 assertions, REST + WS):

```bash
PORT=3111 node server.js &   # in one shell
node scripts/ws-test.js       # in another
```

---

## ☁️ Deploy to Render (Free Tier)

1. Push this repo to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com) → **New → Web Service** → connect the repo.
3. Use these settings:

| Setting | Value |
|---|---|
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |
| **Health Check Path** | `/api/health` *(optional but recommended)* |

4. Click **Create Web Service**. Done — your API is at:

```
REST       https://<app-name>.onrender.com/api/rooms
WebSocket  wss://<app-name>.onrender.com
```

**Notes & constraints (free tier):**

- The server **must** listen on `process.env.PORT` — it already does (`Number(process.env.PORT) || 3000`).
- Render provides TLS termination, so clients use `wss://` (and `https://`) — no cert setup needed in code.
- Free instances **sleep after ~15 min of inactivity**. The first request / WebSocket connect after sleep may take ~50s to cold-start. Ping `GET /api/health` occasionally if you want it warm.
- Single instance only → in-memory state is consistent across all connected clients. If Render restarts the instance (deploy, crash, scale), all rooms and usernames are wiped — by design.

---

## 📡 REST API Documentation

**Base URL:** `https://<app-name>.onrender.com` (local: `http://localhost:3000`)
All responses are `application/json`. CORS is `*` (preflight `OPTIONS` handled).

### 1. Create a room — `POST /api/rooms`

Creates a new room with a unique, randomly generated code.

**Request body:** none required (body is optional; if sent, it must be valid JSON).

```bash
curl -X POST https://<app-name>.onrender.com/api/rooms
```

**Response — `201 Created`**

```json
{
  "roomCode": "A7X3K9",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "join": "Connect via WebSocket and send {\"type\":\"join\",\"roomCode\":\"A7X3K9\",\"username\":\"<name>\"}"
}
```

**Errors**

| Status | Body | Cause |
|---|---|---|
| `400` | `{"error":"INVALID_JSON","message":"Request body must be valid JSON (or empty)."}` | Malformed JSON body |
| `405` | `{"error":"METHOD_NOT_ALLOWED", ...}` | Wrong HTTP method |

---

### 2. List active rooms — `GET /api/rooms`

**Response — `200 OK`**

```json
{
  "totalRooms": 1,
  "rooms": [
    {
      "roomCode": "A7X3K9",
      "activeUsers": 2,
      "users": ["Alex", "Sam"],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 3. Room details — `GET /api/rooms/:code`

Returns info about a specific room. Code is case-insensitive (`a7x3k9` works too).

**Response — `200 OK`**

```json
{
  "roomCode": "A7X3K9",
  "activeUsers": 2,
  "users": ["Alex", "Sam"],
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Errors**

| Status | Body | Cause |
|---|---|---|
| `404` | `{"error":"ROOM_NOT_FOUND","message":"Room \"ZZZZ99\" does not exist or has expired."}` | Unknown / expired code |

---

### 4. Health check — `GET /api/health`

**Response — `200 OK`**

```json
{ "status": "ok", "uptime": 1234, "rooms": 3, "connections": 7, "timestamp": "2026-01-01T00:00:00.000Z" }
```

---

## 🔌 WebSocket Documentation

### Connection URL

```
Production: wss://<app-name>.onrender.com
Local:      ws://localhost:3000
```

Connect, then send JSON text frames. The server greets you immediately:

```json
{ "type": "welcome", "message": "Connected to Relay. Send {\"type\":\"join\", ...} to enter a room.", "timestamp": "..." }
```

All payloads are JSON objects with a string `type`. Timestamps are ISO-8601 UTC.

### Client → Server

#### Join a room

```json
{ "type": "join", "roomCode": "A7X3K9", "username": "Alex" }
```

- `roomCode` *(string, required)* — a code previously returned by `POST /api/rooms`
- `username` *(string, required)* — 1–24 characters after trimming

A `joined` acknowledgement is sent **only to the joiner**:

```json
{
  "type": "joined",
  "roomCode": "A7X3K9",
  "username": "Alex",
  "users": ["Alex", "Sam"],
  "activeUsers": 2,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

…while everyone already in the room receives:

```json
{ "type": "system", "message": "Alex has joined the room", "roomCode": "A7X3K9", "timestamp": "..." }
```

#### Send a message

```json
{ "type": "message", "message": "Hello everyone!" }
```

Broadcast to **every member of the room, including the sender** (the echo doubles as a delivery receipt):

```json
{
  "type": "message",
  "id": "9d0ca2b6-2c2f-4a9e-9b1f-1f6d0a2b4c8d",
  "username": "Alex",
  "message": "Hello everyone!",
  "roomCode": "A7X3K9",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Messages are trimmed, must be non-empty, and are capped at **500 characters**.

#### Leave the room

```json
{ "type": "leave" }
```

You'll get `{"type":"left", ...}` and the room hears:

```json
{ "type": "system", "message": "Alex has left the room", "roomCode": "A7X3K9", "timestamp": "..." }
```

Closing the socket has exactly the same effect — **disconnects always broadcast a leave event and free the username**.

### Error frames

Errors are sent only to the client that caused them (never broadcast):

```json
{ "type": "error", "code": "ROOM_NOT_FOUND", "message": "Room \"ZZZZ99\" does not exist. Create it first with POST /api/rooms.", "timestamp": "..." }
```

| Code | When |
|---|---|
| `INVALID_JSON` | Frame was not valid JSON |
| `INVALID_MESSAGE` | Payload is not an object with a string `type` |
| `UNKNOWN_TYPE` | `type` is not `join` / `message` / `leave` / `ping` |
| `MISSING_ROOM_CODE` | `join` without `roomCode` |
| `MISSING_USERNAME` | `join` without `username` |
| `USERNAME_TOO_LONG` | Username > 24 chars |
| `ROOM_NOT_FOUND` | Room doesn't exist (or expired) |
| `NOT_JOINED` | `message` sent before joining |
| `EMPTY_MESSAGE` | Blank message |
| `MESSAGE_TOO_LONG` | Message > 500 chars |

---

## 👤 Username Rules

- **A username is required to chat** — joins without one are refused with `MISSING_USERNAME`.
- **Usernames are scoped per room.** The same name in two different rooms is unrelated.
- **Duplicate usernames are never rejected.** By design, joining with a name that's already active in the room **always succeeds** — clients are tracked by a unique internal connection id, not by name, so rejoining with the same username always works and never locks you out.
- **Usernames are freed on disconnect.** The instant a socket closes (quit, network drop, or heartbeat timeout ~30s), the name is available again.
- When the **last user leaves a room**, the room (and its code) is recycled automatically.

---

## 🧭 Example Usage Flow

```bash
# ── 1. Create a room ───────────────────────────────────────────
curl -X POST https://<app-name>.onrender.com/api/rooms
# → {"roomCode":"A7X3K9", ...}

# ── 2. Share the code with your friends: A7X3K9 ────────────────

# ── 3. Connect over WebSocket (wscat, Postman, JS client, …) ───
wscat -c wss://<app-name>.onrender.com

# ── 4. Join with a username ────────────────────────────────────
> {"type":"join","roomCode":"A7X3K9","username":"Alex"}
< {"type":"joined","roomCode":"A7X3K9","username":"Alex","activeUsers":1,...}
< {"type":"system","message":"Sam has joined the room", ...}

# ── 5. Chat! ───────────────────────────────────────────────────
> {"type":"message","message":"Hello room!"}
< {"type":"message","username":"Alex","message":"Hello room!","roomCode":"A7X3K9","timestamp":"..."}

# ── (done?) just close the socket — everyone is told you left ──
< {"type":"system","message":"Alex has left the room", ...}
```

---

## 📜 License

MIT — do whatever you want, attribution appreciated.
