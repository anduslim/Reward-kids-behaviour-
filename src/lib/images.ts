import { get, set, del } from 'idb-keyval';
import { uid } from './id';

const MAX_DIM = 512;

/**
 * Resize a picked image file down to <= MAX_DIM and store it as a blob in
 * IndexedDB (keeps uploaded photos out of the ~5MB localStorage budget).
 * Returns the generated key to reference the image by.
 */
export async function storeImageFile(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const key = uid('img_');
  await set(key, blob);
  return key;
}

export async function getImageBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>(key);
}

export async function deleteImage(key?: string): Promise<void> {
  if (key) await del(key);
}

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (out) => (out ? resolve(out) : reject(new Error('Encode failed'))),
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}
