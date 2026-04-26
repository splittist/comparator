export interface ComparisonPair {
  id: string;
  oldFile: File;
  newFile: File;
  label?: string;
}

export interface DiffResult {
  id: string;
  resultBlob: Blob | null;
  oldFileName: string;
  newFileName: string;
  status: 'pending' | 'computing' | 'done' | 'error';
  error?: string;
}
