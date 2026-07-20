import { useMemo } from 'react';
import type { AvatarConfig } from '../types';
import { avatarDataUri, DEFAULT_AVATAR } from '../lib/avatar';

export function AvatarView({
  config,
  size = 64,
  className = '',
  ring = false,
}: {
  config: AvatarConfig;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  // Guard against a missing/corrupted config so a bad profile can't white-screen the app.
  const uri = useMemo(() => avatarDataUri(config ?? DEFAULT_AVATAR), [config]);
  return (
    <img
      src={uri}
      width={size}
      height={size}
      alt="avatar"
      className={`rounded-full bg-white object-cover ${
        ring ? 'ring-4 ring-brand-400' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
