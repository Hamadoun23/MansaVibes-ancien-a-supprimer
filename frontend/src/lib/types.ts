export type Role = "owner" | "tailleur" | "staff";

export interface User {
  id: number;
  name: string;
  phone: string;
  role: Role;
  is_tailleur: boolean;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
  balance_fcfa: number;
  portal_token: string;
  measurements?: ClientMeasurement[];
  orders_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface MeasurementField {
  key: string;
  label: string;
  unit: string;
  type: string;
}

export interface MeasurementFormTemplate {
  id: number;
  name: string;
  slug: string;
  notes: string;
  fields: MeasurementField[];
  sort_order: number;
  is_active: boolean;
  reference_price_fcfa: number;
}

export interface ClientMeasurement {
  id: number;
  client: number;
  measurement_template: number | null;
  label: string;
  data: Record<string, string | number>;
  poitrine_cm: string | null;
  taille_cm: string | null;
  hanche_cm: string | null;
  longueur_cm: string | null;
  epaule_cm: string | null;
  custom_measures: { label: string; value: string; unit?: string }[];
  measurement_notes: string;
  display_rows: { label: string; value: string | number; unit: string }[];
  created_at: string;
}

export type OrderStatus = "pending" | "in_progress" | "done" | "validated" | "delivered";
export type PaymentMethod = "cash" | "orange_money" | "wave" | "bank_transfer" | "";
export type DeliveryMode = "pickup" | "delivery";
export type DiscountScope = "none" | "all" | "line";

export interface OrderItem {
  id: number;
  inventory_item: number | null;
  inventory_characteristic_key: string;
  inventory_consumed_meters: string | null;
  measurement_template: number | null;
  description: string;
  quantity: number;
  unit_price_fcfa: number;
  discount_fcfa: number;
  discount_applies: boolean;
  client_supplies_fabric: boolean;
  line_gross_fcfa: number;
  line_net_fcfa: number;
}

export interface OrderStatusHistoryEntry {
  id: number;
  status: OrderStatus;
  note: string;
  user: number | null;
  created_at: string;
}

export interface Order {
  id: number;
  client: number;
  client_name: string;
  client_phone: string;
  client_portal_token: string;
  reference: string | null;
  model_name: string;
  measurement_template: number | null;
  status: OrderStatus;
  due_date: string | null;
  assignee: number | null;
  total_fcfa: number;
  advance_payment_fcfa: number;
  balance_due_fcfa: number;
  is_fully_paid: boolean;
  payment_method: PaymentMethod;
  delivery_mode: DeliveryMode;
  discount_scope: DiscountScope;
  order_discount_fcfa: number;
  discount_percent: number;
  model_notes: string;
  notes: string;
  inventory_deducted_at: string | null;
  items: OrderItem[];
  status_histories: OrderStatusHistoryEntry[];
  created_at: string;
}

export interface Employee {
  id: number;
  user: number | null;
  name: string;
  phone: string;
  role_title: string;
  monthly_salary_fcfa: number;
}

export interface DashboardOverview {
  orders_by_status: Record<string, number>;
  orders_total: number;
  revenue_total_fcfa: number;
  outstanding_balance_fcfa: number;
  cash_in_fcfa: number;
  cash_out_fcfa: number;
  cash_net_fcfa: number;
}

export interface OrderListItem {
  id: number;
  reference: string | null;
  client: number;
  client_name: string;
  client_phone: string;
  client_portal_token: string;
  model_name: string;
  status: OrderStatus;
  due_date: string | null;
  total_fcfa: number;
  advance_payment_fcfa: number;
  balance_due_fcfa: number;
  created_at: string;
}

export interface TodayOverview {
  date: string;
  late: OrderListItem[];
  due_today: OrderListItem[];
  upcoming: OrderListItem[];
  ready: OrderListItem[];
  counts: { pending: number; in_progress: number; ready: number };
  to_collect_fcfa: number;
  cash_today_fcfa: number;
}

export interface AppSettings {
  business_name: string;
  phone: string;
  address: string;
  settings: Record<string, unknown>;
}

export type AssistantActionType =
  | "creer_client"
  | "enregistrer_mesures"
  | "creer_commande"
  | "encaisser"
  | "changer_statut"
  | "message_whatsapp";

export interface AssistantAction {
  id: string;
  type: AssistantActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
  summary: string;
}

export interface AssistantResponse {
  transcript: string | null;
  reply: string;
  actions: AssistantAction[];
}
