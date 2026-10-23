import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-collaborative-workspace-key-dev-1234567890';
export const AUTH_COOKIE_NAME = 'collab_session_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface CollabWsTokenPayload {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER';
  documentId: string;
  workspaceId: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: TokenPayload, expiresIn: jwt.SignOptions['expiresIn'] = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJwtToken<T = TokenPayload>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch (error) {
    return null;
  }
}

export function signCollabWsToken(payload: CollabWsTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' } as jwt.SignOptions);
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyJwtToken<TokenPayload>(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
