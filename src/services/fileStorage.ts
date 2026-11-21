import * as FileSystem from 'expo-file-system/legacy';

const PDF_SUBDIR = 'studyvault_pdfs/';

export function getPdfStorageDirectory(): string {
  const docDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
  if (!docDir) {
    throw new Error('Storage directory not available on this device');
  }
  const base = docDir.endsWith('/') ? docDir : `${docDir}/`;
  return `${base}${PDF_SUBDIR}`;
}

export async function ensurePdfDirectoryExists(): Promise<string> {
  const dir = getPdfStorageDirectory();
  try {
    const dirInfo = await FileSystem.getInfoAsync(dir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (e) {
    console.warn('Error creating PDF directory:', e);
  }
  return dir;
}

export function sanitizeFileName(name: string): string {
  if (!name) return `document_${Date.now()}.pdf`;
  const clean = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.endsWith('.pdf') ? clean : `${clean}.pdf`;
}

export async function copyPdfToAppStorage(
  sourceUri: string,
  originalFilename?: string
): Promise<{ localPath: string; fileSize: number }> {
  await ensurePdfDirectoryExists();
  const dir = getPdfStorageDirectory();

  const safeFilename = originalFilename || `document_${Date.now()}.pdf`;
  const sanitized = sanitizeFileName(safeFilename);
  const timestamp = Date.now();
  const targetFilename = `${timestamp}_${sanitized}`;
  const targetPath = `${dir}${targetFilename}`;

  let copied = false;

  // Attempt 1: Direct native copyAsync (handles content:// and internal file:// natively)
  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetPath,
    });
    copied = true;
  } catch (copyErr) {
    console.warn('Native copyAsync failed, attempting chunked fetch fallback:', copyErr);
  }

  // Attempt 2: React Native fetch() blob slicing (chunked copy to prevent OOM on large files)
  if (!copied) {
    try {
      const response = await fetch(sourceUri);
      const blob = await response.blob();
      const totalSize = blob.size;
      const CHUNK_SIZE = 512 * 1024; // 512 KB per slice

      // Remove partially existing target if any
      const existing = await FileSystem.getInfoAsync(targetPath);
      if (existing.exists) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
      }

      for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
        const slice = blob.slice(offset, offset + CHUNK_SIZE);
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = reader.result as string;
            const commaIdx = res ? res.indexOf(',') : -1;
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res || '');
          };
          reader.onerror = () => reject(new Error('FileReader slice read failed'));
          reader.readAsDataURL(slice);
        });

        await FileSystem.writeAsStringAsync(targetPath, chunkBase64, {
          encoding: FileSystem.EncodingType.Base64,
          append: offset > 0,
        });
      }
      copied = true;
    } catch (fetchErr) {
      console.warn('Chunked fetch blob slice fallback failed, attempting chunked readAsStringAsync:', fetchErr);
    }
  }

  // Attempt 3: Direct base64 chunked reading via FileSystem
  if (!copied) {
    try {
      const CHUNK_SIZE = 512 * 1024;
      let offset = 0;
      let hasMore = true;

      const existing = await FileSystem.getInfoAsync(targetPath);
      if (existing.exists) {
        await FileSystem.deleteAsync(targetPath, { idempotent: true });
      }

      while (hasMore) {
        const chunk = await FileSystem.readAsStringAsync(sourceUri, {
          encoding: FileSystem.EncodingType.Base64,
          position: offset,
          length: CHUNK_SIZE,
        });
        if (!chunk || chunk.length === 0) {
          hasMore = false;
          break;
        }
        await FileSystem.writeAsStringAsync(targetPath, chunk, {
          encoding: FileSystem.EncodingType.Base64,
          append: offset > 0,
        });
        offset += CHUNK_SIZE;
        if (chunk.length < 500000) {
          hasMore = false;
        }
      }
      copied = true;
    } catch (streamErr) {
      console.error('All copy strategies failed for PDF:', streamErr);
      throw new Error(`Could not access or copy the selected file: ${(streamErr as any)?.message || 'Unknown error'}`);
    }
  }

  let fileSize = 0;
  try {
    const fileInfo = await FileSystem.getInfoAsync(targetPath);
    fileSize = fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number' ? fileInfo.size : 0;
  } catch {
    fileSize = 0;
  }

  return {
    localPath: targetPath,
    fileSize,
  };
}

export async function checkFileExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

export async function deletePdfFromAppStorage(localPath: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      await FileSystem.deleteAsync(localPath, { idempotent: true });
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to delete file from local storage:', error);
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

async function loadBlobFromUri(uri: string): Promise<Blob> {
  // Strategy A: Native fetch()
  try {
    const res = await fetch(uri);
    if (res.ok || res.status === 0 || res.status === 200) {
      const b = await res.blob();
      if (b && b.size > 0) return b;
    }
  } catch {}

  // Strategy B: Native XMLHttpRequest blob loader (bypasses Expo Go filesystem sandbox on Android)
  return new Promise<Blob>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', uri, true);
      xhr.responseType = 'blob';
      xhr.onload = () => {
        if (xhr.response && xhr.response.size > 0) {
          resolve(xhr.response);
        } else {
          reject(new Error(`XHR returned empty blob for ${uri}`));
        }
      };
      xhr.onerror = (e) =>
        reject(new Error(`XHR failed: ${(e as any)?.message || 'network error'}`));
      xhr.ontimeout = () => reject(new Error('XHR timed out'));
      xhr.timeout = 20000;
      xhr.send(null);
    } catch (e) {
      reject(e);
    }
  });
}

