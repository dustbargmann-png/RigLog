-- 0006 caused "infinite recursion detected in policy for relation units":
-- units_select checked unit_assignments (RLS-protected), and
-- unit_assignments_select checked back into units (RLS-protected) — a
-- circular policy evaluation. The fix is the same pattern can_access_unit()
-- already used correctly: route every cross-table check through a
-- security definer function, which executes as the function owner and so
-- bypasses RLS on the table it queries internally, breaking the cycle.

create or replace function is_assigned_to_unit(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from unit_assignments where unit_id = target_unit_id and user_id = auth.uid()
  );
$$;

create or replace function unit_company_id(target_unit_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from units where id = target_unit_id;
$$;

create or replace function unit_created_by(target_unit_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select created_by from units where id = target_unit_id;
$$;

-- units: swap the raw inline EXISTS against unit_assignments for the
-- security definer helper.
drop policy "units_select" on units;
create policy "units_select" on units
  for select using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id))
  );

drop policy "units_update" on units;
create policy "units_update" on units
  for update using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id))
  );

drop policy "units_delete" on units;
create policy "units_delete" on units
  for delete using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id))
  );

-- unit_assignments: swap the raw inline EXISTS against units for the
-- security definer helpers.
drop policy "unit_assignments_select" on unit_assignments;
create policy "unit_assignments_select" on unit_assignments
  for select using (
    unit_company_id(unit_id) = current_company_id()
    and (is_admin() or user_id = auth.uid())
  );

drop policy "unit_assignments_admin_write" on unit_assignments;
create policy "unit_assignments_admin_write" on unit_assignments
  for all using (
    is_admin() and unit_company_id(unit_id) = current_company_id()
  )
  with check (
    is_admin() and unit_company_id(unit_id) = current_company_id()
  );

drop policy "unit_assignments_self_on_own_unit" on unit_assignments;
create policy "unit_assignments_self_on_own_unit" on unit_assignments
  for insert with check (
    user_id = auth.uid()
    and unit_created_by(unit_id) = auth.uid()
  );
