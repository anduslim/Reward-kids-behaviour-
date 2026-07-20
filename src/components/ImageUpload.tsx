import { useRef, useState } from 'react';
import { storeImageFile } from '../lib/images';
import { StoredImage } from './StoredImage';

/**
 * Picks an image, resizes + stores it in IndexedDB, and reports the key back.
 * Shows a live preview of the current image.
 */
export function ImageUpload({
  imageId,
  fallback,
  onChange,
}: {
  imageId?: string;
  fallback?: string;
  onChange: (imageId: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const key = await storeImageFile(file);
      onChange(key);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <StoredImage
        imageId={imageId}
        fallback={fallback}
        className="h-16 w-16 shrink-0 rounded-2xl"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost !px-3 !py-2 text-sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : imageId ? 'Change photo' : 'Upload photo'}
        </button>
        {imageId && (
          <button
            type="button"
            className="btn-ghost !px-3 !py-2 text-sm text-red-500"
            onClick={() => onChange(undefined)}
          >
            Remove
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
