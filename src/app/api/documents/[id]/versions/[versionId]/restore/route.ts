import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canEditDocument } from '@/lib/permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo || !canEditDocument(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden: Editor role required to restore versions' }, { status: 403 });
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: params.versionId },
  });

  if (!version || version.documentId !== params.id) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }

  // Restore snapshot into document
  await prisma.document.update({
    where: { id: params.id },
    data: {
      yjsState: version.snapshot,
      updatedAt: new Date(),
    },
  });

  // Audit trail log
  await prisma.activityLog.create({
    data: {
      workspaceId: roleInfo.workspaceId,
      userId: user.id,
      action: 'VERSION_RESTORED',
      entityType: 'DOCUMENT_VERSION',
      entityId: version.id,
      metadata: JSON.stringify({
        restoredVersionNumber: version.versionNumber,
        label: version.label,
      }),
    },
  });

  return NextResponse.json({
    message: `Restored to version ${version.versionNumber} successfully`,
    versionNumber: version.versionNumber,
  });
}
