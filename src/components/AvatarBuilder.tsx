import type { AvatarConfig } from '../types';
import { AVATAR_OPTIONS, avatarDataUri, randomAvatar } from '../lib/avatar';
import { AvatarView } from './AvatarView';

type OptionKey = keyof typeof AVATAR_OPTIONS;

const CATEGORIES: Array<{ key: OptionKey; label: string; kind: 'color' | 'style' }> = [
  { key: 'skinColor', label: 'Skin', kind: 'color' },
  { key: 'hair', label: 'Hair style', kind: 'style' },
  { key: 'hairColor', label: 'Hair color', kind: 'color' },
  { key: 'eyes', label: 'Eyes', kind: 'style' },
  { key: 'mouth', label: 'Mouth', kind: 'style' },
  { key: 'glasses', label: 'Glasses', kind: 'style' },
  { key: 'backgroundColor', label: 'Background', kind: 'color' },
];

/** Kahoot-style layered avatar builder. */
export function AvatarBuilder({
  value,
  onChange,
}: {
  value: AvatarConfig;
  onChange: (next: AvatarConfig) => void;
}) {
  const set = (key: OptionKey, option: string) => onChange({ ...value, [key]: option });

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center gap-3">
        <AvatarView config={value} size={140} ring />
        <button
          type="button"
          className="btn-ghost !py-2 text-sm"
          onClick={() => onChange(randomAvatar())}
        >
          🎲 Surprise me
        </button>
      </div>

      {CATEGORIES.map((cat) => (
        <div key={cat.key}>
          <div className="label">{cat.label}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {AVATAR_OPTIONS[cat.key].map((option) => {
              const selected = value[cat.key] === option;
              if (cat.kind === 'color') {
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => set(cat.key, option)}
                    className={`h-10 w-10 shrink-0 rounded-full ring-2 transition ${
                      selected ? 'ring-brand-500 ring-offset-2' : 'ring-slate-200'
                    }`}
                    style={{ backgroundColor: `#${option}` }}
                    aria-label={`${cat.label} ${option}`}
                  />
                );
              }
              // style preview: render a mini avatar varying just this attribute
              const preview = avatarDataUri({ ...value, [cat.key]: option });
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => set(cat.key, option)}
                  className={`shrink-0 rounded-2xl p-0.5 ring-2 transition ${
                    selected ? 'ring-brand-500' : 'ring-slate-200'
                  }`}
                  aria-label={`${cat.label} ${option}`}
                >
                  <img src={preview} width={48} height={48} alt="" className="rounded-xl" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
