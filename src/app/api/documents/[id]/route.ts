import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canEditDocument } from '@/lib/permissions';

const updateDocSchema = z.object({
  title: z.string().min(1).optional(),
  icon: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo) {
    return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          comments: { where: { isResolved: false } },
          versions: true,
        },
      },
    },
  });

  return NextResponse.json({
    document,
    userRole: roleInfo.role,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo || !canEditDocument(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden: Editor role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateDocSchema.parse(body);

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(validated.title ? { title: validated.title } : {}),
        ...(validated.icon ? { icon: validated.icon } : {}),
        ...(validated.isArchived !== undefined ? { isArchived: validated.isArchived } : {}),
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo || !canEditDocument(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete / archive
  await prisma.document.update({
    where: { id: params.id },
    data: { isArchived: true },
  });

  return NextResponse.json({ message: 'Document archived successfully' });
}
