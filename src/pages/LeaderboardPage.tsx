import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useLeaderboard } from '../store/useLeaderboard';
import { AvatarView } from '../components/AvatarView';
import { PageHeader, EmptyState } from '../components/Layout';
import { staggerChild, staggerParent } from '../components/motion';
import { useParentGate } from '../components/ParentGate';
import { starLabel } from '../lib/stars';

export function LeaderboardPage() {
  const enabled = useStore((s) => s.leaderboardEnabled);
  const kids = useStore((s) => s.kids);
  const lb = useLeaderboard();
  const { requirePin } = useParentGate();

  // Establish the anon session / restore the group when the page opens.
  useEffect(() => {
    if (enabled && lb.configured) void lb.init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, lb.configured]);

  if (!enabled) {
    return (
      <div>
        <PageHeader title="Leaderboard" subtitle="Private family rankings" />
        <EmptyState
          emoji="🏆"
          title="Leaderboard is off"
          subtitle="Turn on the Family Leaderboard in Settings to compare stars with your family."
          action={
            <Link to="/settings" className="btn-primary">
              Go to Settings
            </Link>
          }
        />
      </div>
    );
  }

  if (!lb.configured) {
    return (
      <div>
        <PageHeader title="Family Leaderboard" subtitle="Almost there" />
        <EmptyState
          emoji="🏆"
          title="Coming soon"
          subtitle="The family leaderboard backend isn’t connected to this build yet. It’s enabled and ready to light up once configured."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Family Leaderboard" subtitle="Private to your group" />
      {lb.error && (
        <div className="card mb-4 border-none bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 ring-1 ring-rose-100">
          {lb.error}
        </div>
      )}
      {!lb.ready ? (
        <ConnectingState />
      ) : lb.groupId ? (
        <InGroup kids={kids} requirePin={requirePin} />
      ) : (
        <NoGroup requirePin={requirePin} />
      )}
    </div>
  );
}

function ConnectingState() {
  return (
    <div className="card flex items-center justify-center gap-3 px-4 py-10 text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500" />
      <span className="font-semibold">Connecting…</span>
    </div>
  );
}

function NoGroup({ requirePin }: { requirePin: (fn: () => void) => void }) {
  const { createGroup, joinGroup, status } = useLeaderboard();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const busy = status === 'loading';

  return (
    <motion.div
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={staggerChild} className="card p-5">
        <h2 className="text-lg font-extrabold text-slate-800">Start a family group</h2>
        <p className="mb-3 text-sm text-slate-500">
          Create a group and share the invite code with family.
        </p>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Group name (e.g. The Lees)"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            className="btn-primary shrink-0"
            disabled={busy}
            onClick={() => requirePin(() => void createGroup(name))}
          >
            Create
          </button>
        </div>
      </motion.div>

      <motion.div variants={staggerChild} className="card p-5">
        <h2 className="text-lg font-extrabold text-slate-800">Join with a code</h2>
        <p className="mb-3 text-sm text-slate-500">Got an invite code? Enter it here.</p>
        <div className="flex gap-2">
          <input
            className="input uppercase tracking-widest"
            placeholder="ABC123"
            value={code}
            maxLength={8}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button
            className="btn-grape shrink-0"
            disabled={busy || code.length < 4}
            onClick={() => requirePin(() => void joinGroup(code))}
          >
            Join
          </button>
        </div>
      </motion.div>

      <p className="px-1 text-center text-xs text-slate-400">
        Only shared kids’ nicknames, avatars and star totals are visible to the group.
      </p>
    </motion.div>
  );
}

function InGroup({
  kids,
  requirePin,
}: {
  kids: ReturnType<typeof useStore.getState>['kids'];
  requirePin: (fn: () => void) => void;
}) {
  const { groupName, inviteCode, entries, userId, leaveGroup, syncKids, refresh } =
    useLeaderboard();
  const [copied, setCopied] = useState(false);
  const sharedCount = useMemo(() => kids.filter((k) => k.sharedInGroup).length, [kids]);

  const medals = ['🥇', '🥈', '🥉'];

  const copy = () => {
    if (!inviteCode) return;
    void navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Group header */}
      <div className="card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-extrabold text-slate-800">{groupName}</div>
          <button
            onClick={copy}
            className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
            title="Copy invite code"
          >
            <span className="tracking-widest">{inviteCode}</span>
            <span>{copied ? '✓' : '📋'}</span>
          </button>
        </div>
        <button
          className="btn-ghost !py-2 text-xs text-red-500"
          onClick={() =>
            requirePin(() => {
              if (confirm('Leave this group? Your kids will be removed from it.'))
                void leaveGroup();
            })
          }
        >
          Leave
        </button>
      </div>

      {sharedCount === 0 && (
        <div className="card border-none bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 ring-1 ring-amber-100">
          None of your kids are shared yet. Turn on “Share on leaderboard” for a kid on the
          Kids page.
        </div>
      )}

      {/* Rankings */}
      {entries.length === 0 ? (
        <EmptyState
          emoji="🏁"
          title="No stars on the board yet"
          subtitle="Once family members share a kid, they’ll appear here ranked by stars."
        />
      ) : (
        <motion.div variants={staggerParent} initial="hidden" animate="show" className="space-y-2.5">
          {entries.map((e, i) => {
            const mine = e.owner_user_id === userId;
            return (
              <motion.div
                key={e.id}
                variants={staggerChild}
                className={`card flex items-center gap-3 p-3 ${
                  mine ? 'ring-2 ring-brand-300' : ''
                }`}
              >
                <span className="w-6 shrink-0 text-center text-lg font-black text-slate-400">
                  {medals[i] ?? i + 1}
                </span>
                <AvatarView config={e.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold text-slate-800">
                    {e.display_name}
                    {mine && <span className="ml-1 text-xs font-bold text-brand-500">· you</span>}
                  </div>
                  {e.current_streak > 0 && (
                    <div className="text-xs font-semibold text-slate-500">
                      🔥 {e.current_streak}-day streak
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-base font-black text-amber-500">
                  {starLabel(e.total_stars)}★
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <div className="flex justify-center gap-2 pt-1">
        <button
          className="btn-ghost !py-2 text-sm"
          onClick={() => {
            void syncKids().then(() => refresh());
          }}
        >
          🔄 Sync my kids
        </button>
      </div>
    </div>
  );
}
