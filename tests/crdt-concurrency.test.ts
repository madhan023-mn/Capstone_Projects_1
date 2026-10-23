import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

describe('Yjs CRDT Real-Time Concurrency and Conflict Resolution', () => {
  it('converges two clients making concurrent insertions at the same position', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const ytext1 = doc1.getText('default');
    const ytext2 = doc2.getText('default');

    // Both clients initialize with the exact same starting paragraph
    ytext1.insert(0, 'Hello World');
    const initUpdate = Y.encodeStateAsUpdate(doc1);
    Y.applyUpdate(doc2, initUpdate);

    expect(ytext1.toString()).toBe('Hello World');
    expect(ytext2.toString()).toBe('Hello World');

    // Client 1 types " Beautiful" at index 5 concurrently
    ytext1.insert(5, ' Beautiful');

    // Client 2 types " Wonderful" at index 5 concurrently (offline / network delay)
    ytext2.insert(5, ' Wonderful');

    // Exchange updates between Client 1 and Client 2
    const update1 = Y.encodeStateAsUpdate(doc1);
    const update2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc1, update2);
    Y.applyUpdate(doc2, update1);

    // CRDT Guarantees: Both documents MUST converge to the exact same string
    expect(ytext1.toString()).toBe(ytext2.toString());
    expect(ytext1.toString().length).toBe('Hello Beautiful Wonderful World'.length);

    doc1.destroy();
    doc2.destroy();
  });

  it('handles simultaneous edits from multiple clients to different paragraphs', () => {
    const clientA = new Y.Doc();
    const clientB = new Y.Doc();
    const clientC = new Y.Doc();

    const textA = clientA.getText('content');
    const textB = clientB.getText('content');
    const textC = clientC.getText('content');

    textA.insert(0, 'Paragraph 1: Introduction\n\nParagraph 2: Architecture\n\nParagraph 3: Conclusion');
    const syncInit = Y.encodeStateAsUpdate(clientA);
    Y.applyUpdate(clientB, syncInit);
    Y.applyUpdate(clientC, syncInit);

    // Client A edits Paragraph 1
    textA.insert(12, ' - Overview');

    // Client B edits Paragraph 2
    textB.insert(40, ' with Redis pub/sub');

    // Client C appends to Paragraph 3
    textC.insert(textC.length, ' - All tests pass!');

    // Simulate multi-way sync
    const updA = Y.encodeStateAsUpdate(clientA);
    const updB = Y.encodeStateAsUpdate(clientB);
    const updC = Y.encodeStateAsUpdate(clientC);

    Y.applyUpdate(clientA, updB);
    Y.applyUpdate(clientA, updC);

    Y.applyUpdate(clientB, updA);
    Y.applyUpdate(clientB, updC);

    Y.applyUpdate(clientC, updA);
    Y.applyUpdate(clientC, updB);

    // Verify all 3 clients reach identical state
    expect(textA.toString()).toBe(textB.toString());
    expect(textB.toString()).toBe(textC.toString());
    expect(textA.toString()).toContain('Overview');
    expect(textA.toString()).toContain('Redis pub/sub');
    expect(textA.toString()).toContain('All tests pass!');

    clientA.destroy();
    clientB.destroy();
    clientC.destroy();
  });

  it('correctly creates and restores binary snapshot states', () => {
    const doc = new Y.Doc();
    const text = doc.getText('document');

    text.insert(0, 'Version 1 Draft Content');
    const snapshotV1 = Y.encodeStateAsUpdate(doc);

    // Make more edits
    text.insert(text.length, '\nAdded new section for Version 2');
    expect(text.toString()).toContain('Added new section');

    // Restore to Version 1 snapshot in a fresh document instance
    const restoredDoc = new Y.Doc();
    const restoredText = restoredDoc.getText('document');
    Y.applyUpdate(restoredDoc, snapshotV1);

    expect(restoredText.toString()).toBe('Version 1 Draft Content');

    doc.destroy();
    restoredDoc.destroy();
  });
});
