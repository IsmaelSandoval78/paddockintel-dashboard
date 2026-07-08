-- Blog template Phase 3: stat callout boxes, documented sources, FAQ schema
-- stats    jsonb — array of {value, label, unit?} — rendered as sidebar callouts
-- sources  jsonb — array of {name, url} — rendered as "Documented Sources" footer
-- faq_items was referenced in SKILL.md but never added; adding it here alongside stats/sources

alter table articles
  add column if not exists stats      jsonb,
  add column if not exists sources    jsonb,
  add column if not exists faq_items  jsonb;
