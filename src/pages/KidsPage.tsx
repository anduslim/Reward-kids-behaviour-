import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, type NewKidInput } from '../store/useStore';
import type { Gender, Kid } from '../types';
import { AvatarView } from '../components/AvatarView';
import { EmptyState, PageHeader } from '../components/Layout';
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
  const { requirePin } = useParentGate();

  const [editing, setEditing] = useState<Kid | 'new' | null>(null);

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
        <div className="grid gap-3 sm:grid-cols-2">
          {kids.map((kid) => (
            <div key={kid.id} className="card flex items-center gap-3 p-4">
              <AvatarView config={kid.avatar} size={64} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold text-slate-800">
                  {kid.name}
                </div>
                <div className="text-sm text-slate-500">
                  ★ {kid.starBalance} · {ageFrom(kid.birthday)}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <KidForm
          kid={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => {
            if (editing === 'new') addKid(data);
            else updateKid(editing.id, data);
            setEditing(null);
          }}
        />
      )}
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="card w-full max-w-md rounded-b-none p-6 sm:rounded-3xl">
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
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`btn flex-1 !py-2 text-sm ring-1 ${
                    gender === g.value
                      ? 'bg-grape-500 text-white ring-grape-500'
                      : 'bg-white text-slate-600 ring-slate-200'
                  }`}
                >
                  {g.label}
                </button>
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
      </div>
    </div>
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
