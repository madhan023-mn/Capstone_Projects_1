import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, signJwtToken, AUTH_COOKIE_NAME } from '@/lib/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(validated.password);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      validated.name
    )}`;

    const user = await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        avatarUrl,
      },
    });

    // Create a default personal workspace for the new user
    const slug = `${validated.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`;
    const workspace = await prisma.workspace.create({
      data: {
        name: `${validated.name}'s Workspace`,
        slug,
        ownerId: user.id,
        members: {
          create: [{ userId: user.id, role: 'OWNER' }],
        },
        documents: {
          create: [
            {
              title: 'Getting Started with Real-Time Collaboration 🚀',
              icon: '🚀',
              createdById: user.id,
            },
          ],
        },
      },
      include: {
        documents: true,
      },
    });

    // Sign session token
    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    const response = NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        },
        defaultWorkspaceId: workspace.id,
        defaultDocumentId: workspace.documents[0]?.id,
      },
      { status: 201 }
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
