import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/lib/prisma';

describe('PostgreSQL Database Schema & CRUD Operations', () => {
  const testEmail = `vitest.user.${Date.now()}@syncspace.io`;
  let createdUserId: string;
  let createdWorkspaceId: string;
  let createdDocId: string;

  it('connects to PostgreSQL database and retrieves system metadata', async () => {
    const result = await prisma.$queryRaw<Array<{ database: string; user: string }>>`
      SELECT current_database() as database, current_user as user;
    `;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(['collaborative_workspace', 'neondb']).toContain(result[0].database);
  });

  it('performs CRUD operations on User model in PostgreSQL', async () => {
    // CREATE
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Vitest Test User',
        passwordHash: '$2a$10$abcdefg1234567890testpasswordhash',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vitest',
      },
    });
    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    createdUserId = user.id;

    // READ
    const fetched = await prisma.user.findUnique({
      where: { id: createdUserId },
    });
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Vitest Test User');

    // UPDATE
    const updated = await prisma.user.update({
      where: { id: createdUserId },
      data: { name: 'Vitest Test User (Updated)' },
    });
    expect(updated.name).toBe('Vitest Test User (Updated)');
  });

  it('creates a Workspace with WorkspaceMember association in PostgreSQL', async () => {
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Vitest Workspace',
        slug: `vitest-workspace-${Date.now()}`,
        ownerId: createdUserId,
        members: {
          create: {
            userId: createdUserId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    expect(workspace.id).toBeDefined();
    expect(workspace.members.length).toBe(1);
    expect(workspace.members[0].role).toBe('OWNER');
    createdWorkspaceId = workspace.id;
  });

  it('creates Document, DocumentUpdate, and DocumentVersion in PostgreSQL', async () => {
    // Create Document
    const doc = await prisma.document.create({
      data: {
        title: 'Vitest Spec Document',
        icon: '📄',
        workspaceId: createdWorkspaceId,
        createdById: createdUserId,
      },
    });
    expect(doc.id).toBeDefined();
    createdDocId = doc.id;

    // Create DocumentUpdate (Yjs binary chunk)
    const update = await prisma.documentUpdate.create({
      data: {
        documentId: doc.id,
        update: Buffer.from([1, 2, 3, 4, 5]),
      },
    });
    expect(update.id).toBeDefined();
    expect(update.documentId).toBe(doc.id);

    // Create DocumentVersion (Snapshot)
    const version = await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        versionNumber: 1,
        label: 'Initial Snapshot',
        snapshot: Buffer.from([1, 2, 3, 4, 5, 6]),
        createdById: createdUserId,
      },
    });
    expect(version.versionNumber).toBe(1);
    expect(version.label).toBe('Initial Snapshot');
  });

  it('creates Comments and threaded CommentReplies in PostgreSQL', async () => {
    const comment = await prisma.comment.create({
      data: {
        documentId: createdDocId,
        authorId: createdUserId,
        content: 'Testing inline comment thread',
        targetText: 'Vitest Spec',
      },
    });
    expect(comment.id).toBeDefined();

    const reply = await prisma.commentReply.create({
      data: {
        commentId: comment.id,
        authorId: createdUserId,
        content: 'Testing reply to inline comment',
      },
    });
    expect(reply.id).toBeDefined();
    expect(reply.commentId).toBe(comment.id);
  });

  it('cleans up test entities via cascade deletion', async () => {
    // Deleting User should cascade delete owned Workspace, Document, Comments, and Updates
    await prisma.user.delete({
      where: { id: createdUserId },
    });

    const docCheck = await prisma.document.findUnique({
      where: { id: createdDocId },
    });
    expect(docCheck).toBeNull();
  });
});
