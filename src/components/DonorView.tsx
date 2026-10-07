import { useState } from 'react';
import {
  HandHeart,
  PackagePlus,
  MapPin,
  ArrowRight,
  Clock,
  Snowflake,
  PawPrint,
  Monitor,
  Zap,
  Trash2,
  Flame,
  Info,
  Link2,
  Unlink,
  AlertTriangle,
  Camera,
} from 'lucide-react';
import type { Category, DonationOrder, ShelterRequest } from '@/types';
import { CATEGORIES, formatExpiration } from '@/data';
import { CategoryBadge, StatusBadge, UrgencyBadge } from './Badges';
import { EmptyState } from './EmptyState';
import { PhotoCapture } from './PhotoCapture';

export interface MatchResult {
  matched: boolean;
  shelterName?: string;
  reason?: string;
  deliveryAddress?: string;
}

interface Props {
  orders: DonationOrder[];
  shelterRequests: ShelterRequest[];
  donorName: string;
  onAdd: (order: DonationOrder) => MatchResult;
  onDeleteOrder: (id: string) => void;
}

const EMPTY_FORM = {
  title: '',
  details: '',
  category: 'Food' as Category,
  pickup_address: '',
  expiration_time: '',
  requires_refrigeration: false,
  target_animal: '',
  os: '',
  photos: [] as string[],
};

