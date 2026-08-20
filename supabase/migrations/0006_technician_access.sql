-- Role-based access: admins see everything in their company; technicians only
-- see units an admin has assigned to them. Also adds a company invite code so
-- admins can bring technicians into their EXISTING company instead of every
-- signup creating a brand new one.

alter table companies add column invite_code text unique not null default encode(gen_random_bytes(6), 'hex');

alter table units add column created_by uuid references users (id);

create table unit_assignments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (unit_id, user_id)
);

alter table unit_assignments enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select role = 'admin' from users where id = auth.uid();
$$;

create or replace function can_access_unit(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from units u
    where u.id = target_unit_id
      and u.company_id = current_company_id()
      and (
        is_admin()
        or exists (select 1 from unit_assignments ua where ua.unit_id = u.id and ua.user_id = auth.uid())
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- unit_assignments RLS
-- ---------------------------------------------------------------------------
create policy "unit_assignments_select" on unit_assignments
  for select using (
    exists (select 1 from units u where u.id = unit_id and u.company_id = current_company_id())
    and (is_admin() or user_id = auth.uid())
  );

create policy "unit_assignments_admin_write" on unit_assignments
  for all using (
    is_admin() and exists (select 1 from units u where u.id = unit_id and u.company_id = current_company_id())
  )
  with check (
    is_admin() and exists (select 1 from units u where u.id = unit_id and u.company_id = current_company_id())
  );

-- A technician who creates a unit keeps access to it without needing an admin
-- to assign it first — but only to units they themselves created.
create policy "unit_assignments_self_on_own_unit" on unit_assignments
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from units u where u.id = unit_id and u.created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- units: replace blanket company policy with assignment-aware policies
-- ---------------------------------------------------------------------------
drop policy "units_all_same_company" on units;

create policy "units_select" on units
  for select using (
    company_id = current_company_id()
    and (is_admin() or exists (select 1 from unit_assignments ua where ua.unit_id = units.id and ua.user_id = auth.uid()))
  );

create policy "units_insert" on units
  for insert with check (company_id = current_company_id());

create policy "units_update" on units
  for update using (
    company_id = current_company_id()
    and (is_admin() or exists (select 1 from unit_assignments ua where ua.unit_id = units.id and ua.user_id = auth.uid()))
  );

create policy "units_delete" on units
  for delete using (
    company_id = current_company_id()
    and (is_admin() or exists (select 1 from unit_assignments ua where ua.unit_id = units.id and ua.user_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- inventory_items / inspection_logs: route through can_access_unit
-- ---------------------------------------------------------------------------
drop policy "inventory_items_all_same_company" on inventory_items;
create policy "inventory_items_all" on inventory_items
  for all using (can_access_unit(unit_id))
  with check (can_access_unit(unit_id));

drop policy "inspection_logs_all_same_company" on inspection_logs;
create policy "inspection_logs_all" on inspection_logs
  for all using (can_access_unit(unit_id))
  with check (can_access_unit(unit_id));

drop policy "inspection_log_items_all_same_company" on inspection_log_items;
create policy "inspection_log_items_all" on inspection_log_items
  for all using (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and can_access_unit(l.unit_id))
  )
  with check (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and can_access_unit(l.unit_id))
  );

drop policy "inspection_log_photos_all_same_company" on inspection_log_photos;
create policy "inspection_log_photos_all" on inspection_log_photos
  for all using (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and can_access_unit(l.unit_id))
  )
  with check (
    exists (select 1 from inspection_logs l where l.id = inspection_log_id and can_access_unit(l.unit_id))
  );

-- Admins can regenerate their own company's invite code (no update policy
-- existed on companies at all before this).
create policy "companies_update_admin" on companies
  for update using (id = current_company_id() and is_admin())
  with check (id = current_company_id() and is_admin());

-- ---------------------------------------------------------------------------
-- Invite-by-code join flow
-- ---------------------------------------------------------------------------
create or replace function company_name_for_invite(invite_code_input text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select name from companies where invite_code = invite_code_input;
$$;

create or replace function join_company_with_invite(invite_code_input text, new_user_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_id uuid;
begin
  select id into target_company_id from companies where invite_code = invite_code_input;
  if target_company_id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into users (id, company_id, name, email, role)
  values (auth.uid(), target_company_id, new_user_name, auth.email(), 'technician');
end;
$$;

-- All user-row creation now goes through create_company_and_admin or
-- join_company_with_invite (both security definer), so a client-side self
-- insert is no longer a legitimate path — and without this the old policy
-- let an authenticated user attach themselves to ANY company_id they typed,
-- invite code or not.
drop policy "users_insert_self" on users;
