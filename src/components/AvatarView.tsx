import { useMemo } from 'react';
import type { AvatarConfig } from '../types';
import { avatarDataUri } from '../lib/avatar';

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
  const uri = useMemo(() => avatarDataUri(config), [config]);
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
