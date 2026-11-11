/**
 * Realtime server (Socket.IO). Runs next to the Next.js app: `npm run dev` starts both.
 *
 * - Authenticates every connection with the same signed `kanaku_session` cookie the website uses,
 *   then puts the socket in a private room for that user.
 * - Watches the `notifications` collection (MongoDB change stream) and pushes changes to the
 *   owner's room, so it works no matter which process or server created the notification.
 *
 * Env: REALTIME_PORT (default 4000), APP_ORIGIN (comma-separated allowed browser origins),
 * MONGODB_URI / MONGODB_DB, SESSION_SECRET.
 */
import { createServer } from "node:http";
import { Server } from "socket.io";
import { SESSION_COOKIE_NAME } from "@/constants/auth";
import { REALTIME_DEFAULT_PORT, SOCKET_EVENTS } from "@/constants/notifications";
import { getDb } from "@/lib/mongo";
import { decode } from "@/lib/token";
import { validateSession } from "@/services/sessions-service";

const port = Number(process.env.REALTIME_PORT || REALTIME_DEFAULT_PORT);
const origins = (process.env.APP_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const room = (userId: string) => `user:${userId}`;

function cookieValue(header: string | undefined, name: string): string | undefined {
  const part = header?.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return part ? decodeURIComponent(part.trim().slice(name.length + 1)) : undefined;
}

const http = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" }).end('{"ok":true}');
    return;
  }
  res.writeHead(404).end();
});

const io = new Server(http, {
  cors: { origin: origins, credentials: true },
  // Browsers can't send custom headers on a WebSocket, but they do send cookies.
});

io.use(async (socket, next) => {
  try {
    const user = decode<{ id?: string; sid?: string }>(
      cookieValue(socket.handshake.headers.cookie, SESSION_COOKIE_NAME),
    );
    if (!user?.id || !user.sid || !(await validateSession(user.sid, user.id)))
      return next(new Error("unauthenticated"));
    socket.data.userId = user.id;
    next();
  } catch {
    next(new Error("unauthenticated"));
  }
});

io.on("connection", (socket) => {
  void socket.join(room(socket.data.userId));
});

type NotificationChange = {
  operationType: string;
  fullDocument?: {
    _id: string;
    userId: string;
    kind: string;
    title: string;
    body: string;
    href: string | null;
    createdAt: Date;
    read: boolean;
  };
};

async function watchNotifications() {
  const db = await getDb();
  const stream = db.collection("notifications").watch([], { fullDocument: "updateLookup" });
  stream.on("change", (event) => {
    const change = event as unknown as NotificationChange;
    const doc = change.fullDocument;
    if (!doc) return;
    if (change.operationType === "insert") {
      io.to(room(doc.userId)).emit(SOCKET_EVENTS.created, {
        id: doc._id,
        kind: doc.kind,
        title: doc.title,
        body: doc.body,
        href: doc.href,
        createdAt: new Date(doc.createdAt).toISOString(),
        read: doc.read,
      });
    } else if (change.operationType === "update" || change.operationType === "replace") {
      io.to(room(doc.userId)).emit(SOCKET_EVENTS.changed, { id: doc._id, read: doc.read });
    }
  });
  // Reconnect if the stream drops (network blip, Atlas failover).
  stream.on("error", (error) => {
    console.error("[realtime] change stream error, retrying in 3s:", error.message);
    void stream.close().catch(() => undefined);
    setTimeout(() => void watchNotifications().catch(console.error), 3000);
  });
  console.log("[realtime] watching notifications");
}

http.listen(port, () => {
  console.log(`[realtime] Socket.IO listening on :${port} (origins: ${origins.join(", ")})`);
  void watchNotifications().catch((error) => {
    console.error("[realtime] couldn't start the change stream:", error);
    process.exitCode = 1;
  });
});
