-- Registration wall (free, email-gated) for articles going forward.
-- Existing 315+ articles default to false and are untouched — this only
-- gates content explicitly opted in via new frontmatter (paywalled: true).
alter table articles add column if not exists paywalled boolean not null default false;
