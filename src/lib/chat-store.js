'use strict';

/**
 * chat-store.js
 * --------------------------------------------------------------------------
 * Shared in-memory room store for the Relay real-time chat server.
 *
 * - Zero database: all state lives in a process-global Map, so restarting
 *   the server resets rooms and usernames (perfect for Render's free tier).
 * - The same module powers the standalone `server.js` (REST + WebSocket)
 *   and the Next.js preview API routes under `src/app/api/rooms`.
 * - Room clients are tracked by a unique clientId, NOT by username — so the
 *   same username may join a room more than once without being rejected.
 */

// Uppercase alphabet without ambiguous characters (0/O, 1/I/L).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** @returns {Map<string, object>} the process-wide rooms map */
function getRooms() {
  const g = globalThis;
  if (!g.__relayRooms) {
    g.__relayRooms = new Map();
  }
  return g.__relayRooms;
}

/** Normalize a user-supplied room code (trim + uppercase). */
function normalizeCode(code) {
  return String(code == null ? '' : code).trim().toUpperCase();
}

/** Is this a syntactically valid room code? */
function isValidCode(code) {
  return typeof code === 'string' && code.length === CODE_LENGTH;
}

/** Generate a unique random room code, e.g. "A7X3K9". */
function generateRoomCode() {
  const rooms = getRooms();
  let code = '';
  do {
    code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
  } while (rooms.has(code));
  return code;
}

/**
 * Create a new room and return it.
 * Room shape:
 *   { code, createdAt, clients: Map<clientId, { id, username, joinedAt }> }
 * The live WebSocket handle is attached by server.js only and is never
 * serialized by the helpers below.
 */
function createRoom() {
  const rooms = getRooms();
  const code = generateRoomCode();
  const room = {
    code,
    createdAt: new Date().toISOString(),
    clients: new Map(),
  };
  rooms.set(code, room);
  return room;
}

/** Fetch a room by code (case-insensitive). Returns null when missing. */
function getRoom(code) {
  const normalized = normalizeCode(code);
  if (!isValidCode(normalized)) return null;
  return getRooms().get(normalized) || null;
}

/** Public, JSON-safe summary of a single room. */
function roomSummary(room) {
  const users = [];
  for (const client of room.clients.values()) {
    users.push(client.username);
  }
  return {
    roomCode: room.code,
    activeUsers: users.length,
    users,
    createdAt: room.createdAt,
  };
}

/** List every active room as a JSON-safe summary. */
function listRooms() {
  const rooms = getRooms();
  return Array.from(rooms.values()).map(roomSummary);
}

/** Delete a room when it has no connected clients left. */
function removeRoomIfEmpty(code) {
  const room = getRoom(code);
  if (room && room.clients.size === 0) {
    getRooms().delete(room.code);
    return true;
  }
  return false;
}

/** Force-delete a room regardless of occupancy. */
function deleteRoom(code) {
  const normalized = normalizeCode(code);
  return getRooms().delete(normalized);
}

/**
 * Housekeeping sweep: drop rooms that have been empty for a while so
 * abandoned "reserved" codes do not pile up in memory.
 * @param {number} maxEmptyAgeMs - empty rooms older than this are removed
 */
function sweepStaleRooms(maxEmptyAgeMs) {
  const now = Date.now();
  const rooms = getRooms();
  const removed = [];
  for (const room of rooms.values()) {
    if (room.clients.size > 0) continue;
    const age = now - Date.parse(room.createdAt);
    if (age >= maxEmptyAgeMs) {
      rooms.delete(room.code);
      removed.push(room.code);
    }
  }
  return removed;
}

module.exports = {
  CODE_LENGTH,
  getRooms,
  normalizeCode,
  isValidCode,
  generateRoomCode,
  createRoom,
  getRoom,
  roomSummary,
  listRooms,
  removeRoomIfEmpty,
  deleteRoom,
  sweepStaleRooms,
};
