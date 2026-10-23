import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canCommentOnDocument } from '@/lib/permissions';

const replySchema = z.object({
  content: z.string().min(1, 'Reply cannot be empty'),
});

export async function POST(
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
    const validated = replySchema.parse(body);

    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const reply = await prisma.commentReply.create({
      data: {
        commentId: params.commentId,
        authorId: user.id,
        content: validated.content,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to post reply' }, { status: 500 });
  }
}
