import { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Truck,
  ArrowRight,
  Package,
  Flame,
  Bell,
  Inbox,
  CheckCircle2,
  User,
  Trash2,
  Gift,
  X,
} from 'lucide-react';
import type { Category, DonationOrder, ShelterRequest, Urgency } from '@/types';
import { CATEGORIES, SAM_SHELTER_ID, SAM_SHELTER_NAME } from '@/data';
import { CategoryBadge, StatusBadge, UrgencyBadge } from './Badges';
import { EmptyState } from './EmptyState';

interface Props {
  orders: DonationOrder[];
  shelterRequests: ShelterRequest[];
  directorName: string;
  onAddRequest: (req: ShelterRequest) => void;
  onDeleteRequest: (id: string) => void;
  onDismissDelivered: (id: string) => void;
}

const EMPTY_FORM = {
  category: 'Food' as Category,
  items_needed: '',
  delivery_address: '',
  urgency: 'Standard' as Urgency,
};

export function RecipientView({
  orders,
  shelterRequests,
  directorName,
  onAddRequest,
  onDeleteRequest,
  onDismissDelivered,
}: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [justAdded, setJustAdded] = useState(false);

  // Only In Transit orders appear on the incoming board.
  const incoming = orders.filter((o) => o.status === 'In Transit');
  const delivered = orders.filter((o) => o.status === 'Delivered' && !o.dismissed_by_shelter);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.items_needed || !form.delivery_address) return;
    onAddRequest({
      id: `req-${Date.now()}`,
      shelter_id: SAM_SHELTER_ID,
      shelter_name: SAM_SHELTER_NAME,
      category: form.category,
      items_needed: form.items_needed,
      delivery_address: form.delivery_address,
      urgency: form.urgency,
      active: true,
      fulfilled: false,
    });
    setForm(EMPTY_FORM);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Building2 className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Shelter Director Dashboard</h2>
        </div>
        <p className="text-sm text-slate-500">
          Post resource requests for {SAM_SHELTER_NAME} and track deliveries en route.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left: form + requests */}
        <div className="space-y-6 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Plus className="h-5 w-5 text-slate-700" />
              <h3 className="text-base font-semibold text-slate-900">+ Create Request</h3>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Item Category
                  </span>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Delivery Address
                  </span>
                  <input
                    value={form.delivery_address}
                    onChange={(e) => setForm({ ...form, delivery_address: e.target.value })}
                    placeholder="Enter delivery address"
                    className="input"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Specific Items Needed
                </span>
                <textarea
                  value={form.items_needed}
                  onChange={(e) => setForm({ ...form, items_needed: e.target.value })}
                  placeholder="e.g. Canned goods, rice, cooking oil for 80 families"
                  rows={3}
                  className="input resize-none"
                  required
                />
              </label>

              <div>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Urgency Level
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['High', 'Standard'] as Urgency[]).map((u) => {
                    const active = form.urgency === u;
                    const Icon = u === 'High' ? Flame : Bell;
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, urgency: u })}
                        className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                          active
                            ? u === 'High'
                              ? 'border-red-300 bg-red-50 text-red-700'
                              : 'border-slate-300 bg-slate-50 text-slate-700'
                            : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {u} Priority
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.99]"
              >
                <Plus className="h-4 w-4" />
                Post Shelter Request
              </button>

              {justAdded && (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Shelter request posted. New donations in this category will auto-match to you.
                </div>
              )}
            </form>
          </div>

          {/* Active requests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Inbox className="h-5 w-5 text-slate-700" />
              <h3 className="text-base font-semibold text-slate-900">Active Shelter Requests</h3>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {shelterRequests.filter((r) => r.active && !r.fulfilled).length}
              </span>
            </div>
            {shelterRequests.length === 0 ? (
              <EmptyState icon={Inbox} title="No active requests yet." hint="Create one using the form above." />
            ) : (
              <div className="space-y-3">
                {shelterRequests.map((r) => {
                  const matched = orders.some(
                    (o) => o.matched_request_id === r.id && o.status !== 'Delivered'
                  );
                  return (
                    <div
                      key={r.id}
                      className="group rounded-xl border border-slate-200 p-4 transition hover:border-slate-300"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{r.shelter_name}</p>
                          <p className="text-xs text-slate-500">{r.items_needed}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <CategoryBadge category={r.category} />
                          <UrgencyBadge urgency={r.urgency} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {r.delivery_address || 'No address set'}
                        </p>
                        <button
                          onClick={() => onDeleteRequest(r.id)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: incoming + delivered */}
        <div className="space-y-6 lg:col-span-2">
          {/* Incoming */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Truck className="h-5 w-5 text-sky-600" />
              <h3 className="text-base font-semibold text-slate-900">Incoming Deliveries</h3>
              <span className="ml-auto rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {incoming.length}
              </span>
            </div>

            {incoming.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No deliveries currently in transit."
                hint="Orders appear here the moment a driver confirms pickup."
              />
            ) : (
              <div className="space-y-3">
                {incoming.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 transition hover:border-sky-300"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{o.title}</h4>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mb-2">
                      <CategoryBadge category={o.category} />
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {o.pickup_address}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <ArrowRight className="h-3 w-3" /> {o.delivery_address}
                      </p>
                      <p className="flex items-center gap-1.5 font-medium text-amber-600">
                        <User className="h-3 w-3" /> Driver: {o.driver_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivered */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Gift className="h-5 w-5 text-green-600" />
              <h3 className="text-base font-semibold text-slate-900">Delivered</h3>
              <span className="ml-auto rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                {delivered.length}
              </span>
            </div>

            {delivered.length === 0 ? (
              <EmptyState icon={Gift} title="No delivered items yet." hint="Completed deliveries will appear here." />
            ) : (
              <div className="space-y-3">
                {delivered.map((o) => (
                  <div
                    key={o.id}
                    className="group rounded-xl border border-green-200 bg-green-50/40 p-4 transition hover:border-green-300"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{o.title}</h4>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mb-2">
                      <CategoryBadge category={o.category} />
                    </div>
                    <div className="space-y-1 text-xs text-slate-500">
                      <p className="flex items-center gap-1.5 font-medium text-amber-600">
                        <User className="h-3 w-3" /> Driver: {o.driver_name}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {o.delivery_address}
                      </p>
                    </div>
                    <button
                      onClick={() => onDismissDelivered(o.id)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
