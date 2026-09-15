/* End-to-end smoke test for server.js (REST + WebSocket) */
const WebSocket = require('ws');

const BASE = 'http://127.0.0.1:3111';
const WS = 'ws://127.0.0.1:3111';
let failures = 0;

function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

async function api(path, opts) {
  const res = await fetch(BASE + path, opts);
  return { status: res.status, body: await res.json() };
}

function waitFor(ws, predicate, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for frame')), timeoutMs);
    ws.on('message', function onMsg(raw) {
      const data = JSON.parse(raw.toString());
      if (predicate(data)) {
        clearTimeout(timer);
        ws.off('message', onMsg);
        resolve(data);
      }
    });
  });
}

(async () => {
  // --- REST ---
  let r = await api('/api/rooms', { method: 'POST' });
  check('POST /api/rooms → 201', r.status === 201);
  const code = r.body.roomCode;
  check('roomCode is 6 chars', /^[A-Z0-9]{6}$/.test(code));
  console.log('   roomCode:', code);

  r = await api('/api/rooms');
  check('GET /api/rooms → 200', r.status === 200);
  check('list contains new room', r.body.rooms.some((x) => x.roomCode === code));
  check('new room has 0 users', r.body.rooms.find((x) => x.roomCode === code).activeUsers === 0);

  r = await api(`/api/rooms/${code.toLowerCase()}`);
  check('GET /api/rooms/:code (lowercase) → 200', r.status === 200);

  r = await api('/api/rooms/ZZZZ99');
  check('GET unknown room → 404', r.status === 404);

  r = await api('/api/rooms', { method: 'PUT' });
  check('PUT /api/rooms → 405', r.status === 405);

  r = await api('/nope');
  check('GET /nope → 404', r.status === 404);

  r = await api('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
  check('POST invalid JSON → 400', r.status === 400);

  r = await api('/api/health');
  check('GET /api/health → 200', r.status === 200);

  // --- WebSocket: join unknown room → error ---
  const wsA = new WebSocket(WS);
  await new Promise((res) => wsA.on('open', res));
  const errP = waitFor(wsA, (d) => d.type === 'error');
  wsA.send(JSON.stringify({ type: 'join', roomCode: 'ZZZZ99', username: 'Ghost' }));
  const err = await errP;
  check('join unknown room → ROOM_NOT_FOUND error', err.code === 'ROOM_NOT_FOUND');

  // --- Join room with Alex + Sam ---
  wsA.send(JSON.stringify({ type: 'join', roomCode: code, username: 'Alex' }));
  const joinedA = await waitFor(wsA, (d) => d.type === 'joined');
  check('Alex joined (ack)', joinedA.roomCode === code && joinedA.users.includes('Alex'));

  const wsB = new WebSocket(WS);
  await new Promise((res) => wsB.on('open', res));
  const alexSeesJoinP = waitFor(wsA, (d) => d.type === 'system' && /Sam has joined/.test(d.message));
  wsB.send(JSON.stringify({ type: 'join', roomCode: code, username: 'Sam' }));
  const joinedB = await waitFor(wsB, (d) => d.type === 'joined');
  check('Sam joined (ack)', joinedB.activeUsers === 2);
  const alexSeesJoin = await alexSeesJoinP;
  check('Alex sees "Sam has joined the room" system msg', alexSeesJoin.roomCode === code);

  // --- Message broadcast to both (incl. sender echo) ---
  const samMsgP = waitFor(wsB, (d) => d.type === 'message');
  const alexEchoP = waitFor(wsA, (d) => d.type === 'message');
  wsA.send(JSON.stringify({ type: 'message', message: 'Hello Sam!' }));
  const [samMsg, alexEcho] = await Promise.all([samMsgP, alexEchoP]);
  check('Sam received message with username/roomCode/timestamp',
    samMsg.username === 'Alex' && samMsg.message === 'Hello Sam!' && samMsg.roomCode === code && Boolean(samMsg.timestamp));
  check('Sender Alex received echo', alexEcho.username === 'Alex');

  // --- Duplicate username allowed (per spec: never rejected) ---
  const wsC = new WebSocket(WS);
  await new Promise((res) => wsC.on('open', res));
  wsC.send(JSON.stringify({ type: 'join', roomCode: code, username: 'Alex' }));
  const joinedC = await waitFor(wsC, (d) => d.type === 'joined');
  check('Duplicate username "Alex" NOT rejected', joinedC.username === 'Alex' && joinedC.activeUsers === 3);

  // --- Message before join → NOT_JOINED error ---
  const wsD = new WebSocket(WS);
  await new Promise((res) => wsD.on('open', res));
  const notJoinedP = waitFor(wsD, (d) => d.type === 'error');
  wsD.send(JSON.stringify({ type: 'message', message: 'hi?' }));
  check('message before join → NOT_JOINED error', (await notJoinedP).code === 'NOT_JOINED');

  // --- Invalid JSON → error frame (no crash) ---
  const badJsonP = waitFor(wsD, (d) => d.type === 'error');
  wsD.send('this is not json');
  check('invalid JSON → INVALID_JSON error', (await badJsonP).code === 'INVALID_JSON');
  wsD.close();

  // --- Leave + room info ---
  const samSeesLeaveP = waitFor(wsB, (d) => d.type === 'system' && /Alex has left/.test(d.message));
  wsC.send(JSON.stringify({ type: 'leave' }));
  await waitFor(wsC, (d) => d.type === 'left');
  await samSeesLeaveP;
  check('leave broadcasts "Alex has left the room"', true);

  r = await api(`/api/rooms/${code}`);
  check('room info shows 2 active users', r.body.activeUsers === 2);

  // --- Everyone disconnects → room is deleted, names freed ---
  wsA.close();
  wsB.close();
  wsC.close();
  await new Promise((res) => setTimeout(res, 400));
  r = await api(`/api/rooms/${code}`);
  check('empty room auto-deleted (GET → 404)', r.status === 404);
  r = await api('/api/rooms');
  check('room list is empty again', r.body.totalRooms === 0);

  console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('TEST CRASH:', e);
  process.exit(1);
});
