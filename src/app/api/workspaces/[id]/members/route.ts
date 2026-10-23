import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserWorkspaceRole, canManageMembers, WorkspaceRole } from '@/lib/permissions';

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']),
});

const updateMemberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'EDITOR', 'COMMENTER', 'VIEWER']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: params.id },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });

  return NextResponse.json({ members, currentUserRole: role });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentRole = await getUserWorkspaceRole(user.id, params.id);
  if (!currentRole || !canManageMembers(currentRole)) {
    return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = addMemberSchema.parse(body);

    // Look up target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${validated.email} was not found. Please ensure they have registered first.` },
        { status: 404 }
      );
    }

    // Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'This user is already a member of this workspace' },
        { status: 400 }
      );
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId: params.id,
        userId: targetUser.id,
        role: validated.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: params.id,
        userId: user.id,
        action: 'MEMBER_ADDED',
        entityType: 'WORKSPACE_MEMBER',
        entityId: targetUser.id,
        metadata: JSON.stringify({ email: targetUser.email, role: validated.role }),
      },
    });

    return NextResponse.json({ member: membership }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentRole = await getUserWorkspaceRole(user.id, params.id);
  if (!currentRole || !canManageMembers(currentRole)) {
    return NextResponse.json({ error: 'Forbidden: Admin or Owner role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateMemberRoleSchema.parse(body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    });

    if (workspace?.ownerId === validated.userId) {
      return NextResponse.json({ error: "Cannot change the workspace owner's role" }, { status: 400 });
    }

    const updated = await prisma.workspaceMember.update({
      where: {
        workspaceId_userId: {
          workspaceId: params.id,
          userId: validated.userId,
        },
      },
      data: { role: validated.role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const currentRole = await getUserWorkspaceRole(user.id, params.id);
  if (!currentRole || !canManageMembers(currentRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');
  if (!targetUserId) {
    return NextResponse.json({ error: 'Target userId is required' }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    select: { ownerId: true },
  });

  if (workspace?.ownerId === targetUserId) {
    return NextResponse.json({ error: 'Cannot remove the workspace owner' }, { status: 400 });
  }

  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId: params.id,
        userId: targetUserId,
      },
    },
  });

  return NextResponse.json({ message: 'Member removed successfully' });
}
