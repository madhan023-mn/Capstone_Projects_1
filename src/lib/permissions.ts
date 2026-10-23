import prisma from './prisma';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER';

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 50,
  ADMIN: 40,
  EDITOR: 30,
  COMMENTER: 20,
  VIEWER: 10,
};

export function canEditDocument(role: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.EDITOR;
}

export function canCommentOnDocument(role: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.COMMENTER;
}

export function canViewDocument(role: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.VIEWER;
}

export function canManageMembers(role: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.ADMIN;
}

export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === 'OWNER';
}

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  if (!membership) return null;
  return membership.role as WorkspaceRole;
}

export async function getUserDocumentRole(
  userId: string,
  documentId: string
): Promise<{ role: WorkspaceRole; document: any; workspaceId: string } | null> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      workspace: {
        include: {
          members: {
            where: { userId },
            select: { role: true },
          },
        },
      },
    },
  });

  if (!doc) return null;

  const membership = doc.workspace.members[0];
  if (!membership) return null;

  return {
    role: membership.role as WorkspaceRole,
    document: doc,
    workspaceId: doc.workspaceId,
  };
}
