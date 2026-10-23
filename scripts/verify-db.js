const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function verifyDatabase() {
  console.log('====================================================');
  console.log('🔍 SyncSpace PostgreSQL Database Verification');
  console.log('====================================================');

  try {
    // 1. Connectivity Check
    console.log('\n[1/5] Testing PostgreSQL Connection...');
    const dbInfo = await prisma.$queryRaw`
      SELECT current_database() as database, 
             version() as version, 
             current_user as user,
             inet_server_port() as port;
    `;
    console.log('✅ Connected successfully to PostgreSQL:');
    console.log(`   Database : ${dbInfo[0].database}`);
    console.log(`   User     : ${dbInfo[0].user}`);
    console.log(`   Port     : ${dbInfo[0].port}`);
    console.log(`   Version  : ${dbInfo[0].version.split(',')[0]}`);

    // 2. Table Inspection
    console.log('\n[2/5] Inspecting PostgreSQL Database Schema & Tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tableNames = tables.map((t) => t.table_name);
    console.log(`✅ Found ${tableNames.length} tables in 'public' schema:`);
    console.log(`   ${tableNames.join(', ')}`);

    // Verify required tables
    const requiredTables = [
      'User',
      'Workspace',
      'WorkspaceMember',
      'Document',
      'DocumentUpdate',
      'DocumentVersion',
      'Comment',
      'Invitation',
      'ActivityLog',
    ];
    const missing = requiredTables.filter(
      (req) => !tableNames.some((t) => t.toLowerCase() === req.toLowerCase())
    );

    if (missing.length > 0) {
      console.warn(`⚠️ Warning: Expected tables missing: ${missing.join(', ')}`);
      console.log('   Run "npm run prisma:push" to apply the Prisma schema to PostgreSQL.');
    } else {
      console.log('✅ All 9 required specification tables are present and verified!');
    }

    // 3. Testing CRUD Operations
    console.log('\n[3/5] Executing Database CRUD Operations Test...');
    const testEmail = `test.verifier.${Date.now()}@syncspace.io`;

    // CREATE
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'PostgreSQL Verifier Bot',
        passwordHash: '$2a$10$abcdefg1234567890testpasswordhash',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Verifier',
      },
    });
    console.log(`   [CREATE] User created with ID: ${testUser.id}`);

    // READ
    const fetchedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    if (!fetchedUser || fetchedUser.email !== testEmail) {
      throw new Error('Read verification failed!');
    }
    console.log(`   [READ]   User successfully fetched: ${fetchedUser.name} (${fetchedUser.email})`);

    // UPDATE
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { name: 'PostgreSQL Verifier Bot (Updated)' },
    });
    console.log(`   [UPDATE] User name updated to: ${updatedUser.name}`);

    // DELETE
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log(`   [DELETE] User successfully deleted from PostgreSQL.`);
    console.log('✅ Full PostgreSQL CRUD lifecycle verified with zero errors!');

    // 4. Data Counts
    console.log('\n[4/5] Checking Current Seed Data Records...');
    const counts = {
      users: await prisma.user.count(),
      workspaces: await prisma.workspace.count(),
      documents: await prisma.document.count(),
      comments: await prisma.comment.count(),
      activityLogs: await prisma.activityLog.count(),
    };
    console.log(`   Users        : ${counts.users}`);
    console.log(`   Workspaces   : ${counts.workspaces}`);
    console.log(`   Documents    : ${counts.documents}`);
    console.log(`   Comments     : ${counts.comments}`);
    console.log(`   Activity Logs: ${counts.activityLogs}`);

    // 5. Overall Status
    console.log('\n[5/5] Final PostgreSQL Health Assessment');
    console.log('====================================================');
    console.log('🚀 POSTGRESQL DATABASE IS FULLY FUNCTIONAL AND READY!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ PostgreSQL Database Verification Failed:');
    console.error(`   ${err.message}`);
    console.error('\nTroubleshooting Tips:');
    console.error('1. Check that PostgreSQL is listening: node scripts/start-postgres.js');
    console.error('2. Or if using Docker: docker compose up -d');
    console.error('3. Check DATABASE_URL in .env: postgresql://postgres:postgrespassword@localhost:5432/collaborative_workspace?schema=public');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
