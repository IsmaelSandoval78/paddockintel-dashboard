// Entry point: picks which story to load from the address bar.
//   /            the race template (data/race.json + cars.json)
//   /?session=q  the qualifying template (data/session.json)
// Each template is its own chunk, so one never downloads the other's data.
const params = new URLSearchParams(location.search)
const mode = (params.get('session') ?? params.get('mode') ?? '').toLowerCase()

if (mode === 'q' || mode === 'quali' || mode === 'qualifying') {
  import('./quali/main.js')
} else {
  import('./race.js')
}
