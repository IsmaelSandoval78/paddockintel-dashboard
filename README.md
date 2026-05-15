# PaddockIntel Dashboard
**app.paddockintel.com** — F1 Economic Intelligence Dashboard

## Stack
- Vanilla HTML/CSS/JS (zero build step — deploys instantly)
- Vercel serverless function for OpenWeather proxy
- Node 24.x

## APIs
| API | Auth | Usage |
|-----|------|-------|
| Ergast F1 (jolpi.ca mirror) | None | Standings, next race |
| OpenWeather | Key via env var | Circuit weather |

## Setup

### 1. Clone & push to GitHub
```bash
git init
git remote add origin git@github.com:IsmaelSandoval78/paddockintel-dashboard.git
git add .
git commit -m "feat: MVP dashboard — standings + prize money + countdown"
git push -u origin main
```

### 2. Connect to Vercel
- Import repo in Vercel dashboard
- Set environment variable: `OPENWEATHER_API_KEY = your_key_here`
- Framework: Other (no build step needed)

### 3. Add subdomain
In Vercel project settings → Domains → add `app.paddockintel.com`
In your DNS provider, add CNAME: `app` → `cname.vercel-dns.com`

## Modules
1. **Driver Standings** — Live WDC table + salary estimates + driver prize share
2. **Constructor Prize Money** — Estimated prize distribution modeled on FOM formula
3. **Race Countdown** — Next race timer + live weather at circuit location

## Disclaimers
- Salary figures: estimates based on public reporting (Autosport, RaceFans, Forbes)
- Prize money: modeled approximation — not official FOM data
- Weather: live via OpenWeather API at circuit coordinates

## Design System
```css
--bg:     #0a0e14
--red:    #e10600
--yellow: #e8ff00
Fonts: Rajdhani Bold + Share Tech Mono + Inter
```
