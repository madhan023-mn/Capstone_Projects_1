import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  description: z.string().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          _count: {
            select: {
              members: true,
              documents: { where: { isArchived: false } },
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    description: m.workspace.description,
    role: m.role,
    memberCount: m.workspace._count.members,
    documentCount: m.workspace._count.documents,
    createdAt: m.workspace.createdAt,
  }));

  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = createWorkspaceSchema.parse(body);

    const baseSlug = validated.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description || null,
        ownerId: user.id,
        members: {
          create: [{ userId: user.id, role: 'OWNER' }],
        },
        documents: {
          create: [
            {
              title: 'Welcome to your new workspace',
              icon: 'rocket',
              createdById: user.id,
            },
          ],
        },
      },
      include: {
        documents: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'WORKSPACE',
        entityId: workspace.id,
        metadata: JSON.stringify({ name: workspace.name }),
      },
    });

    return NextResponse.json(
      {
        workspace,
        defaultDocumentId: workspace.documents[0]?.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
