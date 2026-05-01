import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComparisonPair, DiffResult } from '../types';

// Mock the superdoc/super-editor module
vi.mock('superdoc/super-editor', () => {
  const captureResult = { snapshot: 'mock-snapshot' };
  const diffPayload = { payload: 'mock-diff', baseFingerprint: 'fp1' };
  const mockDiffAdapter = {
    capture: vi.fn().mockReturnValue(captureResult),
    compare: vi.fn().mockReturnValue(diffPayload),
    apply: vi.fn().mockReturnValue({ appliedOperations: 1 }),
  };
  const mockDoc = { diff: mockDiffAdapter };
  const mockEditor = {
    doc: mockDoc,
    exportDocx: vi.fn().mockResolvedValue(new Blob(['docx content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
    close: vi.fn(),
  };

  return {
    Editor: {
      open: vi.fn().mockResolvedValue(mockEditor),
    },
    getStarterExtensions: vi.fn().mockReturnValue([]),
    _mockEditor: mockEditor,
    _mockDiffAdapter: mockDiffAdapter,
  };
});

// Dynamically re-import after mocking
async function getComputeDiff() {
  const mod = await import('../diff-engine');
  return mod.computeDiff;
}

function makeFile(name: string, content = 'fake docx'): File {
  return new File([content], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

describe('ComparisonPair type', () => {
  it('should have the required shape', () => {
    const pair: ComparisonPair = {
      id: 'test-id',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
      label: 'Test comparison',
    };

    expect(pair.id).toBe('test-id');
    expect(pair.oldFile).toBeInstanceOf(File);
    expect(pair.newFile).toBeInstanceOf(File);
    expect(pair.label).toBe('Test comparison');
  });

  it('label should be optional', () => {
    const pair: ComparisonPair = {
      id: 'test-id-2',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
    };

    expect(pair.label).toBeUndefined();
  });
});

describe('DiffResult type', () => {
  it('should represent a pending result', () => {
    const result: DiffResult = {
      id: 'result-id',
      resultBlob: null,
      oldFileName: 'old.docx',
      newFileName: 'new.docx',
      status: 'pending',
    };

    expect(result.status).toBe('pending');
    expect(result.resultBlob).toBeNull();
  });

  it('should represent a done result with a blob', () => {
    const blob = new Blob(['content']);
    const result: DiffResult = {
      id: 'result-id',
      resultBlob: blob,
      oldFileName: 'old.docx',
      newFileName: 'new.docx',
      status: 'done',
    };

    expect(result.status).toBe('done');
    expect(result.resultBlob).toBe(blob);
  });

  it('should represent an error result', () => {
    const result: DiffResult = {
      id: 'result-id',
      resultBlob: null,
      oldFileName: 'old.docx',
      newFileName: 'new.docx',
      status: 'error',
      error: 'Something went wrong',
    };

    expect(result.status).toBe('error');
    expect(result.error).toBe('Something went wrong');
  });
});

describe('computeDiff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns done status and a Blob on success', async () => {
    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-1',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.id).toBe('pair-1');
    expect(result.status).toBe('done');
    expect(result.resultBlob).toBeInstanceOf(Blob);
    expect(result.oldFileName).toBe('old.docx');
    expect(result.newFileName).toBe('new.docx');
  });

  it('populates file names from the pair', async () => {
    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-2',
      oldFile: makeFile('contract-v1.docx'),
      newFile: makeFile('contract-v2.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.oldFileName).toBe('contract-v1.docx');
    expect(result.newFileName).toBe('contract-v2.docx');
  });

  it('returns error status when Editor.open throws', async () => {
    const { Editor } = await import('superdoc/super-editor');
    (Editor.open as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Failed to parse DOCX'),
    );

    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-err',
      oldFile: makeFile('bad.docx', 'not a real docx'),
      newFile: makeFile('new.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.status).toBe('error');
    expect(result.error).toBe('Failed to parse DOCX');
    expect(result.resultBlob).toBeNull();
  });

  it('returns error status when exportDocx throws', async () => {
    const { _mockEditor } = await import('superdoc/super-editor') as { _mockEditor: { exportDocx: ReturnType<typeof vi.fn> } };
    _mockEditor.exportDocx.mockRejectedValueOnce(new Error('Export failed'));

    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-export-err',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.status).toBe('error');
    expect(result.error).toContain('Export failed');
  });

  it('normalizes Uint8Array export output to Blob', async () => {
    const { _mockEditor } = await import('superdoc/super-editor') as { _mockEditor: { exportDocx: ReturnType<typeof vi.fn> } };
    _mockEditor.exportDocx.mockResolvedValueOnce(new Uint8Array([0x50, 0x4b, 0x03, 0x04]));

    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-typed-array',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.status).toBe('done');
    expect(result.resultBlob).toBeInstanceOf(Blob);
    expect(result.resultBlob?.size).toBe(4);
    expect(result.resultBlob?.type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('continues diffing when pre-diff track-change cleanup throws', async () => {
    const { _mockEditor } = await import('superdoc/super-editor') as {
      _mockEditor: { doc: { trackChanges?: { decide: ReturnType<typeof vi.fn> } } };
    };

    _mockEditor.doc.trackChanges = {
      decide: vi.fn().mockRejectedValue(new Error('Cannot read properties of undefined (reading isHeaderOrFooter)')),
    };

    const computeDiff = await getComputeDiff();
    const pair: ComparisonPair = {
      id: 'pair-track-cleanup-err',
      oldFile: makeFile('old.docx'),
      newFile: makeFile('new.docx'),
    };

    const result = await computeDiff(pair);

    expect(result.status).toBe('done');
    expect(result.resultBlob).toBeInstanceOf(Blob);
  });
});
