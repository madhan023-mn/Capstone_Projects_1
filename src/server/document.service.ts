import prisma from '@/lib/prisma';

export class DocumentService {
  /**
   * Create a new document in a workspace.
   */
  static async createDocument(workspaceId: string, userId: string, title?: string, icon?: string) {
    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled Document',
        icon: icon || '📄',
        workspaceId,
        createdById: userId,
      },
    });

    await prisma.activityLog.create({
      data: {
        workspaceId,
        userId,
        action: 'DOCUMENT_CREATED',
        entityType: 'DOCUMENT',
        entityId: document.id,
        metadata: JSON.stringify({ title: document.title }),
      },
    });

    return document;
  }

  /**
   * Get document by ID with comments, versions, and authors.
   */
  static async getDocument(documentId: string) {
    return prisma.document.findUnique({
      where: { id: documentId },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        workspace: { select: { id: true, name: true, slug: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: { creator: { select: { id: true, name: true } } },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: { id: true, name: true, avatarUrl: true } } },
            },
          },
        },
      },
    });
  }

  /**
   * Save a snapshot version of a document.
   */
  static async createVersionSnapshot(
    documentId: string,
    userId: string,
    snapshot: Buffer,
    label?: string
  ) {
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    return prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersionNumber,
        label: label || `Version ${nextVersionNumber}`,
        snapshot,
        createdById: userId,
      },
    });
  }

  /**
   * Soft-delete or archive a document.
   */
  static async archiveDocument(documentId: string) {
    return prisma.document.update({
      where: { id: documentId },
      data: { isArchived: true },
    });
  }
}
