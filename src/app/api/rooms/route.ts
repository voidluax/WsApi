import { createRoom, listRooms } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** GET /api/rooms — list all active rooms. */
export function GET() {
  const rooms = listRooms();
  return Response.json({ totalRooms: rooms.length, rooms }, { headers: CORS });
}

/** POST /api/rooms — create a room and receive its unique code. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.trim() !== "") {
    try {
      JSON.parse(raw);
    } catch {
      return Response.json(
        { error: "INVALID_JSON", message: "Request body must be valid JSON (or empty)." },
        { status: 400, headers: CORS },
      );
    }
  }
  const room = createRoom();
  return Response.json(
    {
      roomCode: room.code,
      createdAt: room.createdAt,
      join: `Connect via WebSocket and send {"type":"join","roomCode":"${room.code}","username":"<name>"}`,
    },
    { status: 201, headers: CORS },
  );
}
