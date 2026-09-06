# PaddockIntel — Cybersecurity Expert (.md advisor)

Read this before shipping anything that touches: authentication, user data, API tokens/
secrets, third-party content ingestion (the "experts" personalization feature), dependency
upgrades, or infrastructure changes (Cloudflare, Supabase). This advisor exists to catch
security failures before they ship — a solo-founder project has no dedicated security team,
which means every feature ships without a second pair of eyes unless this checklist provides
one.

---

## Non-negotiables (fail = do not publish)

- [ ] No real secret ever committed to git, unrotated (`.env` files, code comments, debug logs)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` unreachable from client-side code or the public bundle
- [ ] Every new user-data table has reviewed RLS policies before it ships
- [ ] Auth/login flows (email, magic-link, OAuth) are rate-limited before shipping
- [ ] Externally-sourced content is sanitized before rendering — no raw third-party HTML
- [ ] No user input reaches a query via string concatenation — parameterized/escaped only

## Secrets and credentials

- [ ] Never commit a real secret to git — not in a `.env` file, not in a code comment, not in
      a "temporary" debug log. If one is committed by accident, it must be rotated
      immediately, not just removed from the latest commit (git history keeps it forever
      unless the history itself is rewritten)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security entirely — it must never reach
      client-side code or a public bundle. Confirm it's only referenced in server-side code
      paths (API routes, server components) before every deploy that touches Supabase config
- [ ] Cloudflare API tokens: scoped to the minimum permission set needed (already done today
      — D1/Queues/Workers Scripts/R2, not "Edit Entire Account"), with an expiration set (90
      days, not "No expiration"). When a token's scope changes or a new one is generated,
      revoke the old one — don't let unused tokens accumulate as standing risk
- [ ] Rotate any credential that was ever pasted into a chat interface, shared screen, or
      screenshot — even accidentally. Assume it's compromised the moment it left a terminal
      you controlled

## Authentication (Google + email — new surface, not yet built)

- [ ] Use a maintained auth provider (Supabase Auth or equivalent) — never hand-roll password
      hashing, session tokens, or OAuth flows from scratch
- [ ] Email/magic-link flows: rate-limit login attempts and link requests per address/IP to
      prevent enumeration and spam abuse
- [ ] Session tokens: httpOnly, secure, and properly scoped cookies — never store a session
      token in localStorage where any injected script could read it
- [ ] Google OAuth: verify the redirect URI allowlist is locked to PaddockIntel's real
      domains only — an open redirect on an OAuth flow is a classic account-takeover vector
- [ ] Password reset / account recovery flows (if email/password is offered, not just OAuth)
      need the same rigor as login — a weak recovery flow undoes strong login security
- [ ] Never log full session tokens, passwords, or OAuth codes — even to server logs. Log
      that an auth event happened, not the credential itself

## Data access and Supabase

- [ ] Row Level Security (RLS) policies reviewed for every new table that stores user data
      (followed drivers/teams/experts, personalization state) — confirm a user can only
      read/write their own rows, not everyone's
- [ ] Never build a query by string-concatenating user input — use parameterized
      queries/the Supabase client's built-in escaping, always. This is the SQL-injection
      baseline and it doesn't get a pass for "it's just an internal admin tool"
- [ ] New API routes that accept user input (search, filters, the personalization follow
      system) validate and sanitize that input server-side — never trust that client-side
      validation was actually run

## Third-party content ingestion ("Experts" feature)

This is a genuinely novel risk surface for PaddockIntel — pulling content from X/Twitter or
elsewhere and surfacing it to users is an injection vector, not just an attribution question
(see EEAT-EXPERT.md and SPORTS-JOURNALISM-EXPERT.md for the editorial/attribution side):

- [ ] Sanitize any externally-sourced text before rendering it — never render raw HTML from
      a third-party source directly into the page (stored XSS risk if an "expert's" post
      contains a script payload or malicious markup)
- [ ] If any pulled content is ever fed into an AI/LLM pipeline (summarization, categorization,
      "which expert said what" matching) as part of a future feature, treat that content as
      untrusted input — a malicious actor could craft a post designed to manipulate an LLM
      into misclassifying content or leaking system prompts (prompt injection). Don't let
      externally-pulled text carry instruction-like authority in any pipeline
- [ ] Rate-limit and cap how much external content gets ingested per source/time window —
      prevents both abuse and runaway API costs if the ingestion pipeline is automated

## Dependency hygiene

- [ ] Same triage discipline demonstrated in `docs/DEPENDENCY-SECURITY.md` (2026-08-25) —
      before running `audit fix --force`, understand what's actually exposed (build-time
      toolchain vs. server runtime vs. client bundle) rather than reflexively patching
      everything or ignoring everything
- [ ] When a fix genuinely touches server-runtime code (like the `next` bump), verify
      compatibility with adjacent infra (the Cloudflare adapter, in that case) before
      applying — a security fix that breaks the build is not actually shipped
- [ ] Re-run `npm audit` after any dependency changes, not just when something feels wrong —
      make it part of the routine, not a one-off investigation

## Infrastructure (Cloudflare migration specifically)

- [ ] Confirm `wrangler.jsonc` and any Cloudflare config files with real bindings (R2 bucket
      names, D1 database IDs) don't leak account-identifying details unnecessarily if the
      repo is ever made public — bucket/binding *names* are low-risk, but double check no
      account IDs or tokens end up hardcoded there instead of as environment secrets
- [ ] The workaround adopted for the Node.js middleware limitation (`middleware.ts` +
      `experimental-edge`, see project history) changes the runtime environment for routing
      logic — confirm no security-relevant logic in that file assumes Node.js-only APIs that
      behave differently (or are unavailable) under edge runtime
- [ ] Rollback plan (Vercel kept running in parallel, DNS TTL lowered before cutover) is also
      a security control, not just a reliability one — a botched cutover that leaves the
      domain pointing nowhere is an availability risk, and a rushed rollback under pressure
      is when mistakes (like re-exposing an old secret) happen

## Rate limiting and abuse prevention

- [ ] Public-facing API routes (anything not behind auth) have basic rate limiting — this
      matters more once personalization/follow features create authenticated write paths
      that could be abused (follow-spam, scripted mass account creation)
- [ ] Monitor for scraping/bulk-download patterns against the data-heavy new vertical
      (proprietary metrics, methodology pages) — the content is meant to be publicly
      readable, but automated bulk extraction is a different concern from a human reading it

## When this advisor should block shipping

Any unrotated secret that was ever exposed outside a controlled environment, any new
user-data table without reviewed RLS policies, any auth flow shipped without rate limiting,
or any third-party content rendered without sanitization — hold the release:
`[SECURITY-HOLD: reason]`.
