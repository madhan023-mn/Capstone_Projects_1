import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getUserDocumentRole, canCommentOnDocument } from '@/lib/permissions';

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  targetText: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { documentId: params.id },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      replies: {
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const roleInfo = await getUserDocumentRole(user.id, params.id);
  if (!roleInfo || !canCommentOnDocument(roleInfo.role)) {
    return NextResponse.json({ error: 'Forbidden: Commenter role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validated = createCommentSchema.parse(body);

    const comment = await prisma.comment.create({
      data: {
        documentId: params.id,
        authorId: user.id,
        content: validated.content,
        targetText: validated.targetText || null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        replies: true,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
