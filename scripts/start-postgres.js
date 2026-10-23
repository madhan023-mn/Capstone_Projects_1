const net = require('net');
const path = require('path');
const EmbeddedPostgres = require('embedded-postgres').default;

const PORT = parseInt(process.env.PGPORT || '5432', 10);
const DB_NAME = process.env.PGDATABASE || 'collaborative_workspace';
const USER = process.env.PGUSER || 'postgres';
const PASSWORD = process.env.PGPASSWORD || 'postgrespassword';
const DATA_DIR = path.join(process.cwd(), '.pgdata');

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function start() {
  console.log(`[PostgreSQL Service] Checking port ${PORT}...`);
  const inUse = await checkPortInUse(PORT);
  if (inUse) {
    console.log(`[PostgreSQL Service] PostgreSQL is already running on port ${PORT}.`);
    console.log(`[PostgreSQL Service] Reusing active PostgreSQL instance.`);
    // Keep alive if run directly
    setInterval(() => {}, 1000 * 60 * 60);
    return;
  }

  console.log(`[PostgreSQL Service] Initializing local PostgreSQL server on port ${PORT}...`);
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: USER,
    password: PASSWORD,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

  try {
    await pg.initialise();
  } catch (err) {
    // Already initialised is okay
  }

  console.log(`[PostgreSQL Service] Starting PostgreSQL daemon...`);
  await pg.start();
  console.log(`[PostgreSQL Service] PostgreSQL daemon is active on port ${PORT}.`);

  try {
    await pg.createDatabase(DB_NAME);
    console.log(`[PostgreSQL Service] Database '${DB_NAME}' ensured.`);
  } catch (err) {
    // Database may already exist
  }

  const shutdown = async () => {
    console.log(`\n[PostgreSQL Service] Gracefully stopping PostgreSQL server...`);
    try {
      await pg.stop();
      console.log(`[PostgreSQL Service] PostgreSQL stopped.`);
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('[PostgreSQL Service] Fatal error:', err);
  process.exit(1);
});
