import { useEffect, useState } from 'react';
import { getImageBlob } from '../lib/images';

/**
 * Renders an image stored in IndexedDB by key. Falls back to an emoji/icon
 * when no image is present. Object URLs are revoked on unmount.
 */
export function StoredImage({
  imageId,
  fallback,
  className = '',
}: {
  imageId?: string;
  fallback?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!imageId) {
      setUrl(null);
      return;
    }
    getImageBlob(imageId).then((blob) => {
      if (!active || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageId]);

  if (url) {
    return <img src={url} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
      <span className="text-4xl">{fallback ?? '🖼️'}</span>
    </div>
  );
}
