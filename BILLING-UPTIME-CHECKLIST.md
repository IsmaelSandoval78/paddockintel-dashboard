# Billing alerts + uptime monitoring — manual checklist

Why this exists: the Ghost(Pro) suspension happened because a failed-payment notice went to an inbox nobody checks. This checklist closes that blind spot across every paid service the project depends on. Do this once, then re-verify yearly (domain renewal is the highest-stakes one — it's prepaid through 2028, but don't let that create complacency on the others).

Use one inbox you check daily for all of these — don't split alerts across addresses.

## 1. Vercel (hosting)
- [ ] Project → Settings → Billing → confirm payment method is current
- [ ] Account → Settings → Notifications → enable "Payment failed" and "Usage limit" email alerts
- [ ] Set a spend/usage alert if on a usage-based plan (Settings → Billing → Spend Management)

## 2. Supabase (database)
- [ ] Organization → Settings → Billing → confirm payment method is current
- [ ] Organization → Settings → Notifications → enable billing and project-health email alerts
- [ ] Check the free-tier project pause policy (inactive free projects can pause after 7 days of no API activity) — if still on free tier, note the renewal/upgrade date here once decided

## 3. Resend (email — Digest sends, Phase 4)
- [ ] Account → Settings → Billing → confirm payment method is current
- [ ] Enable billing/usage email notifications if available on your plan
- [ ] Confirm the sending domain (paddockintel.com) stays verified — DNS changes on Namecheap can silently break this

## 4. Namecheap (domain — secured through 2028)
- [ ] Confirm auto-renew is ON for paddockintel.com (Domain List → manage → Auto-Renew)
- [ ] Confirm the account email on file is the same daily-checked inbox, not a stale one
- [ ] Even prepaid through 2028: domain expiry emails go to whichever address is on file — verify it now, don't assume

## 5. Uptime monitoring — UptimeRobot (free tier)
- [ ] Sign up at UptimeRobot with the daily-checked inbox
- [ ] Add a monitor: type HTTPS, URL `https://hub.paddockintel.com`, check interval 5 min (free tier default)
- [ ] Add a second monitor for the root domain if it resolves separately: `https://paddockintel.com`
- [ ] Set alert contact to email (free tier) — SMS/Slack alerting requires a paid tier, skip unless needed
- [ ] Trigger a test alert (UptimeRobot has a "test notification" button) to confirm delivery before relying on it

## Done when
All five sections checked, and you've received at least one successful test notification from UptimeRobot confirming alerts actually reach the inbox.
