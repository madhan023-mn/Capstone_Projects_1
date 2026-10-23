import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canEditDocument } from '@/lib/permissions';

const createVersionSchema = z.object({
  label: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: params.id },
    select: {
      id: true,
      documentId: true,
      versionNumber: true,
      label: true,
      createdAt: true,
      creator: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { versionNumber: 'desc' },
  });

  return NextResponse.json({ versions });
}

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const validated = createVersionSchema.parse(body);

    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      select: { yjsState: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Determine next version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    // Use current Yjs state as snapshot (or empty buffer if fresh doc)
    const snapshotBytes = doc.yjsState || Buffer.from([]);

    const version = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        versionNumber: nextVersionNumber,
        label: validated.label || `Version ${nextVersionNumber}`,
        snapshot: snapshotBytes,
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
        workspaceId: roleInfo.workspaceId,
        userId: user.id,
        action: 'VERSION_CREATED',
        entityType: 'DOCUMENT_VERSION',
        entityId: version.id,
        metadata: JSON.stringify({ versionNumber: nextVersionNumber, label: version.label }),
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Create version error:', error);
    return NextResponse.json({ error: 'Failed to create version snapshot' }, { status: 500 });
  }
}
