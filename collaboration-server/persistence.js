const { PrismaClient } = require('@prisma/client');
const Y = require('yjs');

const prisma = new PrismaClient();

// In-memory debounce timers map
const saveDebounceTimers = new Map();

/**
 * Loads the persisted Yjs binary state from the database for a document.
 * Returns Uint8Array of the state or null if not found.
 */
async function loadDocumentState(documentId) {
  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { yjsState: true, title: true },
    });

    if (doc && doc.yjsState) {
      return new Uint8Array(doc.yjsState);
    }
    return null;
  } catch (err) {
    console.error(`[Persistence] Error loading document state for ${documentId}:`, err.message);
    return null;
  }
}

/**
 * Persists the current Yjs document state to the database.
 */
async function persistDocumentState(documentId, ydoc) {
  try {
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });

    if (!existing) {
      // Document is in-memory only (e.g. temporary benchmark or deleted doc)
      return;
    }

    const state = Y.encodeStateAsUpdate(ydoc);
    const buffer = Buffer.from(state);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        yjsState: buffer,
        updatedAt: new Date(),
      },
    });

    console.log(`[Persistence] Saved Y.Doc state for doc ${documentId} (${buffer.length} bytes)`);
  } catch (err) {
    console.warn(`[Persistence] Notice: Could not persist state for doc ${documentId}:`, err.message);
  }
}

/**
 * Debounced persistence trigger - groups rapid edits into single DB writes.
 */
function scheduleDocumentSave(documentId, ydoc, delayMs = 2000) {
  if (saveDebounceTimers.has(documentId)) {
    clearTimeout(saveDebounceTimers.get(documentId));
  }

  const timer = setTimeout(async () => {
    saveDebounceTimers.delete(documentId);
    await persistDocumentState(documentId, ydoc);
  }, delayMs);

  saveDebounceTimers.set(documentId, timer);
}

/**
 * Immediate flush of pending saves (used during shutdown or room close)
 */
async function flushDocumentSave(documentId, ydoc) {
  if (saveDebounceTimers.has(documentId)) {
    clearTimeout(saveDebounceTimers.get(documentId));
    saveDebounceTimers.delete(documentId);
  }
  await persistDocumentState(documentId, ydoc);
}

module.exports = {
  prisma,
  loadDocumentState,
  persistDocumentState,
  scheduleDocumentSave,
  flushDocumentSave,
};
