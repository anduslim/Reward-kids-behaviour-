import { useRef, useState } from 'react';
import { get, set } from 'idb-keyval';
import { useStore } from '../store/useStore';
import { PageHeader } from '../components/Layout';
import { useParentGate } from '../components/ParentGate';
import { hashPin } from '../lib/pin';
import { sweepOrphanImages } from '../lib/images';

/** Delete image blobs no longer referenced by the current (post-change) state. */
function sweepNow() {
  const { behaviours, rewards } = useStore.getState();
  const referenced = [...behaviours, ...rewards]
    .map((x) => x.imageId)
    .filter((x): x is string => Boolean(x));
  void sweepOrphanImages(referenced);
}

export function SettingsPage() {
  const state = useStore();
  const { requirePin, lock } = useParentGate();
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  };

  const changePin = () =>
    requirePin(async () => {
      const pin = prompt('Enter a new parent PIN (4-8 digits):');
      if (!pin) return;
      if (!/^\d{4,8}$/.test(pin)) return flash('PIN must be 4-8 digits.');
      state.setPinHash(await hashPin(pin));
      flash('PIN updated. ✓');
    });

  const removePin = () =>
    requirePin(() => {
      state.setPinHash(undefined);
      lock();
      flash('PIN removed.');
    });

  const exportData = () =>
    requirePin(async () => {
      const { schemaVersion, kids, behaviours, rewards, ledger, unlockedAchievements } =
        useStore.getState();
      // Bundle referenced images from IndexedDB as data URLs.
      const imageIds = [
        ...behaviours.map((b) => b.imageId),
        ...rewards.map((r) => r.imageId),
      ].filter((x): x is string => Boolean(x));
      const images: Record<string, string> = {};
      for (const id of imageIds) {
        const blob = await get<Blob>(id);
        if (blob) images[id] = await blobToDataUrl(blob);
      }
      const payload = {
        app: 'star-kids',
        schemaVersion,
        exportedAt: new Date().toISOString(),
        state: { kids, behaviours, rewards, ledger, unlockedAchievements },
        images,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `star-kids-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash('Backup downloaded. ✓');
    });

  const importData = (file?: File) => {
    if (!file) return;
    requirePin(async () => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (parsed.app !== 'star-kids' || !isValidState(parsed.state)) {
          throw new Error('bad file');
        }
        // Restore all images to IndexedDB first, and wait for every write to land
        // before swapping state so components never read a missing blob.
        if (parsed.images && typeof parsed.images === 'object') {
          await Promise.all(
            Object.entries<string>(parsed.images).map(([id, dataUrl]) =>
              dataUrlToBlob(dataUrl).then((blob) => set(id, blob)),
            ),
          );
        }
        const { kids, behaviours, rewards, ledger, unlockedAchievements } = parsed.state;
        state.replaceAll({ kids, behaviours, rewards, ledger, unlockedAchievements });
        sweepNow(); // drop blobs from the pre-import state that are now unreferenced
        flash('Backup restored. ✓');
      } catch {
        flash('Could not read that file.');
      } finally {
        if (fileRef.current) fileRef.current.value = ''; // allow re-importing the same file
      }
    });
  };

  const resetAll = () =>
    requirePin(() => {
      if (confirm('Erase ALL kids, stars and history? This cannot be undone.')) {
        state.resetAll();
        sweepNow(); // remove all now-unreferenced image blobs
        flash('Everything reset.');
      }
    });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Parent controls & backups" />

      {status && (
        <div className="card mb-4 bg-brand-500 px-4 py-3 text-center font-bold text-white">
          {status}
        </div>
      )}

      <Section title="Parent PIN" emoji="🔒">
        <p className="mb-3 text-sm text-slate-500">
          The PIN protects grown-up actions like awarding stars, redeeming rewards, and
          editing lists.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !py-2 text-sm" onClick={changePin}>
            {state.pinHash ? 'Change PIN' : 'Set PIN'}
          </button>
          {state.pinHash && (
            <>
              <button className="btn-ghost !py-2 text-sm" onClick={lock}>
                Lock now
              </button>
              <button
                className="btn-ghost !py-2 text-sm text-red-500"
                onClick={removePin}
              >
                Remove PIN
              </button>
            </>
          )}
        </div>
      </Section>

      <Section title="Backup & restore" emoji="💾">
        <p className="mb-3 text-sm text-slate-500">
          All data lives on this device. Export a backup file to keep it safe or move it to
          another device.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-grape !py-2 text-sm" onClick={exportData}>
            ⬇️ Export backup
          </button>
          <button
            className="btn-ghost !py-2 text-sm"
            onClick={() => requirePin(() => fileRef.current?.click())}
          >
            ⬆️ Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importData(e.target.files?.[0])}
          />
        </div>
      </Section>

      <Section title="Danger zone" emoji="⚠️">
        <button className="btn !py-2 text-sm bg-red-500 text-white" onClick={resetAll}>
          Reset everything
        </button>
      </Section>

      <p className="mt-6 text-center text-xs text-slate-400">
        Star Kids · data stored locally in your browser
      </p>
    </div>
  );
}

function Section({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card mb-4 p-5">
      <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800">
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

/** Minimal shape check so a malformed backup can't persist a state that crashes the app. */
function isValidState(s: unknown): boolean {
  if (!s || typeof s !== 'object') return false;
  const v = s as Record<string, unknown>;
  return (
    Array.isArray(v.kids) &&
    Array.isArray(v.behaviours) &&
    Array.isArray(v.rewards) &&
    Array.isArray(v.ledger) &&
    !!v.unlockedAchievements &&
    typeof v.unlockedAchievements === 'object'
  );
}
