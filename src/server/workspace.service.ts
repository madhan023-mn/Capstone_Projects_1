import prisma from '@/lib/prisma';
import { WorkspaceRole } from '@/lib/permissions';

export class WorkspaceService {
  /**
   * List all workspaces a user is a member of.
   */
  static async getUserWorkspaces(userId: string) {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true, documents: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      userRole: m.role as WorkspaceRole,
      joinedAt: m.joinedAt,
    }));
  }

  /**
   * Create a new workspace and automatically assign the creator as OWNER.
   */
  static async createWorkspace(userId: string, name: string, description?: string) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

    return prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          slug,
          description,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: 'OWNER',
            },
          },
        },
      });

      // Create default starter document
      const defaultDoc = await tx.document.create({
        data: {
          title: 'Getting Started',
          icon: 'sparkles',
          workspaceId: workspace.id,
          createdById: userId,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          workspaceId: workspace.id,
          userId,
          action: 'WORKSPACE_CREATED',
          entityType: 'WORKSPACE',
          entityId: workspace.id,
          metadata: JSON.stringify({ name }),
        },
      });

      return { workspace, defaultDoc };
    });
  }

  /**
   * Add a member to a workspace.
   */
  static async addMember(workspaceId: string, userId: string, role: WorkspaceRole = 'EDITOR') {
    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role,
      },
    });
  }
}
