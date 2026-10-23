import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserWorkspaceRole, canManageMembers, canDeleteWorkspace } from '@/lib/permissions';

const updateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role) {
    return NextResponse.json({ error: 'Forbidden: You are not a member of this workspace' }, { status: 403 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      documents: {
        where: { isArchived: false },
        orderBy: { updatedAt: 'desc' },
      },
      activities: {
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  return NextResponse.json({
    workspace,
    userRole: role,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role || !canManageMembers(role)) {
    return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateWorkspaceSchema.parse(body);

    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: {
        ...(validated.name ? { name: validated.name } : {}),
        ...(validated.description !== undefined ? { description: validated.description } : {}),
      },
    });

    return NextResponse.json({ workspace: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role || !canDeleteWorkspace(role)) {
    return NextResponse.json({ error: 'Forbidden: Only the workspace Owner can delete it' }, { status: 403 });
  }

  await prisma.workspace.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: 'Workspace deleted successfully' });
}
