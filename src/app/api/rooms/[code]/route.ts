import { getRoom, roomSummary } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

/** GET /api/rooms/:code — details for a single room (active users, createdAt). */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const room = getRoom(code);
  if (!room) {
    return Response.json(
      {
        error: "ROOM_NOT_FOUND",
        message: `Room "${code.toUpperCase()}" does not exist or has expired.`,
      },
      { status: 404, headers: CORS },
    );
  }
  return Response.json(roomSummary(room), { headers: CORS });
}
