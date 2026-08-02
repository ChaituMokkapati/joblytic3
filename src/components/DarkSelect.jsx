import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Dark-themed custom select — avoids OS-native dropdown clipping / blue highlight.
 * options: string[] or { value, label }[]
 */
export default function DarkSelect({
  value,
  onChange,
  options = [],
  label,
  className = '',
  menuClassName = '',
  placeholder = 'Select…'
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const normalized = options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : { value: o.value, label: o.label ?? o.value }
  );
  const selected = normalized.find((o) => o.value === value);
  const display = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative min-w-[9.5rem] ${className}`}>
      {label ? (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-slate-500 pointer-events-none z-[1]">
          {label}
        </span>
      ) : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`w-full h-10 bg-slate-950 border rounded-xl text-xs text-left text-slate-100 flex items-center justify-between gap-2 focus:outline-none transition ${
          open ? 'border-amber-500/50' : 'border-slate-700 hover:border-slate-500'
        } ${label ? 'pl-14 pr-3' : 'px-3'}`}
      >
        <span className="truncate font-medium">{display}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          className={`absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/50 py-1 ${menuClassName}`}
        >
          {normalized.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition ${
                  active
                    ? 'bg-amber-500/15 text-amber-300'
                    : 'text-slate-200 hover:bg-slate-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
