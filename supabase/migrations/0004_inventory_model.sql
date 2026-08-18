-- Real equipment records (e.g. a CT gantry) track a model number separately
-- from the item name and serial/bar code.

alter table inventory_items add column model text;
