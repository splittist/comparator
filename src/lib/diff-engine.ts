import type { ComparisonPair, DiffResult } from './types';

export type { ComparisonPair, DiffResult };

/**
 * Computes a diff between two DOCX files and returns a DiffResult containing
 * a Blob with tracked changes applied.
 *
 * Uses the SuperDoc Editor headless API:
 *   - Editor.open() to load documents
 *   - editor.doc.diff.capture() to snapshot the "new" document
 *   - editor.doc.diff.compare() to compute the diff
 *   - editor.doc.diff.apply() to apply tracked changes to the "old" document
 *   - editor.exportDocx() to export the result
 */
export async function computeDiff(pair: ComparisonPair): Promise<DiffResult> {
  const base: DiffResult = {
    id: pair.id,
    resultBlob: null,
    oldFileName: pair.oldFile.name,
    newFileName: pair.newFile.name,
    status: 'computing',
  };

  try {
    // Dynamic import to avoid loading superdoc at module parse time
    const { Editor, getStarterExtensions } = await import('superdoc/super-editor');

    // Open both documents in headless mode
    const [oldEditor, newEditor] = await Promise.all([
      Editor.open(pair.oldFile, { extensions: getStarterExtensions() }),
      Editor.open(pair.newFile, { extensions: getStarterExtensions() }),
    ]);

    try {
      // Capture a snapshot of the "new" document state
      const newSnapshot = newEditor.doc.diff.capture();

      // Compute the diff relative to the "old" document
      const diffPayload = oldEditor.doc.diff.compare({ targetSnapshot: newSnapshot });

      // Apply the diff as tracked changes to the "old" document
      oldEditor.doc.diff.apply({ diff: diffPayload }, { changeMode: 'tracked' });

      // Export the result as a DOCX Blob
      const resultBlob = await oldEditor.exportDocx();

      return {
        ...base,
        resultBlob,
        status: 'done',
      };
    } finally {
      oldEditor.close();
      newEditor.close();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ...base,
      status: 'error',
      error: message,
    };
  }
}
