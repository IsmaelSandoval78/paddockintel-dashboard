Vamos a rediseñar SOLO el home de PaddockIntel con un diseño ya aprobado ("Telemetry at Dusk").
Todo el material está en `docs/design/home-dusk/` (HANDOFF.md, reference/, data/, DECISION-...md).

ORDEN OBLIGATORIA ANTES DE TOCAR CÓDIGO (no es una sugerencia):
1. Lee completos `docs/advisors/DATA-EXPERT.md`, `docs/advisors/SEO-EXPERT.md`, `docs/advisors/EEAT-EXPERT.md`
   y `docs/advisors/SPORTS-JOURNALISM-EXPERT.md`, y aplica sus checklists y sus etiquetas HOLD.
2. Lee `docs/design/home-dusk/HANDOFF.md` completo y abre `reference/home-reference.html` y las tres capturas.
3. Lee PRODUCT.md y el sistema de diseño actual. Este diseño los contradice a propósito: copia
   `DECISION-2026-10-11-home-dusk.md` a `docs/` y NO cambies el tema global ni ninguna otra página.

REGLAS:
- REGLA ABSOLUTA: nunca inventes datos, URLs, IDs ni cifras. Cada número del home sale de datos reales.
  Los únicos valores que puedes sembrar son los verificados de Singapur 2026 que vienen en el HANDOFF.
  Si un dato no existe para una carrera, se oculta el módulo; nunca un valor de relleno ni uno viejo.
- Migraciones de Supabase SOLO con la CLI, nunca pegando SQL en el dashboard.
- Conserva intactos los JSON-LD, las señales EEAT, los slugs, `trailingSlash: true` y next-intl (EN/ES/PT):
  todo texto nuevo va a los archivos de mensajes en los tres idiomas.
- Rama `v2-relanzamiento`. Nada a `main` hasta que yo lo revise en el preview de Vercel.
- Cuando me muestres código, entrégame siempre los archivos completos, nunca fragmentos ni diffs.

PLAN (primero muéstramelo y espera mi OK antes de implementar):
a) Tokens con scope solo al home (por ejemplo, un wrapper `.theme-dusk` con variables y @theme de Tailwind v4).
b) Componentes: HomeHeader, TerrainHero (traza de velocidad en 3 crestas), RaceGauges, PoleDuel, StandingsGlow,
   NextRaceCard, LatestFeed, NewsletterBand. Reutiliza las queries existentes del home/feed/standings/races.
c) Fuente de "race highlights" por carrera (la más pequeña que funcione) con campo de fuente en cada número;
   sembrada solo con Singapur 2026 + `data/singapore-2026-ver-pole-speed.json`.
d) Responsive como la referencia: 1440 / 820 / 390, sin scroll horizontal a 360 px.

VERIFICACIÓN AL TERMINAR:
- `tsc` limpio y build OK.
- Captura del home a 1440, 820 y 390 px junto a las de referencia.
- Confirma con datos reales que la clasificación muestra la de después de Singapur (Antonelli 340, Russell 238),
  y que los JSON-LD siguen pasando el Rich Results Test.
- Actualiza `docs/ROADMAP-SEMANA.md` con lo hecho y lo pendiente.