export function DonorView({ orders, shelterRequests, donorName, onAdd, onDeleteOrder }: Props) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState<MatchResult | null>(null);

  const myOrders = orders.filter((o) => o.donor_name === donorName);
  const urgentRequests = shelterRequests.filter((r) => r.active && r.urgency === 'High');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.pickup_address) return;

    const dynamic_fields: DonationOrder['dynamic_fields'] = {};
    if (form.category === 'Food') {
      dynamic_fields.expiration_time = form.expiration_time || undefined;
      dynamic_fields.requires_refrigeration = form.requires_refrigeration;
    } else if (form.category === 'Pet Supplies') {
      dynamic_fields.target_animal = form.target_animal || undefined;
    } else if (form.category === 'Electronics') {
      dynamic_fields.os = form.os || undefined;
    }

    const order: DonationOrder = {
      id: `ord-${Date.now()}`,
      title: form.title,
      details: form.details,
      category: form.category,
      pickup_address: form.pickup_address,
      dynamic_fields,
      photos: form.photos,
      status: 'Available',
      driver_name: null,
      matched_shelter_id: null,
      matched_shelter_name: null,
      matched_request_id: null,
      delivery_address: null,
      match_reason: null,
      donor_name: donorName,
      dismissed_by_shelter: false,
      expired: false,
    };

    const result = onAdd(order);
    setFeedback(result);
    setForm(EMPTY_FORM);
    setTimeout(() => setFeedback(null), 5000);
  }

  const canDelete = (o: DonationOrder) => o.status === 'Available' || o.status === 'Claimed';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <HandHeart className="h-6 w-6 text-olive-600" />
          <h2 className="text-2xl font-bold tracking-tight text-olive-950">Donor Dashboard</h2>
        </div>
        <p className="text-sm text-olive-500">
          Post surplus goods. The urgency matrix auto-routes your donation to the shelter that needs it most.
        </p>
      </div>

      {/* Urgent requests */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-olive-950">Urgent Shelter Requests</h3>
          {urgentRequests.length > 0 && (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {urgentRequests.length}
            </span>
          )}
        </div>
        {urgentRequests.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No urgent shelter requests right now."
            hint="When a shelter director posts a High-urgency request, it will appear here so you can donate accordingly."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {urgentRequests.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-red-200 bg-red-50/40 p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-olive-950">{r.shelter_name}</h4>
                  <UrgencyBadge urgency={r.urgency} />
                </div>
                <div className="mb-2">
                  <CategoryBadge category={r.category} />
                </div>
                <p className="text-xs text-olive-600">{r.items_needed}</p>
                {r.delivery_address && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-olive-500">
                    <MapPin className="h-3 w-3" /> {r.delivery_address}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-olive-200 bg-cream-50 p-6 shadow-sm"
          >
            <div className="mb-5 flex items-center gap-2 border-b border-olive-100 pb-4">
              <PackagePlus className="h-5 w-5 text-olive-700" />
              <h3 className="text-base font-semibold text-olive-950">+ Post a Donation</h3>
            </div>

            <div className="grid gap-4">
              <Field label="Item Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Fresh produce from farmers market"
                  className="input"
                  required
                />
              </Field>

              <Field label="Details">
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="Describe quantity, condition, packaging..."
                  rows={3}
                  className="input resize-none"
                />
              </Field>

              <PhotoCapture
                photos={form.photos}
                onAdd={(photo) => setForm({ ...form, photos: [...form.photos, photo] })}
                onRemove={(idx) =>
                  setForm({ ...form, photos: form.photos.filter((_, i) => i !== idx) })
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="input"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Pickup Address" icon={<MapPin className="h-3.5 w-3.5" />}>
                  <input
                    value={form.pickup_address}
                    onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                    placeholder="Enter pickup address"
                    className="input"
                    required
                  />
                </Field>
              </div>

              {form.category === 'Food' && (
                <div className="grid gap-4 rounded-xl border border-olive-200 bg-olive-50/60 p-4 sm:grid-cols-2">
                  <Field label="Expiration Date" icon={<Clock className="h-3.5 w-3.5" />}>
                    <input
                      type="date"
                      value={form.expiration_time}
                      onChange={(e) => setForm({ ...form, expiration_time: e.target.value })}
                      className="input"
                    />
                  </Field>
                  <label className="flex cursor-pointer items-center gap-2.5 self-end pb-3">
                    <input
                      type="checkbox"
                      checked={form.requires_refrigeration}
                      onChange={(e) =>
                        setForm({ ...form, requires_refrigeration: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-olive-300 text-olive-600 focus:ring-olive-500"
                    />
                    <Snowflake className="h-4 w-4 text-olive-600" />
                    <span className="text-sm font-medium text-olive-700">Requires Refrigeration</span>
                  </label>
                </div>
              )}

              {form.category === 'Pet Supplies' && (
                <div className="rounded-xl border border-cream-300 bg-cream-100/60 p-4">
                  <Field label="Target Animal" icon={<PawPrint className="h-3.5 w-3.5" />}>
                    <input
                      value={form.target_animal}
                      onChange={(e) => setForm({ ...form, target_animal: e.target.value })}
                      placeholder="e.g. Dog, Cat, Rabbit..."
                      className="input"
                    />
                  </Field>
                </div>
              )}

              {form.category === 'Electronics' && (
                <div className="rounded-xl border border-olive-200 bg-olive-50/40 p-4">
                  <Field label="Operating System / Condition" icon={<Monitor className="h-3.5 w-3.5" />}>
                    <input
                      value={form.os}
                      onChange={(e) => setForm({ ...form, os: e.target.value })}
                      placeholder="e.g. Windows 11 Pro — Good condition"
                      className="input"
                    />
                  </Field>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-olive-800 px-5 py-3 text-sm font-semibold text-cream-50 shadow-sm transition hover:bg-olive-700 active:scale-[0.99]"
              >
                <Zap className="h-4 w-4" />
                Post & Run Urgency Match
              </button>

              {feedback && (
                <div
                  className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                    feedback.matched ? 'bg-green-50 text-green-700' : 'bg-olive-50 text-olive-700'
                  }`}
                >
                  {feedback.matched ? (
                    <Link2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <Unlink className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  <div>
                    {feedback.matched ? (
                      <>
                        <p>Matched to {feedback.shelterName}</p>
                        {feedback.reason && <p className="text-xs opacity-80">Reason: {feedback.reason}</p>}
                      </>
                    ) : (
                      <p>
                        Donation posted. No matching shelter request yet — it will auto-match when one
                        appears.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Active Posts Log */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-olive-200 bg-cream-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 border-b border-olive-100 pb-4">
              <PackagePlus className="h-5 w-5 text-olive-700" />
              <h3 className="text-base font-semibold text-olive-950">Active Posts Log</h3>
            </div>

            {myOrders.length === 0 ? (
              <EmptyState
                icon={PackagePlus}
                title="You haven't posted any donations yet."
                hint="Use the form to share your first item."
              />
            ) : (
              <div className="space-y-3">
                {myOrders.map((o) => (
                  <div
                    key={o.id}
                    className="group rounded-xl border border-olive-200 bg-cream-50 p-4 transition hover:border-olive-300 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-olive-950">{o.title}</h4>
                      <StatusBadge status={o.status} />
                    </div>
                    <div className="mb-2">
                      <CategoryBadge category={o.category} />
                    </div>
                    <div className="space-y-1 text-xs text-olive-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {o.pickup_address}
                      </p>
                      {o.matched_shelter_name ? (
                        <>
                          <p className="flex items-center gap-1.5 font-medium text-olive-700">
                            <ArrowRight className="h-3 w-3" /> {o.matched_shelter_name}
                          </p>
                          {o.delivery_address && (
                            <p className="pl-4 text-olive-400">{o.delivery_address}</p>
                          )}
                          {o.match_reason && (
                            <p className="flex items-center gap-1 italic text-olive-400">
                              <Info className="h-3 w-3" /> {o.match_reason}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="flex items-center gap-1.5 italic text-clay-500">
                          <Unlink className="h-3 w-3" /> Awaiting shelter match
                        </p>
                      )}
                      {o.dynamic_fields.expiration_time && (
                        <p
                          className={`flex items-center gap-1.5 ${
                            o.expired ? 'text-red-600' : 'text-olive-600'
                          }`}
                        >
                          <Clock className="h-3 w-3" /> Expires: {formatExpiration(o.dynamic_fields.expiration_time)}
                          {o.expired && ' (expired)'}
                        </p>
                      )}
                      {o.dynamic_fields.requires_refrigeration && (
                        <p className="flex items-center gap-1.5 text-olive-600">
                          <Snowflake className="h-3 w-3" /> Refrigeration required
                        </p>
                      )}
                    </div>
                    {o.photos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {o.photos.map((src, i) => (
                          <div
                            key={i}
                            className="h-16 w-16 overflow-hidden rounded-lg border border-olive-200 shadow-sm"
                          >
                            <img
                              src={src}
                              alt={`${o.title} photo ${i + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {canDelete(o) && (
                      <button
                        onClick={() => onDeleteOrder(o.id)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-olive-400 transition hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete donation
                      </button>
                    )}
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

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-olive-500">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
