import { normalizeVirtualPath, type VfsPayload } from '../vfs/OverlayVfs';

export interface GameFolderSelection {
  detectedFolderName: string;
  files: Map<string, VfsPayload>;
  rejected: number;
}

/** Browser file input cannot access an arbitrary OS pathname. The user must select the folder. */
export function listUserSelectedGameDirectory(fileList: FileList): GameFolderSelection {
  const files = new Map<string, VfsPayload>();
  let rejected = 0;
  let detectedFolderName = 'local selection';
  for (const file of Array.from(fileList).slice(0, 40_000)) {
    const originalPath = file.webkitRelativePath || file.name;
    const segments = originalPath.replace(/\\/g, '/').split('/');
    if (segments.length > 1) {
      detectedFolderName = segments[0] || detectedFolderName;
      segments.shift();
    }
    try {
      const path = normalizeVirtualPath(segments.join('/'));
      if (files.has(path)) rejected++;
      else files.set(path, file);
    } catch { rejected++; }
  }
  return { detectedFolderName, files, rejected };
}
