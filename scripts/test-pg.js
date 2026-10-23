const EmbeddedPostgres = require('embedded-postgres').default;
const path = require('path');

async function test() {
  console.log('Testing EmbeddedPostgres...');
  const dataDir = path.join(process.cwd(), '.pgdata');
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    persistent: true,
  });

  try {
    console.log('Initialising Postgres cluster...');
    await pg.initialise();
    console.log('Cluster initialised. Starting server...');
    await pg.start();
    console.log('Postgres started successfully on port 5432!');
    console.log('Creating database collaborative_workspace...');
    await pg.createDatabase('collaborative_workspace');
    console.log('Database collaborative_workspace created!');

    const client = pg.getPgClient('collaborative_workspace');
    await client.connect();
    const res = await client.query('SELECT version(), current_database();');
    console.log('Connected! Query result:', res.rows[0]);
    await client.end();

    console.log('Stopping test server...');
    await pg.stop();
    console.log('Server stopped cleanly.');
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
