import prisma from '@/lib/prisma';
import { WorkspaceRole, ROLE_HIERARCHY } from '@/lib/permissions';

export class AuthorizationService {
  /**
   * Verify if a user is a member of the workspace and has at least the required role.
   */
  static async verifyWorkspaceAccess(
    userId: string,
    workspaceId: string,
    requiredRole: WorkspaceRole = 'VIEWER'
  ): Promise<{ role: WorkspaceRole; isAuthorized: boolean }> {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
      select: { role: true },
    });

    if (!membership) {
      return { role: 'VIEWER', isAuthorized: false };
    }

    const currentRole = membership.role as WorkspaceRole;
    const isAuthorized = ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];

    return { role: currentRole, isAuthorized };
  }

  /**
   * Verify if a user has access to a specific document.
   */
  static async verifyDocumentAccess(
    userId: string,
    documentId: string,
    requiredRole: WorkspaceRole = 'VIEWER'
  ): Promise<{
    isAuthorized: boolean;
    role: WorkspaceRole;
    document: any;
    workspaceId: string;
  }> {
    const document = await prisma.document.findUnique({
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

    if (!document) {
      throw new Error('DOCUMENT_NOT_FOUND');
    }

    const membership = document.workspace.members[0];
    if (!membership) {
      return {
        isAuthorized: false,
        role: 'VIEWER',
        document,
        workspaceId: document.workspaceId,
      };
    }

    const userRole = membership.role as WorkspaceRole;
    const isAuthorized = ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];

    return {
      isAuthorized,
      role: userRole,
      document,
      workspaceId: document.workspaceId,
    };
  }
}
