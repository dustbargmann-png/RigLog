-- A technician creating a unit hits a classic RLS chicken-and-egg: the INSERT
-- into units succeeds (units_insert only checks company_id), but PostgREST's
-- `.select().single()` needs to read the row back via RETURNING, which is
-- gated by units_select — and the unit_assignments row that would grant that
-- read doesn't exist yet (it's created in a follow-up query after the
-- insert). Postgres surfaces this as "new row violates row-level security
-- policy for table units" and rolls back the whole insert.
--
-- Fix: let a technician also see/edit/delete a unit they personally created,
-- independent of (and before) any formal assignment.

drop policy "units_select" on units;
create policy "units_select" on units
  for select using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id) or units.created_by = auth.uid())
  );

drop policy "units_update" on units;
create policy "units_update" on units
  for update using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id) or units.created_by = auth.uid())
  );

drop policy "units_delete" on units;
create policy "units_delete" on units
  for delete using (
    company_id = current_company_id()
    and (is_admin() or is_assigned_to_unit(units.id) or units.created_by = auth.uid())
  );
