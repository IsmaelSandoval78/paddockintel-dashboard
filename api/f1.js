// api/f1.js — Vercel serverless proxy for Jolpica F1 API
// Solves CORS issues by fetching server-side instead of from browser

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // cache 5 min

  const { endpoint } = req.query;

  const ALLOWED_ENDPOINTS = [
    'current/driverStandings',
    'current/constructorStandings',
    'current/next',
  ];

  if (!endpoint || !ALLOWED_ENDPOINTS.includes(endpoint)) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    const url = `${JOLPICA_BASE}/${endpoint}.json?limit=30`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PaddockIntel-Dashboard/1.0',
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `F1 API returned ${response.status}` });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'F1 data fetch failed', detail: err.message });
  }
}
