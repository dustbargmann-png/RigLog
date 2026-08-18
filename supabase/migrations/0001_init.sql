-- RigLog initial schema: companies, users, units, inventory, checklists, inspection logs.
-- Run this against your Supabase project's SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- users (one row per auth.users, mirrors the auth user + company membership)
-- ---------------------------------------------------------------------------
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'technician' check (role in ('admin', 'technician')),
  created_at timestamptz not null default now()
);

create index users_company_id_idx on users (company_id);

-- Helper used by RLS policies: the caller's company_id, or null if not signed in / no row yet.
create or replace function current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from users where id = auth.uid();
$$;

-- Signup helper: creates a company + admin user row for a brand-new auth user.
-- Called from the app right after supabase.auth.signUp() succeeds.
create or replace function create_company_and_admin(company_name text, user_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company_id uuid;
begin
  insert into companies (name) values (company_name) returning id into new_company_id;
  insert into users (id, company_id, name, email, role)
  values (auth.uid(), new_company_id, user_name, auth.email(), 'admin');
end;
$$;

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------
create table units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  label text not null,
  make text,
  model text,
  vin text,
  year integer,
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index units_company_id_idx on units (company_id);

-- ---------------------------------------------------------------------------
-- inventory_items
-- ---------------------------------------------------------------------------
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units (id) on delete cascade,
  name text not null,
  category text,
  serial_number text,
  install_date date,
  warranty_expiration_date date,
  next_maintenance_date date,
  condition text not null default 'good' check (condition in ('good', 'needs_attention', 'out_of_service')),
  photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index inventory_items_unit_id_idx on inventory_items (unit_id);

-- ---------------------------------------------------------------------------
-- checklist_templates (company_id null = global default template)
-- ---------------------------------------------------------------------------
create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies (id) on delete cascade,
  name text not null,
  category text not null check (category in ('dot', 'ada', 'generator', 'hvac', 'custom')),
  interval_days integer not null default 365,
  forked_from_id uuid references checklist_templates (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index checklist_templates_company_id_idx on checklist_templates (company_id);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates (id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  response_type text not null default 'pass_fail' check (response_type in ('pass_fail', 'yes_no', 'text', 'number')),
  is_required boolean not null default true
);

create index checklist_items_template_id_idx on checklist_items (template_id);

-- ---------------------------------------------------------------------------
-- inspection_logs
-- ---------------------------------------------------------------------------
create table inspection_logs (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  template_id uuid references checklist_templates (id) on delete set null,
  inventory_item_id uuid references inventory_items (id) on delete set null,
  performed_by uuid not null references users (id),
  performed_at timestamptz not null default now(),
  notes text,
  overall_status text not null default 'pass' check (overall_status in ('pass', 'fail', 'needs_follow_up')),
  created_at timestamptz not null default now()
);

create index inspection_logs_unit_id_idx on inspection_logs (unit_id);
create index inspection_logs_company_id_idx on inspection_logs (company_id);
create index inspection_logs_template_id_idx on inspection_logs (template_id);

create table inspection_log_items (
  id uuid primary key default gen_random_uuid(),
  inspection_log_id uuid not null references inspection_logs (id) on delete cascade,
  checklist_item_id uuid not null references checklist_items (id),
  response text,
  notes text
);

create index inspection_log_items_log_id_idx on inspection_log_items (inspection_log_id);

create table inspection_log_photos (
  id uuid primary key default gen_random_uuid(),
  inspection_log_id uuid not null references inspection_logs (id) on delete cascade,
  photo_url text not null,
  created_at timestamptz not null default now()
);

create index inspection_log_photos_log_id_idx on inspection_log_photos (inspection_log_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table companies enable row level security;
alter table users enable row level security;
alter table units enable row level security;
alter table inventory_items enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_items enable row level security;
alter table inspection_logs enable row level security;
alter table inspection_log_items enable row level security;
alter table inspection_log_photos enable row level security;

-- companies: a user can only read their own company (no direct insert/update from the client)
create policy "companies_select_own" on companies
  for select using (id = current_company_id());

-- users: a user can read/update teammates within their own company
create policy "users_select_same_company" on users
  for select using (company_id = current_company_id());
create policy "users_update_self" on users
  for update using (id = auth.uid());
create policy "users_insert_self" on users
  for insert with check (id = auth.uid());

-- units
create policy "units_all_same_company" on units
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());

-- inventory_items (scoped via parent unit's company)
create policy "inventory_items_all_same_company" on inventory_items
  for all using (
    exists (select 1 from units u where u.id = unit_id and u.company_id = current_company_id())
  )
  with check (
    exists (select 1 from units u where u.id = unit_id and u.company_id = current_company_id())
  );

-- checklist_templates: readable if global (company_id is null) or owned by caller's company;
-- writable only when owned by caller's company (forks)
create policy "checklist_templates_select_global_or_own" on checklist_templates
  for select using (company_id is null or company_id = current_company_id());
create policy "checklist_templates_insert_own" on checklist_templates
  for insert with check (company_id = current_company_id());
create policy "checklist_templates_update_own" on checklist_templates
  for update using (company_id = current_company_id());
create policy "checklist_templates_delete_own" on checklist_templates
  for delete using (company_id = current_company_id());

-- checklist_items follow their template's visibility/ownership
create policy "checklist_items_select_global_or_own" on checklist_items
  for select using (
    exists (
      select 1 from checklist_templates t
      where t.id = template_id and (t.company_id is null or t.company_id = current_company_id())
    )
  );
create policy "checklist_items_write_own" on checklist_items
  for all using (
    exists (select 1 from checklist_templates t where t.id = template_id and t.company_id = current_company_id())
  )
  with check (
    exists (select 1 from checklist_templates t where t.id = template_id and t.company_id = current_company_id())
  );

-- inspection_logs / items / photos
create policy "inspection_logs_all_same_company" on inspection_logs
  for all using (company_id = current_company_id())
  with check (company_id = current_company_id());

create policy "inspection_log_items_all_same_company" on inspection_log_items
  for all using (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and l.company_id = current_company_id())
  )
  with check (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and l.company_id = current_company_id())
  );

create policy "inspection_log_photos_all_same_company" on inspection_log_photos
  for all using (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and l.company_id = current_company_id())
  )
  with check (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and l.company_id = current_company_id())
  );

