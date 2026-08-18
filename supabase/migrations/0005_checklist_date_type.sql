-- Real checklists include date fields (service dates, calibration due dates)
-- that don't fit pass_fail/yes_no/text/number.

alter table checklist_items drop constraint checklist_items_response_type_check;
alter table checklist_items add constraint checklist_items_response_type_check
  check (response_type in ('pass_fail', 'yes_no', 'text', 'number', 'date'));
