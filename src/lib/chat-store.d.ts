export interface RoomClient {
  id: string;
  username: string;
  joinedAt: string;
  /** Attached only by the standalone WS server (never serialized). */
  ws?: unknown;
}

export interface Room {
  code: string;
  createdAt: string;
  clients: Map<string, RoomClient>;
}

export interface RoomSummary {
  roomCode: string;
  activeUsers: number;
  users: string[];
  createdAt: string;
}

export const CODE_LENGTH: number;
export function getRooms(): Map<string, Room>;
export function normalizeCode(code: unknown): string;
export function isValidCode(code: unknown): code is string;
export function generateRoomCode(): string;
export function createRoom(): Room;
export function getRoom(code: unknown): Room | null;
export function roomSummary(room: Room): RoomSummary;
export function listRooms(): RoomSummary[];
export function removeRoomIfEmpty(code: unknown): boolean;
export function deleteRoom(code: unknown): boolean;
export function sweepStaleRooms(maxEmptyAgeMs: number): string[];
