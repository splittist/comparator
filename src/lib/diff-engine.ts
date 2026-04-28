import type { ComparisonPair, DiffResult } from './types';

export type { ComparisonPair, DiffResult };

function normalizeDocxOutputToBlob(output: unknown): Blob {
  if (output instanceof Blob) {
    return output;
  }

  if (output instanceof ArrayBuffer) {
    return new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  if (ArrayBuffer.isView(output)) {
    return new Blob([output], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  throw new Error('Unsupported DOCX export format returned by SuperDoc.');
}

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

    const editorConfig = {
      extensions: getStarterExtensions(),
      user: { name: 'Comparator' },
    };

    // Open both documents in headless mode
    const [oldEditor, newEditor] = await Promise.all([
      Editor.open(pair.oldFile, editorConfig),
      Editor.open(pair.newFile, editorConfig),
    ]);

    try {
      // Accept all pre-existing tracked changes in both documents before diffing
      await Promise.all([
        oldEditor.doc.trackChanges.decide({ decision: 'accept', target: { scope: 'all' } }),
        newEditor.doc.trackChanges.decide({ decision: 'accept', target: { scope: 'all' } }),
      ]);

      // Capture a snapshot of the "new" document state
      const newSnapshot = newEditor.doc.diff.capture();

      // Compute the diff relative to the "old" document
      const diffPayload = oldEditor.doc.diff.compare({ targetSnapshot: newSnapshot });

      // Apply the diff as tracked changes to the "old" document
      oldEditor.doc.diff.apply({ diff: diffPayload }, { changeMode: 'tracked' });

      // Export may return Blob or typed array depending on runtime/environment.
      const resultBlob = normalizeDocxOutputToBlob(await oldEditor.exportDocx());

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
