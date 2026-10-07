import { useState } from 'react';
import {
  Truck,
  MapPin,
  ArrowRight,
  Navigation,
  Package,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  Inbox,
  Clock,
  Snowflake,
  Map as MapIcon,
} from 'lucide-react';
import type { DonationOrder } from '@/types';
import { CategoryBadge, StatusBadge } from './Badges';
import { EmptyState } from './EmptyState';
import { formatExpiration } from '@/data';
import { RouteMap } from './RouteMap';

interface Props {
  orders: DonationOrder[];
  driverName: string;
  onAccept: (id: string) => void;
  onCancel: (id: string) => void;
  onConfirmPickup: (id: string) => void;
  onDeliver: (id: string) => void;
}

export function DriverView({
  orders,
  driverName,
  onAccept,
  onCancel,
  onConfirmPickup,
  onDeliver,
}: Props) {
  const [routeOrder, setRouteOrder] = useState<DonationOrder | null>(null);

  // Available = matched (has shelter) and not yet claimed
  const available = orders.filter(
    (o) => o.matched_shelter_id && o.status === 'Available' && !o.driver_name
  );
  const myActive = orders.filter(
    (o) =>
      o.driver_name === driverName &&
      (o.status === 'Claimed' || o.status === 'In Transit')
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Truck className="h-6 w-6 text-sky-600" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Driver Dashboard</h2>
        </div>
        <p className="text-sm text-slate-500">
          Accept delivery routes, confirm pickups, and mark deliveries complete across Washington DC.
        </p>
      </div>

      {/* Section 1 */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Inbox className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-slate-900">Available Pickups</h3>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            {available.length}
          </span>
        </div>

        {available.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No available pickup orders right now."
            hint="Matched donations will appear here once a donor posts and a shelter request matches."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((o) => (
              <AvailableCard
                key={o.id}
                order={o}
                onAccept={() => onAccept(o.id)}
                onViewMap={() => setRouteOrder(o)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 2 */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Navigation className="h-5 w-5 text-sky-600" />
          <h3 className="text-lg font-semibold text-slate-900">My Active Deliveries</h3>
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
            {myActive.length}
          </span>
        </div>

        {myActive.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="You have no active deliveries."
            hint="Accept an available pickup above to get started."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myActive.map((o) => (
              <ActiveCard
                key={o.id}
                order={o}
                onCancel={() => onCancel(o.id)}
                onConfirmPickup={() => onConfirmPickup(o.id)}
                onDeliver={() => onDeliver(o.id)}
                onViewMap={() => setRouteOrder(o)}
              />
            ))}
          </div>
        )}
      </section>

      {routeOrder && routeOrder.delivery_address && (
        <RouteMap
          pickupAddress={routeOrder.pickup_address}
          deliveryAddress={routeOrder.delivery_address}
          onClose={() => setRouteOrder(null)}
        />
      )}
    </div>
  );
}

function AvailableCard({
  order,
  onAccept,
  onViewMap,
}: {
  order: DonationOrder;
  onAccept: () => void;
  onViewMap: () => void;
}) {
  const df = order.dynamic_fields;
  const canShowMap = !!order.delivery_address;
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">{order.title}</h4>
        <CategoryBadge category={order.category} />
      </div>
      <p className="mb-3 line-clamp-2 text-xs text-slate-500">{order.details}</p>

      <div className="mb-3 space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs">
        <p className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="h-3 w-3 text-rose-500" /> {order.pickup_address}
        </p>
        {order.matched_shelter_name && (
          <p className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building2 className="h-3 w-3 text-slate-500" /> {order.matched_shelter_name}
          </p>
        )}
        {order.delivery_address && (
          <p className="flex items-center gap-1.5 text-slate-600">
            <ArrowRight className="h-3 w-3 text-emerald-600" /> {order.delivery_address}
          </p>
        )}
      </div>

      {/* Driver planning info */}
      {(df.expiration_time || df.requires_refrigeration) && (
        <div className="mb-3 space-y-1 rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 text-xs">
          {df.expiration_time && (
            <p className="flex items-center gap-1.5 text-amber-700">
              <Clock className="h-3 w-3" /> Expires: {formatExpiration(df.expiration_time)}
            </p>
          )}
          {df.requires_refrigeration && (
            <p className="flex items-center gap-1.5 text-sky-700">
              <Snowflake className="h-3 w-3" /> Refrigeration required
            </p>
          )}
        </div>
      )}

      {canShowMap && (
        <button
          onClick={onViewMap}
          className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <MapIcon className="h-3.5 w-3.5" />
          View Route Map
        </button>
      )}

      <button
        onClick={onAccept}
        className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
      >
        <Navigation className="h-4 w-4" />
        Accept Delivery Route
      </button>
    </div>
  );
}

function ActiveCard({
  order,
  onCancel,
  onConfirmPickup,
  onDeliver,
  onViewMap,
}: {
  order: DonationOrder;
  onCancel: () => void;
  onConfirmPickup: () => void;
  onDeliver: () => void;
  onViewMap: () => void;
}) {
  const inTransit = order.status === 'In Transit';
  const canShowMap = !!order.delivery_address;
  return (
    <div className="flex flex-col rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-900">{order.title}</h4>
        <StatusBadge status={order.status} />
      </div>
      <div className="mb-3">
        <CategoryBadge category={order.category} />
      </div>

      <div className="mb-3 space-y-1.5 text-xs">
        <p className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="h-3 w-3 text-rose-500" /> {order.pickup_address}
        </p>
        {order.matched_shelter_name && (
          <p className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building2 className="h-3 w-3 text-slate-500" /> {order.matched_shelter_name}
          </p>
        )}
        {order.delivery_address && (
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-slate-600">
              <ArrowRight className="h-3 w-3 text-emerald-600" /> {order.delivery_address}
            </p>
            {canShowMap && (
              <button
                onClick={onViewMap}
                title="View route map"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <MapIcon className="h-3.5 w-3.5" />
                Map
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto space-y-2">
        {!inTransit && (
          <>
            <button
              onClick={onConfirmPickup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 active:scale-[0.99]"
            >
              <Package className="h-4 w-4" />
              Confirm Pickup
            </button>
            <button
              onClick={onCancel}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.99]"
            >
              <XCircle className="h-4 w-4" />
              Cancel Route
            </button>
          </>
        )}
        {inTransit && (
          <button
            onClick={onDeliver}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-500 active:scale-[0.99]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as Delivered
          </button>
        )}
      </div>
    </div>
  );
}
