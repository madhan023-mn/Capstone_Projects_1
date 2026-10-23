import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  canEditDocument,
  canCommentOnDocument,
  canViewDocument,
  canManageMembers,
  canDeleteWorkspace,
  ROLE_HIERARCHY,
  WorkspaceRole,
} from '../src/lib/permissions';

describe('Authentication & Password Hashing', () => {
  it('correctly hashes and verifies passwords using bcrypt', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    expect(await bcrypt.compare(rawPassword, hash)).toBe(true);
    expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
  });

  it('correctly signs and verifies JWT tokens', () => {
    const secret = 'test-jwt-secret-key-12345';
    const payload = { userId: 'user-1', email: 'alice@collab.io', role: 'OWNER' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });

    const decoded = jwt.verify(token, secret) as any;
    expect(decoded.userId).toBe('user-1');
    expect(decoded.email).toBe('alice@collab.io');
    expect(decoded.role).toBe('OWNER');

    expect(() => jwt.verify(token, 'invalid-secret')).toThrow();
  });
});

describe('Role-Based Access Control (RBAC) Hierarchy', () => {
  it('enforces OWNER permissions', () => {
    const role: WorkspaceRole = 'OWNER';
    expect(canDeleteWorkspace(role)).toBe(true);
    expect(canManageMembers(role)).toBe(true);
    expect(canEditDocument(role)).toBe(true);
    expect(canCommentOnDocument(role)).toBe(true);
    expect(canViewDocument(role)).toBe(true);
  });

  it('enforces ADMIN permissions', () => {
    const role: WorkspaceRole = 'ADMIN';
    expect(canDeleteWorkspace(role)).toBe(false);
    expect(canManageMembers(role)).toBe(true);
    expect(canEditDocument(role)).toBe(true);
    expect(canCommentOnDocument(role)).toBe(true);
    expect(canViewDocument(role)).toBe(true);
  });

  it('enforces EDITOR permissions', () => {
    const role: WorkspaceRole = 'EDITOR';
    expect(canDeleteWorkspace(role)).toBe(false);
    expect(canManageMembers(role)).toBe(false);
    expect(canEditDocument(role)).toBe(true);
    expect(canCommentOnDocument(role)).toBe(true);
    expect(canViewDocument(role)).toBe(true);
  });

  it('enforces COMMENTER permissions', () => {
    const role: WorkspaceRole = 'COMMENTER';
    expect(canDeleteWorkspace(role)).toBe(false);
    expect(canManageMembers(role)).toBe(false);
    expect(canEditDocument(role)).toBe(false);
    expect(canCommentOnDocument(role)).toBe(true);
    expect(canViewDocument(role)).toBe(true);
  });

  it('enforces VIEWER permissions (read-only)', () => {
    const role: WorkspaceRole = 'VIEWER';
    expect(canDeleteWorkspace(role)).toBe(false);
    expect(canManageMembers(role)).toBe(false);
    expect(canEditDocument(role)).toBe(false);
    expect(canCommentOnDocument(role)).toBe(false);
    expect(canViewDocument(role)).toBe(true);
  });

  it('maintains strict mathematical hierarchy order', () => {
    expect(ROLE_HIERARCHY.OWNER).toBeGreaterThan(ROLE_HIERARCHY.ADMIN);
    expect(ROLE_HIERARCHY.ADMIN).toBeGreaterThan(ROLE_HIERARCHY.EDITOR);
    expect(ROLE_HIERARCHY.EDITOR).toBeGreaterThan(ROLE_HIERARCHY.COMMENTER);
    expect(ROLE_HIERARCHY.COMMENTER).toBeGreaterThan(ROLE_HIERARCHY.VIEWER);
  });
});
