import { useEffect, useRef, useState } from 'react';
import { ChevronDown, HandHeart, Truck, Building2, Check, Pencil, MapPin } from 'lucide-react';
import type { Role } from '@/types';

const ROLES: { id: Role; label: string; sublabel: string; icon: typeof HandHeart }[] = [
  { id: 'donor', label: 'View as Donor', sublabel: 'Post donations', icon: HandHeart },
  { id: 'driver', label: 'View as Driver (Volunteer)', sublabel: 'Deliver routes', icon: Truck },
  { id: 'shelter', label: 'View as Shelter Director', sublabel: 'Manage requests', icon: Building2 },
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
        className="flex items-center gap-2.5 rounded-xl border border-olive-200 bg-cream-50 px-3 py-2 text-left shadow-sm transition hover:border-olive-300 hover:shadow-md"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-olive-800 text-cream-50">
          <CurrentIcon className="h-4 w-4" />
        </span>
        <span className="hidden md:block">
          <span className="block text-sm font-semibold leading-tight text-olive-950">
            {current.label}
          </span>
          <span className="block text-xs leading-tight text-olive-500">{current.sublabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-olive-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-olive-200 bg-cream-50 shadow-xl">
          <div className="border-b border-olive-100 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-olive-400">
              Switch view mode
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
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cream-100 ${
                  active ? 'bg-cream-100' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? 'bg-olive-800 text-cream-50' : 'bg-olive-100 text-olive-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-olive-950">{r.label}</span>
                  <span className="block text-xs text-olive-500">{r.sublabel}</span>
                </span>
                {active && <Check className="h-4 w-4 text-olive-800" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProfileCard({
  name,
  onRename,
  stats,
}: {
  name: string;
  onRename: (n: string) => void;
  stats: { posted: number; delivered: number; received: number };
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const v = draft.trim();
    onRename(v || 'Sam Wheeler');
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-olive-200 bg-cream-50 p-4 shadow-sm">
      {/* Identity */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-olive-600 to-olive-800 text-sm font-bold text-cream-50">
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-olive-400">
            Unified Account
          </p>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') {
                  setDraft(name);
                  setEditing(false);
                }
              }}
              className="w-full rounded-md border border-olive-300 bg-cream-50 px-2 py-0.5 text-sm font-semibold text-olive-950 focus:border-olive-500 focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setDraft(name);
                setEditing(true);
              }}
              className="group flex items-center gap-1.5"
            >
              <span className="truncate text-sm font-bold text-olive-950">{name}</span>
              <Pencil className="h-3 w-3 text-olive-300 transition group-hover:text-olive-500" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip label="Donations Posted" value={stats.posted} tone="olive" />
        <StatChip label="Deliveries Completed" value={stats.delivered} tone="clay" />
        <StatChip label="Resources Received" value={stats.received} tone="cream" />
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'olive' | 'clay' | 'cream';
}) {
  const tones = {
    olive: 'bg-olive-50 text-olive-800',
    clay: 'bg-cream-200 text-clay-600',
    cream: 'bg-cream-100 text-clay-500',
  };
  return (
    <div className={`rounded-lg ${tones[tone]} px-2 py-2 text-center`}>
      <p className="text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-medium leading-tight text-olive-500">{label}</p>
    </div>
  );
}

export function Header({
  role,
  onRoleChange,
  name,
  onRename,
  stats,
}: {
  role: Role;
  onRoleChange: (r: Role) => void;
  name: string;
  onRename: (n: string) => void;
  stats: { posted: number; delivered: number; received: number };
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-olive-200 bg-cream-50/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5 pt-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-800 text-cream-50 shadow-sm">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-olive-950">OmniShare</h1>
            <p className="hidden text-xs text-olive-500 sm:block">
              Washington, DC · Resource Routing
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-start">
          <div className="w-full min-w-[260px] sm:w-auto">
            <ProfileCard name={name} onRename={onRename} stats={stats} />
          </div>
          <RoleSwitcher role={role} onChange={onRoleChange} />
        </div>
      </div>
    </header>
  );
}
