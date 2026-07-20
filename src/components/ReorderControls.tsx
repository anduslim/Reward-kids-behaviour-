/** Compact up/down control to move a card earlier/later in its list. */
export function ReorderControls({
  onUp,
  onDown,
  isFirst,
  isLast,
  label,
}: {
  onUp: () => void;
  onDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  label: string;
}) {
  const btn =
    'flex h-5 w-6 items-center justify-center rounded-md text-[11px] leading-none text-slate-400 ' +
    'transition hover:bg-slate-100 hover:text-slate-600 active:scale-90 ' +
    'disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-transparent';
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <button
        type="button"
        className={btn}
        disabled={isFirst}
        onClick={onUp}
        aria-label={`Move ${label} up`}
        title="Move up"
      >
        ▲
      </button>
      <button
        type="button"
        className={btn}
        disabled={isLast}
        onClick={onDown}
        aria-label={`Move ${label} down`}
        title="Move down"
      >
        ▼
      </button>
    </div>
  );
}
