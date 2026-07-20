import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore, useSelectedKid } from '../store/useStore';
import type { Reward } from '../types';
import { AvatarView } from '../components/AvatarView';
import { StarBadge } from '../components/StarBadge';
import { StoredImage } from '../components/StoredImage';
import { ImageUpload } from '../components/ImageUpload';
import { EmptyState, PageHeader } from '../components/Layout';
import { ModalShell, staggerChild, staggerParent } from '../components/motion';
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
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {kids.map((k) => (
                <motion.button key={k.id} onClick={() => selectKid(k.id)} whileTap={{ scale: 0.9 }}>
                  <AvatarView
                    config={k.avatar}
                    size={44}
                    ring={k.id === kid.id}
                    className={k.id === kid.id ? '' : 'opacity-55'}
                  />
                </motion.button>
              ))}
            </div>
          )}
          <div className="ml-auto">
            <StarBadge value={kid.starBalance} className="text-base" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            className="card mb-4 border-none bg-gradient-to-r from-grape-500 to-grape-600 px-4 py-3 text-center font-bold text-white shadow-pop-grape ring-0"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {rewards.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="No rewards yet"
          subtitle="Add rewards your kids can save up their stars for."
        />
      ) : (
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid gap-3 sm:grid-cols-2"
        >
          {rewards.map((r) => {
            const affordable = kid ? kid.starBalance >= r.starCost : false;
            const inStock = r.quantity > 0;
            const canRedeem = affordable && inStock && !!kid;
            const shortBy = kid ? clampStars(r.starCost - kid.starBalance) : r.starCost;
            return (
              <motion.div
                key={r.id}
                variants={staggerChild}
                whileHover={{ y: -3 }}
                className="card overflow-hidden transition-shadow hover:shadow-card-hover"
              >
                <div className="relative h-32 w-full bg-gradient-to-br from-grape-50 to-brand-50">
                  {r.imageId ? (
                    <StoredImage
                      imageId={r.imageId}
                      fallback={r.icon}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl drop-shadow-sm">
                      {r.icon ?? '🎁'}
                    </div>
                  )}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
                      inStock
                        ? 'bg-white/90 text-slate-600'
                        : 'bg-slate-700/80 text-white'
                    }`}
                  >
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
                    <motion.button
                      whileTap={canRedeem ? { scale: 0.95 } : undefined}
                      className="btn-grape flex-1 !py-2 text-sm"
                      disabled={!canRedeem}
                      onClick={() => handleRedeem(r)}
                    >
                      {!inStock
                        ? 'Out of stock'
                        : affordable
                          ? '🎉 Redeem'
                          : `Need ${starLabel(shortBy)}★ more`}
                    </motion.button>
                    <button
                      className="rounded-xl px-2 py-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-90"
                      onClick={() => requirePin(() => setEditing(r))}
                      aria-label={`Edit ${r.name}`}
                    >
                      ✏️
                    </button>
                    <button
                      className="rounded-xl px-2 py-1.5 text-red-400 transition hover:bg-red-50 active:scale-90"
                      onClick={() =>
                        requirePin(() => {
                          if (confirm(`Delete "${r.name}"?`)) deleteReward(r.id);
                        })
                      }
                      aria-label={`Delete ${r.name}`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AnimatePresence>
        {editing && (
          <RewardForm
            key="reward-form"
            reward={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSubmit={(data) => {
              if (editing === 'new') addReward(data);
              else updateReward(editing.id, data);
              setEditing(null);
            }}
          />
        )}
      </AnimatePresence>
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
    <ModalShell
      onClose={onClose}
      sheet
      className="card max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none p-6 sm:rounded-3xl"
    >
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
              <motion.button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                whileTap={{ scale: 0.85 }}
                animate={{ scale: icon === e ? 1.1 : 1 }}
                className={`h-10 w-10 rounded-xl text-xl ring-2 transition-shadow ${
                  icon === e
                    ? 'bg-grape-50 shadow-sm ring-grape-500'
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
    </ModalShell>
  );
}
