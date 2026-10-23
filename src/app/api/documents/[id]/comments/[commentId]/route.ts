import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canCommentOnDocument, canManageMembers } from '@/lib/permissions';

const updateCommentSchema = z.object({
  isResolved: z.boolean().optional(),
  content: z.string().min(1).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo || !canCommentOnDocument(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = updateCommentSchema.parse(body);

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const updated = await prisma.comment.update({
      where: { id: params.commentId },
      data: {
        ...(validated.isResolved !== undefined ? { isResolved: validated.isResolved } : {}),
        ...(validated.content && comment.authorId === user.id ? { content: validated.content } : {}),
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        replies: {
          include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
        },
      },
    });

    return NextResponse.json({ comment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const comment = await prisma.comment.findUnique({
    where: { id: params.commentId },
  });

  if (!comment || comment.documentId !== params.id) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  // Only author or admin/owner can delete
  if (comment.authorId !== user.id && !canManageMembers(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden: You cannot delete this comment' }, { status: 403 });
  }

  await prisma.comment.delete({
    where: { id: params.commentId },
  });

  return NextResponse.json({ message: 'Comment deleted successfully' });
}
