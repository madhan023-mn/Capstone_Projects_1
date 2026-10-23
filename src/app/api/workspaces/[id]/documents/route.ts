import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserWorkspaceRole, canEditDocument } from '@/lib/permissions';

const createDocSchema = z.object({
  title: z.string().min(1).default('Untitled Document'),
  icon: z.string().default('file-text'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const documents = await prisma.document.findMany({
    where: {
      workspaceId: params.id,
      isArchived: false,
    },
    include: {
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
      _count: {
        select: {
          comments: { where: { isResolved: false } },
          versions: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ documents, userRole: role });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = await getUserWorkspaceRole(user.id, params.id);
  if (!role || !canEditDocument(role)) {
    return NextResponse.json({ error: 'Forbidden: Editor role required to create documents' }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const validated = createDocSchema.parse(body);

    const doc = await prisma.document.create({
      data: {
        title: validated.title,
        icon: validated.icon,
        workspaceId: params.id,
        createdById: user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId: params.id,
        userId: user.id,
        action: 'DOCUMENT_CREATED',
        entityType: 'DOCUMENT',
        entityId: doc.id,
        metadata: JSON.stringify({ title: doc.title }),
      },
    });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}
