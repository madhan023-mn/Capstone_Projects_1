const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data in reverse order of foreign keys
  await prisma.activityLog.deleteMany({});
  await prisma.commentReply.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.documentVersion.deleteMany({});
  await prisma.documentUpdate.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.workspaceMember.deleteMany({});
  await prisma.workspace.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@collab.io',
      name: 'Alice Johnson (Product Lead)',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@collab.io',
      name: 'Bob Smith (Senior Engineer)',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
  });

  const carol = await prisma.user.create({
    data: {
      email: 'carol@collab.io',
      name: 'Carol Williams (Product Reviewer)',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carol',
    },
  });

  const david = await prisma.user.create({
    data: {
      email: 'david@collab.io',
      name: 'David Miller (Stakeholder)',
      passwordHash,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    },
  });

  console.log('✅ Created 4 sample users with password "Password123!"');

  // 2. Create Workspaces
  const acmeWorkspace = await prisma.workspace.create({
    data: {
      name: 'Acme Product & Engineering',
      slug: 'acme-product-engineering',
      description: 'Collaborative hub for cross-functional product specs, roadmaps, and designs.',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'EDITOR' },
          { userId: carol.id, role: 'COMMENTER' },
          { userId: david.id, role: 'VIEWER' },
        ],
      },
    },
  });

  const personalWorkspace = await prisma.workspace.create({
    data: {
      name: "Alice's Private Notes",
      slug: 'alices-private-notes',
      description: 'Personal drafts and scratchpads.',
      ownerId: alice.id,
      members: {
        create: [{ userId: alice.id, role: 'OWNER' }],
      },
    },
  });

  console.log('✅ Created 2 workspaces and assigned member roles');

  // 3. Create Documents
  const doc1 = await prisma.document.create({
    data: {
      title: 'Q4 Product Roadmap & Vision',
      icon: '🚀',
      workspaceId: acmeWorkspace.id,
      createdById: alice.id,
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      title: 'Real-Time Sync Architecture Specs',
      icon: '⚡',
      workspaceId: acmeWorkspace.id,
      createdById: bob.id,
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      title: 'Figma Design System Guidelines',
      icon: '🎨',
      workspaceId: acmeWorkspace.id,
      createdById: alice.id,
    },
  });

  console.log('✅ Created 3 starter documents');

  // 4. Create Sample Comments
  const comment1 = await prisma.comment.create({
    data: {
      documentId: doc1.id,
      authorId: carol.id,
      content: 'Should we prioritize the Redis horizontal scaling layer ahead of the mobile responsive audit?',
      targetText: 'Q4 Product Roadmap',
      isResolved: false,
    },
  });

  await prisma.commentReply.create({
    data: {
      commentId: comment1.id,
      authorId: alice.id,
      content: 'Great point Carol! Yes, we have scheduled the Redis pub/sub layer for Sprint 1.',
    },
  });

  // 5. Activity Log
  await prisma.activityLog.createMany({
    data: [
      {
        workspaceId: acmeWorkspace.id,
        userId: alice.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'WORKSPACE',
        entityId: acmeWorkspace.id,
        metadata: JSON.stringify({ name: acmeWorkspace.name }),
      },
      {
        workspaceId: acmeWorkspace.id,
        userId: alice.id,
        action: 'DOCUMENT_CREATED',
        entityType: 'DOCUMENT',
        entityId: doc1.id,
        metadata: JSON.stringify({ title: doc1.title }),
      },
      {
        workspaceId: acmeWorkspace.id,
        userId: bob.id,
        action: 'DOCUMENT_CREATED',
        entityType: 'DOCUMENT',
        entityId: doc2.id,
        metadata: JSON.stringify({ title: doc2.title }),
      },
    ],
  });

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
