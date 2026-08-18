-- Real-world checklists (Inside/Outside/Cleaning per trailer type) don't fit a
-- fixed DOT/ADA/generator/HVAC taxonomy, so open up the category field. Also
-- adds a lightweight unit_type so a multi-modality fleet (CT, MRI, etc.) stays
-- organized without forcing a rigid schema.

alter table checklist_templates drop constraint checklist_templates_category_check;
alter table checklist_templates alter column category drop not null;

alter table units add column unit_type text;

update checklist_templates set category = initcap(category) where company_id is null;