-- ---------------------------------------------------------------------------
-- Seed: global checklist templates (Phase 3 will flesh these out further)
-- ---------------------------------------------------------------------------
insert into checklist_templates (id, company_id, name, category, interval_days) values
  ('00000000-0000-0000-0000-000000000001', null, 'DOT Road-Worthiness Inspection', 'dot', 365),
  ('00000000-0000-0000-0000-000000000002', null, 'ADA Accessibility Inspection', 'ada', 365),
  ('00000000-0000-0000-0000-000000000003', null, 'Generator Maintenance', 'generator', 180),
  ('00000000-0000-0000-0000-000000000004', null, 'HVAC Maintenance', 'hvac', 180);

insert into checklist_items (template_id, label, sort_order, response_type) values
  ('00000000-0000-0000-0000-000000000001', 'Tires and wheels in good condition', 1, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000001', 'Brakes and brake lights functional', 2, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000001', 'Lights and reflectors functional', 3, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000001', 'Hitch and coupling secure', 4, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000001', 'Registration and DOT number current', 5, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000002', 'Ramp/lift operates correctly', 1, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000002', 'Door clearances meet ADA width', 2, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000002', 'Grab bars and handrails secure', 3, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000002', 'Accessible signage present', 4, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000003', 'Oil level and condition checked', 1, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000003', 'Air filter clean/replaced', 2, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000003', 'Load test performed', 3, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000003', 'Fuel system leak-free', 4, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000004', 'Filters clean/replaced', 1, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000004', 'Refrigerant level correct', 2, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000004', 'Thermostat calibrated', 3, 'pass_fail'),
  ('00000000-0000-0000-0000-000000000004', 'Condenser/evaporator coils clean', 4, 'pass_fail');
