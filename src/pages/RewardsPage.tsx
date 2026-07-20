import { useEffect, useRef, useState } from 'react';
import { useStore, useSelectedKid } from '../store/useStore';
import type { Reward } from '../types';
import { AvatarView } from '../components/AvatarView';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { ImageUpload } from '../components/ImageUpload';
import { EmptyState, PageHeader } from '../components/Layout';
import { StarStepper } from './BehavioursPage';
import { useParentGate } from '../components/ParentGate';
import { useCelebration } from '../components/Celebration';
import { clampStars, starLabel } from '../lib/stars';

const REWARD_EMOJIS = ['🎁', '📚', '🍦', '🎬', '🛝', '🍭', '🎮', '🧩', '🚲', '🎨', '🍕', '🦸'];

export function RewardsPage() {
  const rewards = useStore((s) => s.rewards);
  const kids = useStore((s) => s.kids);
  const selectKid = useStore((s) => s.selectKid);
  const addReward = useStore((s) => s.addReward);
  const updateReward = useStore((s) => s.updateReward);
  const deleteReward = useStore((s) => s.deleteReward);
  const redeemReward = useStore((s) => s.redeemReward);
  const kid = useSelectedKid();
  const { requirePin } = useParentGate();
  const { burst, celebrate } = useCelebration();

  const [editing, setEditing] = useState<Reward | 'new' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout>>();

  const flash = (text: string) => {
    setMessage(text);
    clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(null), 2500);
  };
  useEffect(() => () => clearTimeout(msgTimer.current), []);

  const handleRedeem = (reward: Reward) => {
    if (!kid) return;
    requirePin(() => {
      const res = redeemReward(kid.id, reward.id);
      if (res.ok) {
        burst();
        if (res.newly?.length) celebrate(res.newly);
        flash(`${kid.name} redeemed "${reward.name}"! 🎉`);
      } else if (res.reason === 'insufficient') {
        flash(`Not enough stars for "${reward.name}".`);
      } else if (res.reason === 'outofstock') {
        flash(`"${reward.name}" is out of stock.`);
      } else {
        flash(`"${reward.name}" is no longer available.`);
      }
    });
  };

  return (
    <div>
      <PageHeader
        title="Wishlist Rewards"
        subtitle="Trade stars for treats"
        action={
          <button
            className="btn-grape !py-2"
            onClick={() => requirePin(() => setEditing('new'))}
          >
            + Add
          </button>
        }
      />

      {/* Kid selector + balance */}
      {kid && (
        <div className="mb-4 flex items-center gap-3">
          {kids.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {kids.map((k) => (
                <button key={k.id} onClick={() => selectKid(k.id)}>
                  <AvatarView
                    config={k.avatar}
                    size={44}
                    ring={k.id === kid.id}
                    className={k.id === kid.id ? '' : 'opacity-60'}
                  />
                </button>
              ))}
            </div>
          )}
          <div className="ml-auto">
            <StarBadge value={kid.starBalance} className="text-base" />
          </div>
        </div>
      )}

      {message && (
        <div className="card mb-4 bg-grape-500 px-4 py-3 text-center font-bold text-white">
          {message}
        </div>
      )}

      {rewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="No rewards yet"
          subtitle="Add rewards your kids can save up their stars for."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rewards.map((r) => {
            const affordable = kid ? kid.starBalance >= r.starCost : false;
            const inStock = r.quantity > 0;
            const canRedeem = affordable && inStock && !!kid;
            const shortBy = kid ? clampStars(r.starCost - kid.starBalance) : r.starCost;
            return (
              <div key={r.id} className="card overflow-hidden">
                <div className="relative h-32 w-full bg-slate-100">
                  {r.imageId ? (
                    <StoredImage
                      imageId={r.imageId}
                      fallback={r.icon}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl">
                      {r.icon ?? '🎁'}
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {inStock ? `${r.quantity} left` : 'Out of stock'}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-extrabold text-slate-800">{r.name}</div>
                      {r.description && (
                        <p className="text-sm text-slate-500">{r.description}</p>
                      )}
                    </div>
                    <StarBadge value={r.starCost} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="btn-grape flex-1 !py-2 text-sm"
                      disabled={!canRedeem}
                      onClick={() => handleRedeem(r)}
                    >
                      {!inStock
                        ? 'Out of stock'
                        : affordable
                          ? 'Redeem'
                          : `Need ${starLabel(shortBy)}★ more`}
                    </button>
                    <button
                      className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
                      onClick={() => requirePin(() => setEditing(r))}
                    >
                      ✏️
                    </button>
                    <button
                      className="rounded-lg px-2 py-1 text-red-400 hover:bg-red-50"
                      onClick={() =>
                        requirePin(() => {
                          if (confirm(`Delete "${r.name}"?`)) deleteReward(r.id);
                        })
                      }
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <RewardForm
          reward={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => {
            if (editing === 'new') addReward(data);
            else updateReward(editing.id, data);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function RewardForm({
  reward,
  onClose,
  onSubmit,
}: {
  reward: Reward | null;
  onClose: () => void;
  onSubmit: (data: Omit<Reward, 'id'>) => void;
}) {
  const [name, setName] = useState(reward?.name ?? '');
  const [description, setDescription] = useState(reward?.description ?? '');
  const [icon, setIcon] = useState(reward?.icon ?? '🎁');
  const [imageId, setImageId] = useState<string | undefined>(reward?.imageId);
  const [starCost, setStarCost] = useState(reward?.starCost ?? 5);
  const [quantity, setQuantity] = useState(reward?.quantity ?? 1);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none p-6 sm:rounded-3xl">
        <h2 className="mb-4 text-xl font-extrabold text-slate-800">
          {reward ? 'Edit reward' : 'Add reward'}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name,
              description: description.trim() || undefined,
              icon,
              imageId,
              starCost: clampStars(starCost),
              quantity: Math.max(0, Math.floor(quantity)),
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
              placeholder="e.g. Ice cream treat"
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
              {REWARD_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon(e)}
                  className={`h-10 w-10 rounded-xl text-xl ring-2 ${
                    icon === e ? 'ring-grape-500' : 'ring-transparent hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Photo (optional, overrides icon)</label>
            <ImageUpload imageId={imageId} fallback={icon} onChange={setImageId} />
          </div>
          <div>
            <label className="label">Star cost</label>
            <StarStepper value={starCost} onChange={setStarCost} />
          </div>
          <div>
            <label className="label">Quantity available</label>
            <input
              className="input"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-grape flex-1">
              {reward ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
