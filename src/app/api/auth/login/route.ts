import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyPassword, signJwtToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: {
              include: {
                documents: {
                  where: { isArchived: false },
                  take: 1,
                  orderBy: { updatedAt: 'desc' },
                },
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(validated.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    const firstWorkspace = user.memberships[0]?.workspace;
    const firstDoc = firstWorkspace?.documents[0];

    const response = NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      defaultWorkspaceId: firstWorkspace?.id || null,
      defaultDocumentId: firstDoc?.id || null,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
