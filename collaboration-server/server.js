const http = require('http');
const url = require('url');
const ws = require('ws');
const Y = require('yjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const {
  setPersistence,
  setupWSConnection,
  docs,
} = require('y-websocket/bin/utils');

const {
  loadDocumentState,
  scheduleDocumentSave,
  flushDocumentSave,
} = require('./persistence');
const redisScaling = require('./redis-scaling');

const PORT = parseInt(process.env.COLLAB_PORT || '1234', 10);
const HOST = process.env.COLLAB_HOST || '0.0.0.0';
const JWT_SECRET =
  process.env.JWT_SECRET || 'super-secret-collaborative-workspace-key-dev-1234567890';

// 1. Configure Database Persistence Binding for Yjs
setPersistence({
  bindState: async (docName, ydoc) => {
    try {
      console.log(`[Collab Server] Binding state for room: ${docName}`);
      const savedBytes = await loadDocumentState(docName);
      if (savedBytes && savedBytes.length > 0) {
        Y.applyUpdate(ydoc, savedBytes, 'initial-load');
        console.log(
          `[Collab Server] Loaded and applied ${savedBytes.length} bytes for ${docName}`
        );
      }

      // Listen for updates in this room
      ydoc.on('update', (update, origin) => {
        // Debounced save to PostgreSQL
        scheduleDocumentSave(docName, ydoc);

        // If local update, broadcast to other server instances via Redis
        if (origin !== 'redis') {
          redisScaling.publishUpdate(docName, update);
        }
      });

      // Register room with Redis Scaling Manager
      redisScaling.registerRoom(docName, (remoteUpdate) => {
        Y.applyUpdate(ydoc, remoteUpdate, 'redis');
      });
    } catch (err) {
      console.error(`[Collab Server] bindState error for ${docName}:`, err.message);
    }
  },
  writeState: async (docName, ydoc) => {
    console.log(`[Collab Server] writeState flush for room: ${docName}`);
    await flushDocumentSave(docName, ydoc);
  },
});

// 2. HTTP Server for Health Checks & WebSocket Upgrade
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const redisStatus = redisScaling.getStatus();
    return res.end(
      JSON.stringify({
        status: 'ok',
        uptime: process.uptime(),
        activeRooms: docs.size,
        redis: redisStatus,
      })
    );
  }
  res.writeHead(404);
  res.end('Not Found');
});

const wss = new ws.WebSocketServer({ noServer: true });

// 3. Authenticated WebSocket Connection Handshake
server.on('upgrade', (req, socket, head) => {
  try {
    const parsed = url.parse(req.url, true);
    // Path format: /<documentId>
    const pathname = parsed.pathname || '';
    const docId = pathname.replace(/^\/+/, '');
    const token = parsed.query.token;

    if (!docId) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Authenticate JWT Token
    let userPayload = null;
    if (token) {
      try {
        userPayload = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        console.warn(`[Collab WS] Token verification failed for doc ${docId}:`, err.message);
      }
    }

    // In production, reject unauthenticated connections
    if (!userPayload && process.env.NODE_ENV === 'production') {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Verify document match if token was provided
    if (userPayload && userPayload.documentId && userPayload.documentId !== docId) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (wsClient) => {
      wsClient.user = userPayload || {
        userId: 'anon-' + Math.random().toString(36).substring(7),
        name: 'Anonymous Collaborator',
        role: 'EDITOR',
      };

      console.log(
        `[Collab WS] Connected: ${wsClient.user.name} (${wsClient.user.role}) -> Room: ${docId}`
      );

      // Connect into y-websocket room
      setupWSConnection(wsClient, req, { docName: docId, gc: true });
    });
  } catch (err) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Real-Time Collaboration WebSocket Server running on ws://${HOST}:${PORT}`);
  console.log(`📡 Redis horizontal scaling active: ${redisScaling.isRedisActive}`);
});
