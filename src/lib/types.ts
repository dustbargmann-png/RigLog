export type Unit = {
  id: string;
  company_id: string;
  label: string;
  unit_type: string | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  year: number | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
};

export type InventoryCondition = "good" | "needs_attention" | "out_of_service";

export type InventoryItem = {
  id: string;
  unit_id: string;
  name: string;
  category: string | null;
  model: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_expiration_date: string | null;
  next_maintenance_date: string | null;
  condition: InventoryCondition;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
};

export type ResponseType = "pass_fail" | "yes_no" | "text" | "number" | "date";

export type ChecklistTemplate = {
  id: string;
  company_id: string | null;
  name: string;
  category: string | null;
  interval_days: number;
  forked_from_id: string | null;
  is_active: boolean;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  template_id: string;
  label: string;
  sort_order: number;
  response_type: ResponseType;
  is_required: boolean;
};

export type OverallStatus = "pass" | "fail" | "needs_follow_up";

export type InspectionLog = {
  id: string;
  unit_id: string;
  company_id: string;
  template_id: string | null;
  inventory_item_id: string | null;
  performed_by: string;
  performed_at: string;
  notes: string | null;
  overall_status: OverallStatus;
  created_at: string;
};

export type InspectionLogItem = {
  id: string;
  inspection_log_id: string;
  checklist_item_id: string;
  response: string | null;
  notes: string | null;
};

export type InspectionLogPhoto = {
  id: string;
  inspection_log_id: string;
  photo_url: string;
  created_at: string;
};
