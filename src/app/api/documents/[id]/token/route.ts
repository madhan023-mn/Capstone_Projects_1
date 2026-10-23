import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, signCollabWsToken } from '@/lib/auth';
import { getUserDocumentRole } from '@/lib/permissions';
import { getUserColor } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo) {
    return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
  }

  const color = getUserColor(user.id);

  const wsToken = signCollabWsToken({
    userId: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: roleInfo.role,
    documentId: params.id,
    workspaceId: roleInfo.workspaceId,
  });

  return NextResponse.json({
    token: wsToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      color,
      role: roleInfo.role,
    },
    wsUrl: process.env.NEXT_PUBLIC_COLLAB_WS_URL || 'ws://localhost:1234',
  });
}
