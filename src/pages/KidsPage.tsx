import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, type NewKidInput } from '../store/useStore';
import { useLeaderboard } from '../store/useLeaderboard';
import type { Gender, Kid } from '../types';
import { AvatarView } from '../components/AvatarView';
import { EmptyState, PageHeader } from '../components/Layout';
import { ModalShell, staggerChild, staggerParent } from '../components/motion';
import { useParentGate } from '../components/ParentGate';
import { randomAvatar } from '../lib/avatar';

const GENDERS: Array<{ value: Gender; label: string }> = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
  { value: 'other', label: 'Other' },
];

export function KidsPage() {
  const kids = useStore((s) => s.kids);
  const addKid = useStore((s) => s.addKid);
  const updateKid = useStore((s) => s.updateKid);
  const deleteKid = useStore((s) => s.deleteKid);
  const leaderboardEnabled = useStore((s) => s.leaderboardEnabled);
  const syncKids = useLeaderboard((s) => s.syncKids);
  const { requirePin } = useParentGate();

  const [editing, setEditing] = useState<Kid | 'new' | null>(null);

  const toggleShare = (kid: Kid) =>
    requirePin(() => {
      updateKid(kid.id, { sharedInGroup: !kid.sharedInGroup });
      void syncKids();
    });

  return (
    <div>
      <PageHeader
        title="Kids"
        subtitle="Add a profile for each child"
        action={
          <button className="btn-primary !py-2" onClick={() => setEditing('new')}>
            + Add kid
          </button>
        }
      />

      {kids.length === 0 ? (
        <EmptyState
          emoji="👶"
          title="No kids yet"
          subtitle="Add your first child to start rewarding good behaviours."
          action={
            <button className="btn-primary" onClick={() => setEditing('new')}>
              + Add kid
            </button>
          }
        />
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2"
        >
          <AnimatePresence initial={false}>
            {kids.map((kid) => (
              <motion.div
                key={kid.id}
                layout
                variants={staggerChild}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
                whileHover={{ y: -2 }}
                className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-card-hover"
              >
                <AvatarView config={kid.avatar} size={64} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-extrabold text-slate-800">
                    {kid.name}
                  </div>
                  <div className="text-sm font-semibold text-slate-500">
                    <span className="text-amber-400">★</span> {kid.starBalance}
                    {ageFrom(kid.birthday) && ` · ${ageFrom(kid.birthday)}`}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to={`/kids/${kid.id}/avatar`}
                      className="btn-ghost !px-3 !py-1.5 text-xs"
                    >
                      🎨 Avatar
                    </Link>
                    <button
                      className="btn-ghost !px-3 !py-1.5 text-xs"
                      onClick={() => requirePin(() => setEditing(kid))}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn-ghost !px-3 !py-1.5 text-xs text-red-500"
                      onClick={() =>
                        requirePin(() => {
                          if (confirm(`Remove ${kid.name}? This deletes their stars too.`))
                            deleteKid(kid.id);
                        })
                      }
                    >
                      🗑️ Remove
                    </button>
                    {leaderboardEnabled && (
                      <button
                        className={`btn-ghost !px-3 !py-1.5 text-xs ${
                          kid.sharedInGroup ? '!bg-brand-50 !text-brand-600 !ring-brand-200' : ''
                        }`}
                        onClick={() => toggleShare(kid)}
                        aria-pressed={!!kid.sharedInGroup}
                        title="Show this kid on the family leaderboard"
                      >
                        {kid.sharedInGroup ? '🏆 Shared' : '🏆 Share'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {editing && (
          <KidForm
            key="kid-form"
            kid={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSubmit={(data) => {
              if (editing === 'new') addKid(data);
              else updateKid(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function KidForm({
  kid,
  onClose,
  onSubmit,
}: {
  kid: Kid | null;
  onClose: () => void;
  onSubmit: (data: NewKidInput) => void;
}) {
  const [name, setName] = useState(kid?.name ?? '');
  const [birthday, setBirthday] = useState(kid?.birthday ?? '');
  const [gender, setGender] = useState<Gender>(kid?.gender ?? 'boy');

  return (
    <ModalShell
      onClose={onClose}
      sheet
      className="card w-full max-w-md rounded-b-none p-6 sm:rounded-3xl"
    >
      <h2 className="mb-4 text-xl font-extrabold text-slate-800">
        {kid ? 'Edit kid' : 'Add kid'}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // For an edit, omit `avatar` entirely — never send `avatar: undefined`,
          // which would overwrite (and wipe) the kid's existing avatar.
          onSubmit(
            kid
              ? { name, birthday, gender }
              : { name, birthday, gender, avatar: randomAvatar() },
          );
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
            placeholder="e.g. Mia"
            required
          />
        </div>
        <div>
          <label className="label">Birthday</label>
          <input
            className="input"
            type="date"
            value={birthday}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthday(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Gender</label>
          <div className="flex gap-2">
            {GENDERS.map((g) => (
              <motion.button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                whileTap={{ scale: 0.94 }}
                className={`btn flex-1 !py-2 text-sm ring-1 ${
                  gender === g.value
                    ? 'bg-gradient-to-b from-grape-400 to-grape-500 text-white shadow-pop-grape ring-grape-500'
                    : 'bg-white text-slate-600 ring-slate-200 hover:ring-grape-300'
                }`}
              >
                {g.label}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            {kid ? 'Save' : 'Add kid'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ageFrom(birthday: string): string {
  if (!birthday) return '';
  const b = new Date(birthday);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age >= 0 ? `${age} yrs` : '';
}
