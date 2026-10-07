export type Category = 'Food' | 'Pet Supplies' | 'Electronics' | 'School Supplies';

export type Urgency = 'High' | 'Standard';

export type OrderStatus = 'Available' | 'Claimed' | 'In Transit' | 'Delivered';

export interface DynamicFields {
  expiration_time?: string;
  requires_refrigeration?: boolean;
  target_animal?: string;
  os?: string;
}

export interface ShelterProfile {
  id: string;
  name: string;
  address: string;
  can_receive: boolean;
}

export interface ShelterRequest {
  id: string;
  shelter_id: string;
  shelter_name: string;
  category: Category;
  items_needed: string;
  delivery_address: string;
  urgency: Urgency;
  active: boolean;
  fulfilled: boolean;
}

export interface DonationOrder {
  id: string;
  title: string;
  details: string;
  category: Category;
  pickup_address: string;
  dynamic_fields: DynamicFields;
  photos: string[];
  status: OrderStatus;
  driver_name: string | null;
  matched_shelter_id: string | null;
  matched_shelter_name: string | null;
  matched_request_id: string | null;
  delivery_address: string | null;
  match_reason: string | null;
  donor_name: string;
  dismissed_by_shelter: boolean;
  expired: boolean;
}

export type Role = 'donor' | 'driver' | 'shelter';
