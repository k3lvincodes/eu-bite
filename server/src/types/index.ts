// Central Domain Types for EU Bite

export type UserRole = 'student' | 'vendor' | 'rider' | 'admin';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  student_id: string;
  department: string;
  academic_level: string;
  default_hostel: string;
  default_room: string;
  phone_number: string;
  pack_allowance_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Restaurant {
  id: string;
  vendor_user_id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  phone: string;
  opening_time: string;
  closing_time: string;
  is_active: boolean;
  is_accepting_orders: boolean;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_code?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  category: string;
  price_kobo: number;
  is_available: boolean;
  image_url: string;
  packaging_requirement: string;
  preparation_time_mins: number;
  created_at: string;
  updated_at: string;
}

export type PackCode = 'reusable' | 'school';

export interface PackagingType {
  id: string;
  code: PackCode;
  name: string;
  fee_kobo: number;
  stock_count: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PackTransactionType = 'issued' | 'collected' | 'returned' | 'lost' | 'damaged' | 'restocked';

export interface PackTransaction {
  id: string;
  pack_type_id: string;
  order_id?: string;
  student_id?: string;
  vendor_id?: string;
  rider_id?: string;
  transaction_type: PackTransactionType;
  quantity: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export type RiderApprovalStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface Rider {
  id: string;
  user_id: string;
  vehicle_type: string;
  plate_number?: string;
  id_card_url?: string;
  approval_status: RiderApprovalStatus;
  is_online: boolean;
  total_deliveries: number;
  total_earnings_kobo: number;
  rating: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'vendor_accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'rejected';

export type PaymentStatus = 'unpaid' | 'successful' | 'failed' | 'refunded';

export interface Order {
  id: string;
  order_number: string;
  student_id: string;
  restaurant_id: string;
  rider_id?: string;
  status: OrderStatus;
  food_subtotal_kobo: number;
  packaging_fee_kobo: number;
  packaging_type_id?: string;
  packaging_qty: number;
  delivery_fee_kobo: number;
  service_fee_kobo: number;
  total_amount_kobo: number;
  hostel: string;
  room: string;
  delivery_notes?: string;
  delivery_pin: string;
  pin_attempts: number;
  flutterwave_tx_ref?: string;
  flutterwave_flw_ref?: string;
  payment_status: PaymentStatus;
  paid_at?: string;
  prepared_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  unit_price_kobo: number;
  quantity: number;
  total_price_kobo: number;
  notes?: string;
  created_at: string;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value_json: any;
  description: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  order_id?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details_json?: any;
  ip_address?: string;
  created_at: string;
}
