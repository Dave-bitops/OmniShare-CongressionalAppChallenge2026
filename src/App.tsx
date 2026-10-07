import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { DonorView, type MatchResult } from '@/components/DonorView';
import { DriverView } from '@/components/DriverView';
import { RecipientView } from '@/components/RecipientView';
import { ConfirmDialog, type ConfirmConfig } from '@/components/ConfirmDialog';
import { SEED_SHELTER_PROFILES, SEED_SHELTER_REQUESTS, SAM_SHELTER_ID, SAM_SHELTER_NAME, isExpired } from '@/data';
import type { DonationOrder, Role, ShelterProfile, ShelterRequest } from '@/types';

function App() {
  const [role, setRole] = useState<Role>('donor');
  const [name, setName] = useState('Sam Wheeler');
  const [orders, setOrders] = useState<DonationOrder[]>([]);
  const [shelterRequests, setShelterRequests] = useState<ShelterRequest[]>(SEED_SHELTER_REQUESTS);
  const [shelterProfiles] = useState<ShelterProfile[]>(SEED_SHELTER_PROFILES);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  const [postedCount, setPostedCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);

  const stats = { posted: postedCount, delivered: deliveredCount, received: receivedCount };

  // Urgency matrix: High first (random among ties), then first Standard.
  // Considers only active, unfulfilled requests.
  function matchShelter(category: string, excludeOrderId?: string): {
    request: ShelterRequest | null;
    reason: string;
  } {
    const active = shelterRequests.filter(
      (r) => r.active && !r.fulfilled && r.category === category
    );
    if (active.length === 0) return { request: null, reason: '' };
    const high = active.filter((r) => r.urgency === 'High');
    if (high.length > 0) {
      const picked = high[Math.floor(Math.random() * high.length)];
      return { request: picked, reason: `High urgency — ${category}` };
    }
    return {
      request: active[0],
      reason: `Standard request — no High-urgency ${category} requests available`,
    };
  }

  function addOrder(order: DonationOrder): MatchResult {
    const { request, reason } = matchShelter(order.category);
    const matchedOrder: DonationOrder = request
      ? {
          ...order,
          matched_shelter_id: request.shelter_id,
          matched_shelter_name: request.shelter_name,
          matched_request_id: request.id,
          delivery_address: request.delivery_address || null,
          match_reason: reason,
        }
      : { ...order, match_reason: null };
    setOrders((prev) => [matchedOrder, ...prev]);
    setPostedCount((c) => c + 1);
    return request
      ? { matched: true, shelterName: request.shelter_name, reason, deliveryAddress: request.delivery_address }
      : { matched: false };
  }

  function deleteOrder(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status === 'In Transit' || order.status === 'Delivered') return;

    const hasRoute = !!order.matched_shelter_id;
    setConfirm({
      title: 'Delete this donation?',
      message: hasRoute
        ? 'This will remove the donation and its available route. This action cannot be undone.'
        : 'This will remove the donation. This action cannot be undone.',
      onConfirm: () => setOrders((prev) => prev.filter((o) => o.id !== id)),
    });
  }

  function acceptRoute(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, driver_name: name, status: 'Claimed' } : o))
    );
  }

  function cancelRoute(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, driver_name: null, status: 'Available' } : o))
    );
  }

  function confirmPickup(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'In Transit' } : o))
    );
  }

  function markDelivered(id: string) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'Delivered' } : o)));
    setDeliveredCount((c) => c + 1);

    // Increment received counter when the delivery is destined for Sam's own shelter.
    if (order.matched_shelter_id === SAM_SHELTER_ID) {
      setReceivedCount((c) => c + 1);
    }

    // Fulfill the matched High-urgency request so it leaves the active urgent lists.
    if (order.matched_request_id) {
      setShelterRequests((prev) =>
        prev.map((r) =>
          r.id === order.matched_request_id && r.urgency === 'High'
            ? { ...r, fulfilled: true, active: false }
            : r
        )
      );
    }
  }

  function addShelterRequest(req: ShelterRequest) {
    setShelterRequests((prev) => [req, ...prev]);
    // Auto-match any awaiting (unmatched) donations in the same category.
    setOrders((prev) => {
      const awaiting = prev.filter(
        (o) => !o.matched_shelter_id && o.category === req.category && o.status === 'Available'
      );
      if (awaiting.length === 0) return prev;
      return prev.map((o) => {
        if (o.matched_shelter_id || o.category !== req.category || o.status !== 'Available') {
          return o;
        }
        return {
          ...o,
          matched_shelter_id: req.shelter_id,
          matched_shelter_name: req.shelter_name,
          matched_request_id: req.id,
          delivery_address: req.delivery_address || null,
          match_reason:
            req.urgency === 'High'
              ? `High urgency — ${req.category}`
              : `Standard request — no High-urgency ${req.category} requests available`,
        };
      });
    });
  }

  function deleteShelterRequest(id: string) {
    const req = shelterRequests.find((r) => r.id === id);
    if (!req) return;
    const matched = orders.some(
      (o) => o.matched_request_id === id && o.status !== 'Delivered'
    );
    setConfirm({
      title: 'Delete this shelter request?',
      message: matched
        ? 'This request has already been matched. Deleting the request will not cancel the existing delivery route.'
        : 'This will remove the shelter request. This action cannot be undone.',
      onConfirm: () => setShelterRequests((prev) => prev.filter((r) => r.id !== id)),
    });
  }

  function dismissDelivered(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, dismissed_by_shelter: true } : o))
    );
  }

  // Expiration sweep: expired, unclaimed food donations lose their route and
  // become unavailable for pickup. The donation stays active through the
  // expiration calendar day; once that day ends, the match is removed.
  // In-progress deliveries are never touched.
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders((prev) => {
        let changed = false;
        const next = prev.map((o) => {
          if (o.expired) return o;
          if (o.status === 'In Transit' || o.status === 'Delivered') return o;
          if (!isExpired(o.dynamic_fields.expiration_time)) return o;
          changed = true;
          return {
            ...o,
            expired: true,
            matched_shelter_id: null,
            matched_shelter_name: null,
            matched_request_id: null,
            delivery_address: null,
            match_reason: 'Expired — awaiting re-match',
          };
        });
        return changed ? next : prev;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Shelter Director only sees their own requests (Sam's Shelter).
  const myShelterRequests = shelterRequests.filter((r) => r.shelter_id === SAM_SHELTER_ID);

  return (
    <div className="min-h-screen bg-cream-50">
      <Header
        role={role}
        onRoleChange={setRole}
        name={name}
        onRename={setName}
        stats={stats}
      />
      <main>
        {role === 'donor' && (
          <DonorView
            orders={orders}
            shelterRequests={shelterRequests}
            donorName={name}
            onAdd={addOrder}
            onDeleteOrder={deleteOrder}
          />
        )}
        {role === 'driver' && (
          <DriverView
            orders={orders}
            driverName={name}
            onAccept={acceptRoute}
            onCancel={cancelRoute}
            onConfirmPickup={confirmPickup}
            onDeliver={markDelivered}
          />
        )}
        {role === 'shelter' && (
          <RecipientView
            orders={orders}
            shelterRequests={myShelterRequests}
            directorName={name}
            onAddRequest={addShelterRequest}
            onDeleteRequest={deleteShelterRequest}
            onDismissDelivered={dismissDelivered}
          />
        )}
      </main>
      <footer className="border-t border-olive-200 bg-cream-100 py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-olive-500 sm:px-6">
          OmniShare — Washington, DC · connecting donors, volunteer drivers, and shelters.
        </div>
      </footer>

      {confirm && <ConfirmDialog config={confirm} onClose={() => setConfirm(null)} />}
    </div>
  );
}

export default App;