export function resolveLocalPdfUri(storedPath: string): string {
  if (!storedPath) return '';
  const currentDir = getPdfStorageDirectory();
  const filename = storedPath.split('/').pop() || storedPath;
  return `${currentDir}${filename}`;
}

export async function readPdfFileAsChunks(
  primaryUri: string,
  onChunk: (base64Chunk: string, offset: number, totalSize: number) => void
): Promise<{ totalSize: number; validPath: string }> {
  const CHUNK_SIZE = 256 * 1024; // 256 KB chunk ensures Android Binder IPC transaction limits are safe

  const currentDir = getPdfStorageDirectory();
  const rawFilename = primaryUri.split('/').pop() || '';
  const filename = decodeURIComponent(rawFilename);
  const resolvedCurrentUri = `${currentDir}${filename}`;

  // Build a prioritized list of candidate paths to search across:
  // 1. Current session directory with normalized filename
  // 2. Current session directory with raw filename
  // 3. Cache directory variants
  // 4. Original stored URI & decoded / unescaped variants
  const cacheDir = FileSystem.cacheDirectory || '';
  const rawCandidates: string[] = [
    resolvedCurrentUri,
    `${currentDir}${rawFilename}`,
    `${cacheDir}${PDF_SUBDIR}${filename}`,
    `${cacheDir}${filename}`,
    primaryUri,
  ];

  try {
    const decodedOnce = decodeURI(primaryUri);
    if (!rawCandidates.includes(decodedOnce)) rawCandidates.push(decodedOnce);
  } catch {}
  try {
    const decodedComp = decodeURIComponent(primaryUri);
    if (!rawCandidates.includes(decodedComp)) rawCandidates.push(decodedComp);
  } catch {}
  try {
    const fixedDoubleEncoded = primaryUri
      .replace(/%2540/g, '%40')
      .replace(/%252F/g, '%2F');
    if (!rawCandidates.includes(fixedDoubleEncoded)) rawCandidates.push(fixedDoubleEncoded);
  } catch {}

  // Filter unique valid candidates
  const candidates = Array.from(new Set(rawCandidates.filter(Boolean)));
  let totalSize = 0;

  // Strategy 1: Native FileSystem readAsStringAsync across candidate paths
  for (const candidate of candidates) {
    try {
      const info = await FileSystem.getInfoAsync(candidate);
      if (!info.exists) continue;

      const candidateSize = 'size' in info && typeof info.size === 'number' ? info.size : 0;
      if (candidateSize === 0) {
        const fullBase64 = await FileSystem.readAsStringAsync(candidate, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const computedSize = Math.round((fullBase64.length * 3) / 4);
        for (let i = 0; i < fullBase64.length; i += CHUNK_SIZE) {
          onChunk(fullBase64.substring(i, i + CHUNK_SIZE), i, computedSize);
        }
        return { totalSize: computedSize, validPath: candidate };
      }

      for (let offset = 0; offset < candidateSize; offset += CHUNK_SIZE) {
        const lengthToRead = Math.min(CHUNK_SIZE, candidateSize - offset);
        const chunk = await FileSystem.readAsStringAsync(candidate, {
          encoding: FileSystem.EncodingType.Base64,
          position: offset,
          length: lengthToRead,
        });
        onChunk(chunk, offset, candidateSize);
      }
      return { totalSize: candidateSize, validPath: candidate };
    } catch (fsErr) {
      console.warn('Native readAsStringAsync attempt notice for candidate:', candidate, (fsErr as any)?.message);
    }
  }

  // Strategy 2: Fetch / XHR Blob stream (bypasses Android Expo Go experience scope limitations)
  for (const candidate of candidates) {
    try {
      const blob = await loadBlobFromUri(candidate);
      totalSize = blob.size || totalSize;

      for (let offset = 0; offset < totalSize; offset += CHUNK_SIZE) {
        const slice = blob.slice(offset, offset + CHUNK_SIZE);
        const chunkBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string) || '';
            const commaIdx = res.indexOf(',');
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
          };
          reader.onerror = () =>
            reject(new Error('FileReader slice conversion failed'));
          reader.readAsDataURL(slice);
        });

        onChunk(chunkBase64, offset, totalSize);
      }

      // Auto-cache and save recovered file into the current app storage directory
      try {
        await ensurePdfDirectoryExists();
        const fullBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const res = (reader.result as string) || '';
            const commaIdx = res.indexOf(',');
            resolve(commaIdx !== -1 ? res.substring(commaIdx + 1) : res);
          };
          reader.onerror = () =>
            reject(new Error('FileReader conversion failed'));
          reader.readAsDataURL(blob);
        });
        await FileSystem.writeAsStringAsync(resolvedCurrentUri, fullBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch (saveErr) {
        console.warn(
          'Could not save recovered blob to current storage directory:',
          saveErr
        );
      }

      return { totalSize, validPath: resolvedCurrentUri };
    } catch (streamErr) {
      console.warn(
        'Blob stream fallback attempt failed for candidate',
        candidate,
        streamErr
      );
    }
  }

  throw new Error(`Unable to read PDF file from storage: ${filename || primaryUri}`);
}
