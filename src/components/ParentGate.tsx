import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useStore } from '../store/useStore';
import { hashPin, verifyPin } from '../lib/pin';

interface GateContextValue {
  /** Run an action, prompting for the parent PIN first if the gate is locked. */
  requirePin: (action: () => void) => void;
  unlocked: boolean;
  lock: () => void;
}

const GateContext = createContext<GateContextValue | null>(null);

type Mode = 'enter' | 'create';

export function ParentGateProvider({ children }: { children: ReactNode }) {
  const pinHash = useStore((s) => s.pinHash);
  const setPinHash = useStore((s) => s.setPinHash);

  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('enter');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const pendingAction = useRef<(() => void) | null>(null);

  const runPending = useCallback(() => {
    const fn = pendingAction.current;
    pendingAction.current = null;
    setOpen(false);
    setPin('');
    setConfirm('');
    setError('');
    fn?.();
  }, []);

  const requirePin = useCallback(
    (action: () => void) => {
      if (unlocked) {
        action();
        return;
      }
      pendingAction.current = action;
      setMode(pinHash ? 'enter' : 'create');
      setPin('');
      setConfirm('');
      setError('');
      setOpen(true);
    },
    [unlocked, pinHash],
  );

  const lock = useCallback(() => setUnlocked(false), []);

  const submit = useCallback(async () => {
    if (mode === 'create') {
      if (pin.length < 4) return setError('Use at least 4 digits');
      if (pin !== confirm) return setError('PINs do not match');
      const hash = await hashPin(pin);
      setPinHash(hash);
      setUnlocked(true);
      runPending();
      return;
    }
    // enter mode
    if (!pinHash) return;
    const ok = await verifyPin(pin, pinHash);
    if (!ok) {
      setError('Wrong PIN, try again');
      setPin('');
      return;
    }
    setUnlocked(true);
    runPending();
  }, [mode, pin, confirm, pinHash, setPinHash, runPending]);

  return (
    <GateContext.Provider value={{ requirePin, unlocked, lock }}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="mb-1 text-center text-4xl">🔒</div>
            <h2 className="text-center text-xl font-extrabold text-slate-800">
              {mode === 'create' ? 'Create Parent PIN' : 'Parent PIN'}
            </h2>
            <p className="mb-4 text-center text-sm text-slate-500">
              {mode === 'create'
                ? 'Set a PIN to protect grown-up actions.'
                : 'Enter your PIN to continue.'}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <input
                autoFocus
                className="input text-center text-2xl tracking-[0.5em]"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="••••"
                aria-label="PIN"
              />
              {mode === 'create' && (
                <input
                  className="input mt-3 text-center text-2xl tracking-[0.5em]"
                  type="password"
                  inputMode="numeric"
                  value={confirm}
                  onChange={(e) =>
                    setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))
                  }
                  placeholder="Confirm"
                  aria-label="Confirm PIN"
                />
              )}
              {error && (
                <p className="mt-2 text-center text-sm font-bold text-red-500">{error}</p>
              )}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="btn-ghost flex-1"
                  onClick={() => {
                    pendingAction.current = null;
                    setOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {mode === 'create' ? 'Save' : 'Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </GateContext.Provider>
  );
}

export function useParentGate(): GateContextValue {
  const ctx = useContext(GateContext);
  if (!ctx) throw new Error('useParentGate must be used within ParentGateProvider');
  return ctx;
}
