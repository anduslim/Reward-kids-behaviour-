import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import type { Behaviour } from '../types';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { ImageUpload } from '../components/ImageUpload';
import { EmptyState, PageHeader } from '../components/Layout';
import { ModalShell, staggerChild, staggerParent } from '../components/motion';
import { ReorderControls } from '../components/ReorderControls';
import { useParentGate } from '../components/ParentGate';
import { clampStars, starLabel } from '../lib/stars';

const EMOJI_CHOICES = ['⭐', '🪥', '👕', '🩳', '🚽', '🍽️', '😴', '🧸', '🧺', '🏠', '📚', '🧼', '🙋', '💧'];

export function BehavioursPage() {
  const behaviours = useStore((s) => s.behaviours);
  const addBehaviour = useStore((s) => s.addBehaviour);
  const updateBehaviour = useStore((s) => s.updateBehaviour);
  const deleteBehaviour = useStore((s) => s.deleteBehaviour);
  const moveBehaviour = useStore((s) => s.moveBehaviour);
  const { requirePin } = useParentGate();
  const [editing, setEditing] = useState<Behaviour | 'new' | null>(null);

  return (
    <div>
      <PageHeader
        title="Behaviours"
        subtitle="Good habits that earn stars"
        action={
          <button
            className="btn-primary !py-2"
            onClick={() => requirePin(() => setEditing('new'))}
          >
            + Add
          </button>
        }
      />

      {behaviours.length === 0 ? (
        <EmptyState emoji="✅" title="No behaviours yet" subtitle="Add a good habit to reward." />
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence initial={false}>
            {behaviours.map((b, i) => (
              <motion.div
                key={b.id}
                layout
                variants={staggerChild}
                exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                className="card flex items-center gap-2.5 p-3"
              >
                <ReorderControls
                  onUp={() => requirePin(() => moveBehaviour(b.id, 'up'))}
                  onDown={() => requirePin(() => moveBehaviour(b.id, 'down'))}
                  isFirst={i === 0}
                  isLast={i === behaviours.length - 1}
                  label={b.name}
                />
                {b.imageId ? (
                  <StoredImage
                    imageId={b.imageId}
                    fallback={b.icon}
                    className="h-12 w-12 shrink-0 rounded-2xl"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-grape-50 text-2xl ring-1 ring-slate-100">
                    {b.icon ?? '⭐'}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-extrabold text-slate-800">{b.name}</span>
                    {!b.active && (
                      <span className="rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-400">
                        hidden
                      </span>
                    )}
                  </div>
                  {b.description && (
                    <p className="truncate text-sm text-slate-500">{b.description}</p>
                  )}
                </div>
                <StarBadge value={b.defaultStars} />
                <div className="flex flex-col gap-1">
                  <button
                    className="rounded-xl px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-100 active:scale-90"
                    onClick={() => requirePin(() => setEditing(b))}
                    aria-label={`Edit ${b.name}`}
                  >
                    ✏️
                  </button>
                  <button
                    className="rounded-xl px-2 py-1 text-xs font-bold text-red-400 transition hover:bg-red-50 active:scale-90"
                    onClick={() =>
                      requirePin(() => {
                        if (confirm(`Delete "${b.name}"?`)) deleteBehaviour(b.id);
                      })
                    }
                    aria-label={`Delete ${b.name}`}
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {editing && (
          <BehaviourForm
            key="behaviour-form"
            behaviour={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSubmit={(data) => {
              if (editing === 'new') addBehaviour(data);
              else updateBehaviour(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BehaviourForm({
  behaviour,
  onClose,
  onSubmit,
}: {
  behaviour: Behaviour | null;
  onClose: () => void;
  onSubmit: (data: Omit<Behaviour, 'id'>) => void;
}) {
  const [name, setName] = useState(behaviour?.name ?? '');
  const [description, setDescription] = useState(behaviour?.description ?? '');
  const [icon, setIcon] = useState(behaviour?.icon ?? '⭐');
  const [imageId, setImageId] = useState<string | undefined>(behaviour?.imageId);
  const [defaultStars, setDefaultStars] = useState(behaviour?.defaultStars ?? 1);
  const [active, setActive] = useState(behaviour?.active ?? true);

  return (
    <ModalShell
      onClose={onClose}
      sheet
      className="card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none p-6 sm:rounded-3xl"
    >
      <h2 className="mb-4 text-xl font-extrabold text-slate-800">
        {behaviour ? 'Edit behaviour' : 'Add behaviour'}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name,
            description: description.trim() || undefined,
            icon,
            imageId,
            defaultStars: clampStars(defaultStars),
            active,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="label">Name</label>
          <input
            autoFocus
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Brush teeth"
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div>
          <label className="label">Icon</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((e) => (
              <motion.button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                whileTap={{ scale: 0.85 }}
                animate={{ scale: icon === e ? 1.1 : 1 }}
                className={`h-10 w-10 rounded-xl text-xl ring-2 transition-shadow ${
                  icon === e
                    ? 'bg-brand-50 shadow-sm ring-brand-500'
                    : 'ring-transparent hover:bg-slate-100'
                }`}
              >
                {e}
              </motion.button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Photo (optional, overrides icon)</label>
          <ImageUpload imageId={imageId} fallback={icon} onChange={setImageId} />
        </div>
        <div>
          <label className="label">Default stars</label>
          <StarStepper value={defaultStars} onChange={setDefaultStars} />
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 rounded accent-brand-500"
          />
          Show on the Star Board
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {behaviour ? 'Save' : 'Add'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/** Stepper that moves in 0.5 increments, minimum 0.5. */
export function StarStepper({
  value,
  onChange,
  min = 0.5,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="btn-ghost !h-11 !w-11 !p-0 text-xl"
        onClick={() => onChange(clampStars(value - 0.5, min))}
        aria-label="Fewer stars"
      >
        −
      </button>
      <motion.div
        key={value}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.25 }}
        className="min-w-[4rem] text-center text-2xl font-black text-amber-500"
      >
        {starLabel(value)}★
      </motion.div>
      <button
        type="button"
        className="btn-ghost !h-11 !w-11 !p-0 text-xl"
        onClick={() => onChange(clampStars(value + 0.5, min))}
        aria-label="More stars"
      >
        +
      </button>
    </div>
  );
}
