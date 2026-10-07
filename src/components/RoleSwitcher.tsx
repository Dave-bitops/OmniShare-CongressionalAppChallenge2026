import { useEffect, useRef, useState } from 'react';
import { ChevronDown, HandHeart, Truck, Building2, Check } from 'lucide-react';
import type { Role } from '@/types';

const ROLES: { id: Role; label: string; sublabel: string; icon: typeof HandHeart }[] = [
  { id: 'donor', label: 'Donor', sublabel: 'Post donations', icon: HandHeart },
  { id: 'driver', label: 'Driver (Volunteer)', sublabel: 'Deliver routes', icon: Truck },
  { id: 'recipient', label: 'Recipient Dashboard', sublabel: 'Shelters & schools', icon: Building2 },
];

export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ROLES.find((r) => r.id === role)!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
          <CurrentIcon className="h-4 w-4" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-sm font-semibold leading-tight text-slate-900">
            {current.label}
          </span>
          <span className="block text-xs leading-tight text-slate-500">{current.sublabel}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Switch role
            </p>
          </div>
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = r.id === role;
            return (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-50 ${
                  active ? 'bg-slate-50' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{r.label}</span>
                  <span className="block text-xs text-slate-500">{r.sublabel}</span>
                </span>
                {active && <Check className="h-4 w-4 text-slate-900" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
