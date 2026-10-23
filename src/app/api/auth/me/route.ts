import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Get user's workspaces
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
        },
      },
    },
  });

  return NextResponse.json({
    user,
    workspaces: memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    })),
  });
}
