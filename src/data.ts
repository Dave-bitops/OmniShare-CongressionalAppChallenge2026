import type { Category, Urgency, OrderStatus } from './types';

export const CATEGORIES: Category[] = ['Food', 'Pet Supplies', 'Electronics', 'School Supplies'];

export const CATEGORY_CONFIG: Record<
  Category,
  { badge: string; dot: string; text: string; soft: string; border: string }
> = {
  Food: {
    badge: 'bg-olive-100 text-olive-800 border-olive-200',
    dot: 'bg-olive-500',
    text: 'text-olive-700',
    soft: 'bg-olive-50',
    border: 'border-olive-200',
  },
  'Pet Supplies': {
    badge: 'bg-cream-200 text-clay-600 border-cream-300',
    dot: 'bg-clay-400',
    text: 'text-clay-600',
    soft: 'bg-cream-100',
    border: 'border-cream-300',
  },
  Electronics: {
    badge: 'bg-olive-50 text-olive-700 border-olive-200',
    dot: 'bg-olive-400',
    text: 'text-olive-700',
    soft: 'bg-olive-50',
    border: 'border-olive-200',
  },
  'School Supplies': {
    badge: 'bg-cream-100 text-clay-500 border-cream-300',
    dot: 'bg-clay-500',
    text: 'text-clay-500',
    soft: 'bg-cream-50',
    border: 'border-cream-200',
  },
};

export const URGENCY_CONFIG: Record<Urgency, { badge: string; dot: string; text: string }> = {
  High: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-500',
    text: 'text-red-700',
  },
  Standard: {
    badge: 'bg-olive-50 text-olive-600 border-olive-200',
    dot: 'bg-olive-400',
    text: 'text-olive-600',
  },
};

export const STATUS_CONFIG: Record<OrderStatus, { badge: string; dot: string }> = {
  Available: { badge: 'bg-olive-50 text-olive-700 border-olive-200', dot: 'bg-olive-400' },
  Claimed: { badge: 'bg-cream-200 text-clay-600 border-cream-300', dot: 'bg-clay-400' },
  'In Transit': { badge: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  Delivered: { badge: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
};

// Seeded shelter profiles located in Washington DC — no High-urgency requests, no orders.
export const SEED_SHELTER_PROFILES = [
  { id: 'sp-1', name: 'Bethesda Community Shelter', address: '4825 Rugby Ave, Bethesda, MD', can_receive: true },
  { id: 'sp-2', name: 'Capitol Heights Food Pantry', address: '5301 Marlboro Pike, Capitol Heights, MD', can_receive: true },
  { id: 'sp-3', name: 'Anacostia Learning Center', address: '1301 Good Hope Rd SE, Washington, DC', can_receive: true },
];

// Sam's own shelter — used for requests created via the Shelter Director dashboard.
export const SAM_SHELTER_ID = 'sam-shelter';
export const SAM_SHELTER_NAME = "Sam's Shelter";

// Standard-urgency requests only — High urgency must be user-created.
export const SEED_SHELTER_REQUESTS = [
  {
    id: 'req-1',
    shelter_id: 'sp-1',
    shelter_name: 'Bethesda Community Shelter',
    category: 'Food' as Category,
    items_needed: 'Canned vegetables, rice, cooking oil for 60 families',
    delivery_address: '4825 Rugby Ave, Bethesda, MD',
    urgency: 'Standard' as Urgency,
    active: true,
    fulfilled: false,
  },
  {
    id: 'req-2',
    shelter_id: 'sp-3',
    shelter_name: 'Anacostia Learning Center',
    category: 'School Supplies' as Category,
    items_needed: 'Notebooks, pencils, backpacks for 40 students',
    delivery_address: '1301 Good Hope Rd SE, Washington, DC',
    urgency: 'Standard' as Urgency,
    active: true,
    fulfilled: false,
  },
];

// Format an ISO date string (from a date input) into a readable label.
export function formatExpiration(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// A donation is expired if the current calendar day is strictly after the
// expiration calendar day. The donation stays active through the expiration day itself.
export function isExpired(expirationDate: string | undefined): boolean {
  if (!expirationDate) return false;
  const exp = new Date(expirationDate + 'T23:59:59');
  return Date.now() > exp.getTime();
}
