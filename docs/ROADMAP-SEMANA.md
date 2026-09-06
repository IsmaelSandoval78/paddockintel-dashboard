# Roadmap de la semana — PaddockIntel

Plan declarado por Ismael para una semana de sesiones intensas (arrancó 25 ago 2026).
Este doc se actualiza al final de cada sesión con el progreso real, no se deja como
aspiracional. Si algo cambia de prioridad o se descarta, se anota acá también, no se
borra sin dejar rastro.

**Cómo leer este doc:** las secciones "Los 5 pasos" de abajo son el estado *inicial*
(25 ago) — quedaron desactualizadas a propósito, no se reescriben, el progreso real se
agrega como secciones fechadas más abajo en el archivo. Si necesitás la verdad de HOY
sin leer todo el historial, usá esta tabla — se actualiza cada vez que algo cambia de
estado real, es la única parte de este doc que sí se edita en el lugar en vez de
apilarse.

## Estado real al 4 sep 2026 (la verdad de hoy, en una tabla)

| Paso | Estado real | Bloqueador real si lo hay |
|---|---|---|
| 1. Cloudflare | **Resuelto de verdad 4 sep: causa raíz era un `account_id` equivocado en `wrangler.jsonc`.** Deploy real verificado, 6/6 rutas con datos reales en 200. **Cron confirmado disparando solo el 5 sep** (ver detalle abajo) | Ninguno — listo para evaluar el corte de DNS en una sesión futura |
| 2. Blog/estructura | Maduro — tags relacionales, race_id, glosario con capas, `/about` conectado | Ninguno bloqueante |
| 3. Newsletter | Pipeline automatizado real (`generate_digest_draft.py`), Vol.06 publicado hoy | Gap sin llenar: faltan vol-03/vol-04 |
| 4. Who's Who | 19/34 voces con pick real. **Linkeado del nav 5 sep** — ruta promovida de `/whos-who-preview` (noindex) a `/whos-who` real, indexable, con metadata/i18n propios | 3 cuentas curadas sin servir (Piola/Slater/Davidson) |
| 5. Feed | MVP construido, reusa `digest_items`, localizado. **Linkeado del nav 5 sep** | Ninguno bloqueante |
| 6. Cuentas de usuario | **Completo de verdad, verificado en producción real el 6 sep 2026.** Proveedor Supabase Auth, schema + RLS aplicado, login con Google funcionando de punta a punta en `paddockintel.com`/`hub.paddockintel.com`, sesión compartida confirmada (mismo `auth.uid()` en ambos dominios), cookie de sesión con los 4 atributos correctos confirmados en DevTools real — ver detalle 6 sep más abajo | Sin diseño de UI de login todavía (tarea aparte, con su propio Design Gate) |
| 7. Vertical de datos puros | Decidido 24 ago, cero código, confirmado vivo hoy | Cero métricas definidas todavía |

**Hallazgos de auditoría de docs, 4 sep 2026 (aplicados o pendientes):**
- ✅ Corregido: `README.md` decía que las migraciones van por Supabase CLI — nunca fue
  así, siempre se corrieron a mano en el SQL Editor (no hay CLI/DB URL enlazada).
- ✅ Corregido: `README.md` decía "Deploy: Vercel" sin mencionar Cloudflare — sigue
  siendo cierto hoy (ver fila del Paso 1), pero ya no por descuido, por confirmación real.
- ✅ Corregido: `PRODUCT.md` seguía con los tokens visuales viejos (`#F4F4F0`) en vez de
  Vintage Editorial (`#EDE3D0`).
- ✅ Corregido: `docs/advisors/CYBERSECURITY-EXPERT.md` existe desde hace tiempo pero
  nunca entró al "advisor gate" que `CLAUDE.md`/`SKILL.md` describen como "los cuatro
  advisors" — ahora son cinco.
- ✅ **Cerrado, no pendiente:** `docs/DEPENDENCY-SECURITY.md` tenía "0 vulnerabilidades"
  (25 ago) desactualizado — el `npm install` de hoy mostró 5 nuevas (adm-zip high,
  browserslist high×2, qs moderate×2). Triagadas y trazadas: ninguna tiene superficie
  de ataque real (adm-zip solo procesa un ZIP autogenerado en deploy manual,
  browserslist es build-time puro, qs solo corre en `wrangler dev` local). Decisión:
  **riesgo aceptado**, no se aplica el fix porque revertiría `@opennextjs/cloudflare`
  a 1.19.11 y reintroduciría el hang de población de R2 ya resuelto la semana pasada.
  Detalle completo en `docs/DEPENDENCY-SECURITY.md`.
- ⚠️ **Sin resolver, no bloqueante:** `docs/WHOS-WHO-FASE0-CANDIDATES.md` no refleja
  todavía que Piola/Slater/Davidson no sirven para el mecanismo de picks (ver sección
  de Who's Who más abajo) — la lista de 34 sigue "aprobada" tal cual, sin la nota.

## Los 5 pasos, en orden

### 1. Migración a Cloudflare
**Estado, corregido 4 sep 2026 — hallazgo real durante el pre-flight check antes de un
corte de DNS planeado: el "deploy exitoso" documentado abajo (27 ago) NO EXISTE en la
cuenta real de Cloudflare (`551a6aba58a779d10acae0c5f0cde1e8`,
`sandoval.ismael@gmail.com`).** Entrando al dashboard real: "Workers & Pages" muestra
**cero proyectos** ("No projects found — you have not created any projects yet."), 0
requests / 0 worker invocations en el período actual. El deploy a
`paddockintel-dashboard.paddockintel.workers.dev` con 9 objetos en R2 y exit code 0 que
el texto de abajo describe como verificado **nunca llegó a esta cuenta** — probablemente
corrió en un Codespace/entorno cuya sesión de `wrangler login` nunca se conectó a la
cuenta real, o contra una cuenta distinta nunca reconciliada. Cualquiera sea la causa,
el resultado es el mismo: nada de la infraestructura real de Cloudflare existe hoy.

**Lo que sí es real, verificado en código:** `open-next.config.ts` tiene
`r2IncrementalCache` activo, `wrangler.jsonc` tiene los bindings de R2/DO Queue/cron
configurados, `custom-worker.ts` existe con el handler `scheduled`. **Lo que NO es
real, pese a estar documentado como hecho:** ningún Worker desplegado en la cuenta,
ninguno de los 4 secrets (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
`RESEND_API_KEY`, `DRAFT_SECRET`) puesto de verdad vía `wrangler secret put` contra
esta cuenta (no hay Worker al cual atarlos), ninguna población de R2 que haya
persistido.

**Producción nunca estuvo en riesgo:** `hub.paddockintel.com` sigue con CNAME real a
`d878f4083bbdeec6.vercel-dns-017.com`, DNS only (sin proxy), TTL Auto (~300s, ya
suficientemente bajo para un rollback rápido el día que se corte de verdad). Vercel
sirvió el 100% del tráfico real todo este tiempo.

**Próximo paso real antes de considerar cualquier corte de DNS:** correr
`opennextjs-cloudflare deploy --rclone` de verdad contra la cuenta real, confirmar que
el Worker aparece en el dashboard de Workers & Pages (no solo un exit code limpio en
terminal), volver a poner los 4 secrets contra ese Worker real, y recorrer todo el
checklist de `docs/CLOUDFLARE-MIGRATION.md` desde el paso de deploy en adelante — no
asumir que nada fechado 25/27 ago sigue vigente sin re-verificarlo contra el dashboard
primero.

Detalle completo del hallazgo y del historial previo (con la corrección aplicada):
`docs/CLOUDFLARE-MIGRATION.md`.

**Cierre real, mismo día 4 sep 2026 — causa raíz encontrada y arreglada, deploy
verificado de punta a punta:**

`wrangler.jsonc` tenía `account_id` hardcodeado a `dbf60dad00f30c6d52b094b3ec552f73` —
una cuenta que no es la de Ismael. El deploy "exitoso" del 27 de agosto corrió contra
esa cuenta ajena todo este tiempo; nunca desapareció de la cuenta real porque nunca
estuvo ahí. Corregido a `551a6aba58a779d10acae0c5f0cde1e8` (`sandoval.ismael@gmail.com`).

**Verificado con herramientas propias en esta sesión:** `wrangler login` real contra la
cuenta correcta, `opennextjs-cloudflare deploy --rclone` con exit code 0, R2 poblado sin
hang (15 entradas), cron desplegado, el Worker `paddockintel-dashboard` confirmado en el
dashboard real (no solo en la terminal), los 4 secrets presentes por nombre
(`SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET`/`RESEND_API_KEY`/`DRAFT_SECRET`), y HTTP 200
real en `/`, `/es/`, `/pt/` y `/es/weekly/` (con contenido real, no página de error).

**Reportado por Ismael, hecho en sus propias terminales/dashboards, no re-verificado de
forma independiente en esta sesión:** `CRON_SECRET`/`DRAFT_SECRET` regenerados
(`openssl rand -hex 32`, este Mac/Codespace no tenía los originales), `RESEND_API_KEY`
regenerada en el dashboard de Resend con la vieja revocada, todo sincronizado entre
Cloudflare y Vercel con redeploy de Vercel confirmado, y un `curl POST` real a
`/api/digest/send` en Vercel con el `CRON_SECRET` nuevo devolviendo 200 (confirma que la
rotación de secrets no rompió el cron de Vercel que sigue activo).

**Gap real encontrado al cruzar datos, confirmado por Ismael como un olvido simple:**
`CRON_SECRET` nunca se agregó a `.env.local` local (solo está `DRAFT_SECRET`) — no
bloquea nada hoy, pero conviene cerrarlo antes de que confunda a futuro.

**Estado real ahora: Worker funcional en la cuenta correcta, con los 4 secrets
sincronizados. El DNS sigue apuntando 100% a Vercel — el corte no se hizo hoy, a
propósito.** Antes de evaluarlo en una sesión futura: ~~(1) probar más rutas reales
contra el Worker de Cloudflare directamente~~ — **✅ hecho el mismo día 4 sep**: 6/6
rutas verificadas (`/es/circuits`, `/es/drivers`, `/es/about`, `/es/weekly`,
`/es/magazine-home`, `/api/health`), las 6 devuelven 200 siguiendo el redirect de
`trailingSlash: true` (308 en el primer request, esperado). `/about` confirmado
sirviendo la bio real desde la tabla `authors` ("F1 economic intelligence by Ismael
Sandoval...") — no contenido de placeholder, dato real de Supabase renderizando en el
Worker real.

**✅ Confirmado 5 sep 2026: el cron de Cloudflare disparó solo, sin forzarlo, en su
horario real** (punto 2 del pendiente de arriba). Verificado en el dashboard real de
Cloudflare (`Settings → Trigger events` del Worker `paddockintel-dashboard`, cuenta
`551a6aba58a779d10acae0c5f0cde1e8`):
- El campo **"Next"** del cron trigger mostraba "Sun, 06 Sep 2026 09:00:00" — Cloudflare
  ya daba por ejecutada la corrida de hoy (5 sep, 09:00 UTC), lo cual solo ocurre si
  disparó de verdad.
- **Metrics → Invocations** (últimas 24h): una invocación aislada, exactamente en punto
  (05:00 hora local del dashboard = 09:00 UTC), sin mezclarse con el tráfico HTTP manual
  de la verificación de rutas de ayer (ese tráfico aparece disperso, no en punto exacto
  — patrón consistente con un cron real vs. curls manuales).
- **Metrics → Subrequests** de esa ventana: 100% `2xx` contra `supabase.co`, cero 4xx/5xx
  en toda la ventana de 24h.
- **Limitación de esta verificación:** `Workers Observability/Logs` está deshabilitado en
  este Worker (plan free), así que no hay log textual línea por línea (el
  `console.error('digest send cron failed...')` de `custom-worker.ts` no quedó
  registrado en ningún lado retroactivamente consultable) — la confirmación es por
  métricas agregadas (invocación única sin errores + subrequests todos 2xx), no por el
  texto exacto de la respuesta. Suficiente para confirmar que disparó y no falló, no
  para saber si esa corrida mandó un digest real o devolvió "no issues to send" (ambos
  devuelven 200 en la ruta).

**Con esto, los 3 pasos del "próximo paso real" de la sección de arriba quedan
completos.** Antes de evaluar el corte de DNS en una sesión futura, sigue siendo buena
idea habilitar `Workers Observability` (gratis en el plan free, con retención acotada)
para tener logs reales de la próxima corrida en vez de solo métricas agregadas — no
bloqueante, pero da mejor visibilidad el día que se decida cortar.

### 2. Estructura de blog
**Estado: en curso — base de datos real ya existía (315 artículos), extendida esta sesión.**

**Corrección importante:** no se arrancaba de cero como se asumió al inicio de la semana —
ya existían **315 artículos publicados** en la tabla `articles` de Supabase, con su propio
esquema (`translation_group_id` + `locale` en vez de tabla canónica separada — patrón
equivalente y más simple al que se había diseñado desde cero, no hizo falta migrar).

**Migración aditiva aplicada** (sin romper ninguna de las 315 filas existentes):
- `content_type` agregado (`original_analysis`/`aggregated_brief`/`recap`), backfill de
  las 315 filas existentes a `original_analysis` (todo lo escrito hasta ahora es propio)
- Tabla `authors` creada, con la fila de Ismael Sandoval
- `author_id` agregado a `articles`, backfill de las 315 filas al id de Ismael
- Tabla `article_sources` creada (vacía por ahora — implementa la regla de citación
  definida en la sesión anterior, lista para cuando arranque el pipeline de agregación)
- `tags` (text[]) y `sources` (jsonb) existentes NO se tocaron — quedan como están,
  decisión de refactor futuro cuando se construya la personalización del newsletter v2

**Tagging real ya construido esta sesión** — segunda migración aditiva aplicada sobre
los 315 artículos existentes:
- Se auditaron los 45 valores distintos que vivían en `articles.tags` (text[]) — se
  encontró fragmentación real: mismo concepto tageado en 3 idiomas distintos sin vínculo
  entre ellos (ej. `race-analysis`/`analisis-de-carrera`/`analise-de-corrida`), y dos
  taxonomías mezcladas en un solo campo (equipos + temas editoriales + formato)
- Tabla `tags` creada (33 conceptos canónicos, categorías: `team`/`topic`/`format`/
  `series`/`region`) + `article_tags` (relación muchos-a-muchos), pobladas a partir de
  fusionar los tags viejos por concepto (no por idioma) — 870 relaciones generadas
- `season_year` (int) agregado a `articles` — el tag `season-2026` (75% de los artículos)
  resultó ser metadata estructural disfrazada de tag, se extrajo a un campo propio en vez
  de vivir en la tabla de tags. 237/315 artículos quedaron con el campo poblado
- `japanese-gp`/`miami-gp` (nombres de carrera como tag) se descartaron a propósito de la
  migración — se resolverán después vía `articles.race_id` → tabla `races` (pendiente
  aparte, `race_id` está NULL en las 315 filas hoy), no como tags de texto
- `hub` (tag de significado ambiguo, 3 usos) se descartó sin reemplazo, confirmado
  innecesario por Ismael
- `articles.tags` (text[]) viejo **no se tocó** — convive con la tabla nueva hasta
  confirmar que la migración está completa; el drop queda para una sesión futura
- RLS/grants de las tablas nuevas ya aplicados con el fix de seguridad (solo `SELECT`
  para `anon`/`authenticated`, sin `TRUNCATE`/`MAINTAIN`)

**Pendiente real que queda:** backfillear `articles.race_id` para poder resolver
`japanese-gp`/`miami-gp` y cualquier referencia a carrera específica de forma estructural,
no como texto libre.

**Sub-línea: contenido educativo evergreen (glosario F1).**
Inspirado en aiweekly.co/learning-ai — contenido educativo, no noticioso, con vida útil
larga. Estrategia definida esta sesión:

- **Formato de niveles de profundidad**, no un glosario plano: cada término con 2-3 capas
  (ELI5 con analogía simple primero → explicación técnica estándar → nivel "reglamento FIA"
  para quien quiere el detalle real). Esto da 2-3 URLs indexables por término en vez de 1,
  cada una atacando una intención de búsqueda distinta — diferenciador real frente a
  competidores (The Race, Red Bull, ESPN, Motorsport.com) que solo cubren un nivel.
- **Formato "por qué cambió"**: para términos donde el reglamento se modificó (ej. DRS
  reemplazado en 2026), explicar cómo funcionaba antes vs ahora y por qué cambió — extiende
  la vida útil del contenido evergreen porque se puede actualizar con el tiempo.
- **Comparativas cruzadas con otros deportes** (ej. "el undercut es como robar base en
  béisbol") para ampliar audiencia más allá de fans que ya saben todo.
- **Priorizar términos poco cubiertos por la prensa grande** en vez de competir de entrada
  por términos saturados (DRS, por ejemplo, ya está muy cubierto por medios con dominios
  mucho más fuertes — mejor arrancar por términos técnicos menos explotados: undercut,
  parc fermé, efecto suelo, reglas nuevas de 2026).
- **Interlinking automático** desde los artículos del blog (paso 2) hacia el glosario:
  cada mención de un término técnico en una noticia enlaza al glosario. Multiplica tráfico
  interno y da señal de autoridad temática completa a Google.

**Método de investigación de temas (minería de preguntas reales, no adivinar):**
Validado con búsqueda real que "qué es DRS" es citado explícitamente por al menos un
medio como una de las preguntas de F1 más buscadas — confirma que la demanda de búsqueda
de este tipo de contenido es real, no asumida.

APIs de Reddit y Quora investigadas para minería de preguntas — conclusión: no vale la
pena automatizar para este volumen de trabajo:
- **Reddit**: tiene API, nivel gratis existe (100 queries/min) pero restringido a uso
  *no comercial* — PaddockIntel probablemente cae en la categoría comercial de Reddit,
  donde el precio salta a ~$12,000/mes sin escalón intermedio. Recomendación: uso manual
  esporádico de r/formula1, no automatizar.
- **Quora**: no tiene API pública de datos (solo tiene API de Poe, su plataforma de
  chatbots, que no sirve para esto). Cualquier "API de Quora" no oficial viola sus
  términos. Recomendación: revisión manual únicamente.
- **Alternativa práctica recomendada**: búsqueda manual en Google (autocompletar +
  "la gente también pregunta") para detectar preguntas reales sin tocar ninguna API
  restringida. Suficiente para el volumen de este proyecto (elegir temas de glosario,
  no monitoreo en tiempo real). n8n se reserva para automatizar publicación una vez que
  el pipeline del paso 2 esté corriendo, no para esta fase de investigación de temas.

**Idea evaluada y aparcada: "F1 para niños".**
Validada con evidencia real: la F1 oficial ya tiene "F1 Kids" (transmisión con DAZN en
español, presentadores jóvenes, avatares 3D, explicaciones simples). Hueco identificado:
poco contenido *escrito* en español para ese público, la oferta existente es solo video.
**Consideración legal pendiente si se retoma**: si la sección se marketea explícitamente
como dirigida a niños, aplica COPPA (EE.UU.) — restringe recolección de datos personales
sin consentimiento parental, afecta si se puede poner el mismo formulario de newsletter
o los mismos scripts de analytics/ads que en el resto del sitio. Requeriría una sección
separada con su propio tratamiento de datos. No descartada, pero no es próximo paso.

### 3. Newsletters
**Estado: research de arquitectura hecho, nada construido.**
Referencia: aiweekly.co, formato de "issue" modular. Módulos identificados:
- Lede editorial (síntesis del día, itálica, con links a fuentes)
- "In the Wild" — señales tempranas antes de la prensa
- "Quick Hits" agrupados por tema (no cronológico)
- Análisis profundo de un evento ancla (para F1: la próxima carrera/clasificación)
- "Key Takeaways" — resumen accionable
- "Found First" — investigación propia antes que la prensa
- Encuesta semanal con resultados de la anterior
- Navegación issue anterior/siguiente + contador real (ej: "525 of 649")

**Decisión de integridad tomada:** nunca backdatear el número de Issue real ni su fecha
de publicación — sería fabricar metadata, viola la regla de nunca inventar datos.
Para volumen de contenido retroactivo, usar la serie separada de "Recaps" (ver más abajo),
con numeración independiente.

### 4. "Who's Who" — mapa de atención experta
**Estado: Fase 0, Fase 1 y arranque de Fase 2 completados (3 sep 2026) — ver secciones
al final del documento. Fase 2 corre semi-manual, no clustering automático con LLM
(ver por qué en la sección de cierre). Más caro que el paso 5.**
Referencia: aiweekly.co/whos-who — motor de escucha social que agrupa reacciones de
expertos por evento/tema, clasifica por "lente" (crítica, construcción, investigación...),
asigna peer-trust score.

Bloqueadores reales:
- Necesita lista curada de 30-50 voces creíbles de F1, con criterio defendible
  (acreditación, rol técnico verificable) — no armada todavía.
- Fuente de datos social: confirmar si hay acceso de **desarrollador pagado** a la API
  de X (~$200/mes mínimo) o si se arranca solo con Bluesky (API abierta, gratis, pool
  más chico de gente F1) — Ismael no tenía claro el tipo de acceso a X que tiene.

**Hallazgo clave (abarata mucho el MVP):** X ofrece embeds gratuitos vía `publish.x.com`
— tanto de un post individual como de un timeline de perfil completo, sin necesidad de
la API paga. Sirve perfecto para la idea original de Ismael ("link a perfil de X con
scorecard del último tweet"). Limitación: el timeline embed es frágil/poco confiable
fuera de WordPress según reportes de 2026; para un caso simple (un post destacado por
persona) debería andar bien.

Lo que el embed gratuito NO resuelve: clasificación automática por tema/lente y detección
automática de tendencias — eso necesita o API paga, o proceso editorial semi-manual
(Ismael eligiendo qué destacar, con ayuda de n8n + LLM para clasificar).

Roadmap interno en 4 fases (Fase 0: lista curada → Fase 1: ingesta mínima de un source →
Fase 2: clustering/clasificación con LLM → Fase 3: UI mínima mostrable). Fase 4
(trust scoring) no bloquea el lanzamiento.

### 5. Feed estilo "F1 news today"
**Estado: MVP construido y en vivo (4 sep 2026) — ver sección propia más abajo para el
detalle completo.** `/feed` reusa `digest_items` en orden cronológico continuo, con
contador real de "más mencionados esta semana". **Linkeado del nav el 5 sep 2026**
(sección magazine de `NavLinks`/`MobileNav`, ambos desktop y mobile), sumado a
`app/sitemap.ts` para indexación (EN/ES/PT).

### 6. Cuentas de usuario (Google + email, personalización) — de docs/DECISIONS-2026-08-24-radical-pivot.md
**Estado: decidido el 24 ago, cero código — confirmado vivo (no abandonado) el 4 sep 2026.**
Auth: Google OAuth + email, proveedor final sin decidir (Supabase Auth es el candidato
natural, pero falta verificar compatibilidad actual con Cloudflare antes de comprometerse).
Personalización: seguir constructores/pilotos/"expertos" (Who's Who, paso 4). Regla ya
establecida: la personalización cambia el *orden* del contenido, nunca fabrica ni reordena
rankings/resultados oficiales — mismo principio que ya rige Mi Box. Requiere política de
privacidad real antes de lanzar cuentas (ver `docs/advisors/EEAT-EXPERT.md`).
**Bloqueadores reales:** proveedor de auth sin decidir; sin diseño de UI todavía.

**Actualización 6 sep 2026 — schema y clientes de auth implementados, verificación final pendiente de entorno real (NO marcar como completo):**

Proveedor confirmado: Supabase Auth, integrado vía el Worker de Cloudflare (que es esta misma app Next.js/OpenNext, no un worker separado) con la Anon key + JWT de sesión — nunca la Service Role key, para que RLS se aplique de verdad.

**Auditoría previa a codear (misma sesión):** 30/31 tablas del schema ya tenían RLS habilitado; `driver_career_history` era la única excepción (sin RLS, pero sin grants a `anon`/`authenticated` tampoco — no explotable, pero inconsistente). `lib/supabase/server.ts` confirmado usando *siempre* la Service Role key (bypasea RLS por completo) — de ahí la necesidad de un cliente de auth completamente separado. `http` extension no instalada (sin vector de SSRF por esa vía). CLI de Supabase confirmado desalineado desde el 9-jul (10 migraciones con `remote: ""` pese a estar vivas en la DB) — **no se reparó, sigue pendiente como tarea aparte**.

**Schema aplicado y verificado contra la DB real** (`supabase/migrations/20260906120000_user_accounts.sql` + `20260906130000_driver_career_history_grant.sql`, ambas corridas vía `supabase db query --linked -f` — el `db push` normal sigue bloqueado por el desalineamiento del CLI, no se forzó con `--include-all`):
- `driver_career_history`: RLS habilitado + policy SELECT abierta, igual que las otras 30 tablas. **Bug real encontrado y corregido en el camino:** la primera migración habilitó RLS y la policy pero se olvidó el `GRANT SELECT` que la policy necesita para tener efecto — sin eso, la policy quedaba inerte (mismo resultado que antes: `anon` seguía recibiendo "permission denied"). Detectado probando con la Anon key real, no asumiendo que la migración funcionó. Corregido con una segunda migración, reverificado con una query real.
- `user_profiles` (1:1 con `auth.users`) y `driver_follows`/`constructor_follows`/`expert_follows` (3 tablas separadas, no una genérica, para preservar FKs reales — `drivers.id`/`constructors.id` son `integer`, `experts.id` es `uuid`): RLS habilitado, policies exactas (select/insert/update propios en profiles sin delete; select/insert/delete en follows sin update), GRANTs verificados (`authenticated` tiene exactamente lo esperado, `anon` no tiene nada en ninguna de las 4). Todo confirmado con `pg_policies`/`information_schema.role_table_grants` y con queries reales usando la Anon key (que devuelven "permission denied" en las 4 tablas de cuentas, como corresponde).
- `user_preferences` deliberadamente no creada — sin un campo real que guardar todavía (eso es del wizard de newsletter v2, fuera de alcance).

**Decisión de producto tomada esta sesión:** un solo login, sesión compartida entre `paddockintel.com` y `hub.paddockintel.com` (no dos sesiones separadas) — los follows cubren tanto drivers/constructors (Hub) como experts (magazine), tiene que ser una sola cookie de sesión con `Domain=.paddockintel.com`.

**Hallazgo real serio, encontrado con Chrome real, no asumido de la documentación:** la config inicial (`httpOnly: true` compartido entre el cliente server y el cliente browser) **rompía el login por completo**. Un `document.cookie = "...; HttpOnly"` no queda "escrito sin la protección" — Chrome rechaza la escritura entera, la cookie nunca se guarda. El verifier de PKCE (que el *browser* tiene que escribir antes de redirigir a Google/mandar el magic link) nunca llegaba a existir, así que el callback nunca podía validar el código de vuelta. Corregido separando la config: `authServerCookieOptions` (`httpOnly: true`, para la cookie de sesión final, que sí se escribe server-side vía un `Set-Cookie` real) y `authBrowserCookieOptions` (`httpOnly: false`, para lo que escribe el browser, que nunca puede ser httpOnly de verdad de todos modos). Confirmado con Chrome real después del fix: `signInWithOtp()` completa sin error y las 3 cookies del verifier PKCE quedan escritas y visibles.

**Lo que queda pendiente de verificar, explícitamente, y por qué no es una duda sobre el código:**
1. El flujo completo con `Domain=.paddockintel.com` real, de punta a punta (login → callback → usuario autenticado).
2. Que `auth.uid()` se resuelva igual en Route Handlers corriendo en `paddockintel.com` y en `hub.paddockintel.com` con la misma cookie de sesión.

Ninguna de las dos se puede probar en `localhost` — confirmado empíricamente: un navegador nunca acepta un `Set-Cookie`/`document.cookie` con `Domain=.paddockintel.com` viniendo de un origen `localhost` (mismatch de dominio real, no un bug). Se decidió explícitamente no editar `/etc/hosts` para simular el dominio real. Quedó pendiente de confirmar en un entorno desplegado real — resuelto el mismo día, ver abajo.

**Verificación end-to-end en producción real, 6 sep 2026 — completa, con 3 problemas reales encontrados y corregidos en el camino (ninguno era un bug del código de la sesión anterior):**

Para probar el flujo real sin construir la UI de login todavía, se armó un harness descartable (`/test-login` con un botón "Sign in with Google", y `/api/auth/whoami` devolviendo `auth.uid()` en texto plano) y se deployó a producción de verdad — lo que reveló que **`v2-relanzamiento` nunca había llegado a producción**: Vercel trackea `main` como rama de producción, y `main` estaba 71 commits atrás. Se mergeó `v2-relanzamiento → main` (sin conflictos reales, confirmado antes de mergear que el único commit exclusivo de `main` tenía el mismo árbol que `v2-relanzamiento` en ese punto) y se pusheó — recién ahí todo el trabajo de la semana (recaps, cuentas, nav, etc.) quedó realmente en vivo.

Con el harness ya en producción, tres fallas reales, cada una encontrada con evidencia real (logs de Vercel, logs de Auth de Supabase, DevTools) antes de aplicar el fix, nunca asumidas:

1. **`redirect_uri_mismatch` de Google** — Google Cloud Console solo tenía autorizada la URL del callback de *esta app*; el primer salto real del flujo (Supabase → Google) usa el callback propio de Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`), que no estaba registrado. Corregido por Ismael en Google Cloud Console.
2. **Redirect a `localhost:3000` en vez del dominio real** — causa real: `paddockintel.com` redirige (308, a nivel Vercel) a `www.paddockintel.com`, y el allow-list de Redirect URLs en Supabase (Authentication → URL Configuration) solo tenía las variantes sin `www`. Sin match, Supabase cae al `Site URL` default, que seguía en `http://localhost:3000` desde la configuración inicial del proyecto (nunca actualizado). Corregido agregando `https://*.paddockintel.com/api/auth/callback` (wildcard) al allow-list — cubre `www` y cualquier subdominio futuro de una sola vez.
3. **`exchangeCodeForSession failed: Legacy API keys are disabled`** — Supabase migró a un sistema de keys nuevo (`sb_publishable_...`/`sb_secret_...`) y deshabilitó las keys legacy en formato JWT específicamente para llamadas de Auth (las queries de solo lectura vía PostgREST con la `service_role` legacy seguían funcionando bien, por eso el resto del sitio nunca mostró síntomas). La `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel seguía siendo la JWT vieja (`.env.local` local ya tenía la nueva, de ahí que nadie lo hubiera notado antes). Corregida vía Vercel CLI (`vercel env rm`/`vercel env add` — la UI del dashboard de Vercel no persistía el cambio por algún bug de esa sesión de edición, confirmado con `vercel env pull` antes y después) con el valor nuevo `sb_publishable__zgx9xGNfY8OtNKHIsqorA_5loEHLB7`, seguido de `vercel redeploy` sobre el deployment de producción existente.

**Confirmado con evidencia real, no por lógica:**
- `https://paddockintel.com/api/auth/whoami/` y `https://hub.paddockintel.com/api/auth/whoami/`, misma sesión real (login con Google completado por Ismael) → **mismo `auth.uid()` exacto** (`bc154135-d0c9-4b61-94f7-a1daf89a7192`) en ambos dominios.
- Cookie de sesión real inspeccionada en DevTools → Application → Cookies: `sb-ozcmecoaofolbrzhlhum-auth-token.0`/`.1` (chunkeada), `Domain: .paddockintel.com`, `HttpOnly ✓`, `Secure ✓`, `SameSite: Lax` — los 4 atributos exactos, confirmados visualmente, no asumidos por el código.
- Cookies del verifier PKCE (`...code-verifier`) confirmadas SIN `HttpOnly` marcado en la misma captura — exactamente el diseño esperado (`authBrowserCookieOptions`).

**Limpieza aplicada, misma disciplina que las verificaciones anteriores:** borrados `/test-login`, `/api/auth/whoami`, y el logging de diagnóstico temporal que se había agregado a `app/api/auth/callback/route.ts` para encontrar el error #3 (revertido a su versión limpia). Pendiente que Ismael borre el usuario de prueba de Google desde el dashboard de Supabase Auth.

**Lo único que falta de verdad para "cuentas de usuario" como feature completa:** la UI real de login (botón/página con diseño, i18n, Critique Gate) — no arranca todavía, es tarea aparte.

**Texto de privacidad** (`locales/en.json`/`es.json`/`pt.json`, `app/[locale]/privacy/page.tsx`) reescrito para divulgar la recolección de datos de cuenta (antes decía literalmente "no recolectamos nada más, sin cookies de rastreo", que dejaba de ser cierto) — confirmado por Ismael antes de subir.

### 7. Vertical de datos puros (pace indices, métricas propietarias) — de docs/DECISIONS-2026-08-24-radical-pivot.md
**Estado: decidido el 24 ago, cero código — confirmado vivo (no abandonado) el 4 sep 2026.**
Expande PaddockIntel de "ángulo económico" a también cubrir análisis estadístico profundo
propio (pace index, métricas que hoy no existen en ningún medio de F1 a este nivel de
profundidad) — apuesta de producto real, no un feature más. Regla no negociable: toda
métrica nueva necesita una página de metodología pública antes de citarse en cualquier
lado (`docs/advisors/DATA-EXPERT.md`). El pipeline batch de FastF1 (§18 de SKILL.md) es
el backbone computacional candidato; el Optiplex casero (ver infraestructura de
automatización abajo) puede escalar cómputo adicional si hace falta.
**Bloqueador real:** cero métricas definidas todavía, ni siquiera un primer candidato.

## Infraestructura de automatización: Optiplex + n8n

Ismael tiene un servidor Optiplex corriendo n8n en su red local, expuesto vía
Cloudflare Tunnel (IP pública estable, sin abrir puertos). Esto es el motor candidato
para automatizar los pasos 2, 4 y 5:
- Puede recibir webhooks (de Supabase, del sitio)
- Puede escribir directo a Supabase vía PostgREST con la `service_role` key
- Puede correr workflows periódicos: leer RSS (prensa F1, Bluesky), pegarle a un LLM
  para resumir/clasificar/taggear, insertar en Supabase
- Evita meter esa lógica dentro de límites de ejecución de Cloudflare Workers
- Nota de esta sesión: no usar n8n todavía para minería de preguntas de Reddit/Quora
  (ver sección de glosario arriba) — eso es investigación manual puntual, no un workflow
  recurrente. n8n entra cuando haya pipeline de contenido corriendo (paso 2).

## Idea aprobada: serie de "Recaps" retroactivos

En vez de backdatear ediciones falsas del newsletter (rechazado — ver Newsletters arriba),
crear una serie separada **"Recap Vol. N"** cubriendo semana por semana desde el inicio
de la temporada 2026 hasta la fecha actual. Publicados con la fecha real de publicación
(agosto 2026), claramente etiquetados como retrospectiva — no fingiendo haberse escrito
en el momento.

A favor: como es explícitamente un recap, SÍ puede usar conocimiento posterior a propósito
("esto resultaría decisivo cuando en abril...") — ángulo editorial que el newsletter en
vivo no tiene. Numeración completamente independiente del contador real de Issue # del
newsletter en vivo (que arranca de cero el día que se publique la primera edición real).

Pendiente de decidir: cobertura exacta (¿desde enero 2026, una por semana calendario?),
formato (¿newsletter completo o versión más corta?).

## Home / storytelling del hub

**En pausa, deliberadamente, hasta después de los 5 pasos.**
Se evaluaron 4 direcciones visuales para un módulo de "campeonato en contexto"
(comparar qué tan reñido está el título actual vs los más reñidos de la historia),
usando el sistema Vintage Editorial v3.0.0 (kraft paper, terracota, Archivo Black,
JetBrains Mono). Ninguna aprobada — Ismael decidió no forzarlo y enfocarse en los
5 pasos primero.

## Estado al cierre de cada sesión

**26 ago 2026, madrugada (cierre de la sesión larga que originó este doc):**
- Cloudflare: secrets subidos (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, RESEND_API_KEY,
  DRAFT_SECRET), token de Cloudflare rotado, `@opennextjs/cloudflare` actualizado a
  1.20.2, deploy limpio verificado (sin secrets horneados)
- Pasos 2-5: solo research/arquitectura conversacional, nada construido en código todavía
- Este doc creado como punto de partida para las sesiones intensas de la semana
- Sesión de continuación (misma noche): estrategia de glosario educativo definida
  (niveles de profundidad + comparativas + minería manual de preguntas), APIs de
  Reddit/Quora investigadas y descartadas para automatización en esta fase, idea de
  "F1 para niños" evaluada y aparcada con nota de COPPA

## Newsletter v2 (futuro, NO esta semana): personalización tipo AI Weekly wizard

Referencia: aiweekly.co/intelligence/wizard — cada suscriptor arma su propia edición vía
un wizard de 4 pasos (rol → qué rastrear + señales a "boostear" → expertos a seguir →
cadencia + entrenamiento con votos ▲/▼ sobre historias reales de los últimos 7 días).
Mucho más sofisticado que un newsletter fijo para todos.

**Decisión: esto es v2, posterior a tener el newsletter básico (paso 3) funcionando.**
No mezclar con el trabajo de esta semana — riesgo real de no terminar nunca el newsletter
simple por perseguir la versión sofisticada primero.

**Arquitectura en capas, orden de construcción acordado:**

1. **Tagging del paso 2 como base** — cada artículo con metadata estructurada: equipo(s),
   piloto(s), tema, y "tipo de señal" (fichaje, sanción, resultado, análisis técnico,
   rumor de mercado...). Ya estaba planeado en el paso 2; ahora tiene un consumidor más.
2. **Newsletter fijo para todos primero** — el plan original del paso 3, sin personalización,
   funcionando de punta a punta antes de tocar nada de esto.
3. **2-3 "roles" predefinidos como filtros simples** (no texto libre todavía) — equivalente
   F1 del wizard: Fan casual, Fan técnico, Jugador de Fantasy F1, Seguidor de un equipo
   específico, Creador de contenido/periodista. Cada rol preselecciona qué señales importan
   por default.
4. **Tabla de preferencias de usuario en Supabase** — user_id + roles + equipos/pilotos que
   sigue + expertos que sigue (conecta con el paso 4, Who's Who) + señales boosteadas.
5. **Motor de filtrado simple** — intersección de tags con peso vía SQL al generar cada
   edición. No hace falta IA compleja en esta capa.
6. **Mecanismo de entrenamiento (▲/▼) y cadencia dinámica** — la pieza más elegante pero
   también la más postergable. Guardar votos del usuario sobre historias reales y ajustar
   pesos de sus tags con el tiempo. Cadencia dinámica (mandar en cuanto se acumulen
   suficientes historias relevantes para ESE usuario, no en fecha fija) es la parte
   genuinamente más difícil — al final de todo, no antes.

## Idea nueva: "F1 TV" — canal de video curado (sub-línea del paso 5)

Referencia: aiweekly.co/ai-tv — canal de video en loop, auto-curado de canales de YouTube
confiables, sin alojar ningún video (solo embeben el player oficial de YouTube y linkean
afuera — cero problema de copyright, cero costo de hosting). Organizado en 3 secciones:
"Curated by the experts" (selección editorial manual), "Trending & popular", "Straight
from the source" (entrevistas/podcasts largos).

**Por qué es atractivo:** probablemente el módulo más barato de todos los evaluados hasta
ahora. YouTube Data API v3 tiene tier gratis generoso (10,000 unidades/día) — alcanza de
sobra para consultar periódicamente una lista curada de 15-20 canales. Sin scraping de
redes sociales, sin costo de hosting de video, sin problema legal (mismo patrón que
YouTube permite a cualquier sitio).

**Equivalente F1:** canal con contenido de creadores reconocidos (Chain Bear, Peter
Windsor, Driver61, podcasts como Beyond the Grid) + oficial de equipos/F1 cuando aplique
+ análisis/reacciones post-carrera.

**Cómo se construiría (reusa infraestructura ya planeada):**
1. Lista curada de 15-20 canales de YouTube de F1 confiables (mismo criterio de
   curaduría que la lista de expertos del paso 4, pero para canales)
2. n8n consulta la YouTube Data API v3 periódicamente, guarda video ID + título +
   canal + vistas en Supabase
3. Frontend solo necesita el iframe embed oficial de YouTube para reproducir — nada de
   descargar ni alojar video

Se agrupa como sub-línea del paso 5 (mismo patrón de "agregación automática + tagging",
misma infraestructura de n8n) más que como paso separado nuevo.

## Regla de citación/agregación para el paso 5 (feed estilo "F1 news today")

Confirmado con un ejemplo real de aiweekly.co/ai-news-today: sí es legal y viable escribir
análisis propio sobre la cobertura de otro medio (ej. un "5 takeaways del GP de X" de otro
sitio), siempre que se cumpla el patrón de citación honesta:

**Permitido:**
- Resumen/análisis en palabras propias, nunca copiar párrafos del original
- Fuente citada explícitamente con nombre del medio + link de salida prominente
  (idealmente dos: uno arriba tipo "our brief →", uno abajo "Read the original article →")
- Agregar valor real encima de la nota original: cruzar varias fuentes, comparar cifras,
  sumar reacciones de expertos con sus links reales, sumar datos propios (Jolpica/OpenF1)
  que el original no tenía
- Mantener el título original citado como referencia ("Original headline: ..."), nunca
  apropiárselo como propio

**No permitido:**
- Copiar el artículo reordenado o "reescrito con sinónimos" sin agregar nada real
- Citas textuales de más de ~15 palabras sin comillas y sin necesidad real
- Presentar el análisis como 100% propio sin mencionar que parte de cobertura de otro medio

**Relación con EEAT (corrección importante de esta sesión):** citar bien NO construye EEAT
por sí solo — es la condición mínima para no PERDERLA al hacer agregación. Un sitio que
agrega sin citar bien no gana autoridad, corre riesgo real de ser detectado como contenido
de baja calidad/duplicado por los sistemas de Google (Helpful Content). Lo que realmente
construye Authoritativeness y Trustworthiness de forma positiva es el valor agregado
encima de la cita: el cruce de fuentes, el análisis propio, los datos propios de Jolpica/
OpenF1 — no la mecánica de citación en sí misma.

**Ya cubierto por `docs/advisors/EEAT-EXPERT.md`:** este patrón no es nuevo para el proyecto
— el advisor de EEAT ya anticipaba exactamente este caso en su sección "Expertise" (nunca
parafrasear la postura de un experto sin atribución) y en "New surface area" sobre el
feature de expertos ("la personalización no puede funcionar como pipeline de lavado de
contenido sin atribuir — si se muestra la postura de alguien, debe ser visiblemente de esa
persona, linkeada al original"). El paso 5 es el primer caso de uso concreto donde aplicar
esa regla ya existente, no una regla nueva.

## Contenido propio (Ismael Sandoval) vs contenido de agregación — cómo encajan

Dos tipos de contenido claramente distintos, que se complementan, no compiten:

1. **Contenido propio** (economía de F1, análisis estadístico profundo con datos propios de
   Jolpica/OpenF1) — el corazón editorial del sitio, lo único que construye **Experience**
   de EEAT de verdad. Nadie más puede escribirlo con la voz y el acceso a datos de Ismael.
2. **Contenido de agregación** (paso 5, briefs tipo "5 takeaways del GP X" citados y
   analizados) — volumen y frescura, no la voz principal. Mantiene el ritmo de publicación
   (2-3 piezas/día) sin depender de que todo sea 100% original, algo insostenible para una
   sola persona escribiendo.

**Jerarquía editorial:** el contenido propio pesa más — debería ser lo destacado en home,
lo elegido como "análisis profundo del evento ancla" del newsletter, y lo más impulsado en
redes. Los briefs de agregación son relleno de ritmo, no la propuesta de valor central.

**Implicación para el esquema de datos del paso 2:** agregar un campo `content_type` desde
el día 1 (`original_analysis` / `aggregated_brief` / `recap`) para poder filtrar y destacar
selectivamente en home/newsletter, aunque el feed del paso 5 muestre todo mezclado.

**Impacto en EEAT de cada tipo (distinción confirmada esta sesión):**
- Artículo propio con datos de Jolpica/OpenF1 → construye Experience y Expertise fuerte
- Brief de agregación bien citado → mantiene Trustworthiness (no la destruye), pero no
  construye Experience — en el mejor caso suma algo de Expertise si cruza fuentes con criterio

**Autoría:** aunque hoy Ismael es el único autor, el esquema de blog debería tener un campo
`author` real desde el día 1 (no hardcodeado), para escalar sin fricción el día que se sume
alguien más al equipo editorial.

## Pendiente crítico: página `/about` de Ismael Sandoval

**RESUELTO — ver la sección "`/about` de Ismael — resuelto" al final de este documento.**
Contenido histórico de esta sección sin modificar, se deja como registro de por qué se
marcó como bloqueador crítico en su momento.

Marcado como importantísimo esta sesión — es la pieza central de verificación de identidad
real que sostiene la "E" de Experience en todo el sitio. Ya requerida explícitamente por
`docs/advisors/EEAT-EXPERT.md`: *"Author byline present and consistent... Bio must state
real, verifiable background — no invented credentials, no vague 'F1 analyst' without
specifics"*.

Sin este `/about` sólido, cada byline de "Ismael Sandoval" en cada artículo apunta a nada
verificable — debilita el Trust de todo el sitio, no solo de un artículo. Tratar como
bloqueador temprano, no como tarea de "más adelante" — construirlo en paralelo al arranque
del paso 2 (blog), no después.

Pendiente de definir en una próxima sesión: contenido real del `/about` (background
verificable de Ismael — ver `/profile.md` para lo ya conocido: coordinador de estimación y
onboarding en Verst Logistics, background en retail/Amazon warehouse antes de eso — decidir
qué de esto es relevante mostrar como credencial de análisis de F1, y qué credenciales
específicas de F1/datos/economía respaldan la autoridad del autor).

## Multi-idioma: inglés + español ahora, portugués en fase 2

**Decisión final de esta sesión: arrancar YA con inglés + español, empezando por el
glosario (sub-línea del paso 2). Portugués queda explícitamente en el roadmap pero
recortado de esta semana — no descartado, pospuesto.**

**Por qué se recortó portugués de esta semana (decisión, no indecisión):**
- Ya hay mucho comprometido esta semana (Cloudflare, blog, newsletter, Who's Who, feed,
  glosario, `/about`) — cada idioma extra multiplica la carga de revisión en todo lo demás.
- Ismael es bilingüe real en español/inglés — puede auditar con criterio propio la calidad
  de la traducción al español. En portugués no tiene ese mismo control, dependería 100%
  del LLM sin poder verificar matices — choca con la regla de nunca publicar algo que no
  se puede verificar.
- Más seguro validar el proceso de traducción (glosario de términos que no se traducen,
  nivel de revisión) con un idioma auditable primero, antes de escalarlo a uno que no.
- La oportunidad de Brasil sigue siendo real y válida (ver razones abajo) pero la ventana
  se mide en meses, no en la urgencia de esta semana puntual — no justifica el riesgo de
  calidad ahora.

**Fase 2 (no esta semana): sumar portugués una vez que el proceso de traducción
inglés→español esté probado y estable.**

**Por qué portugués, no solo inglés/español:** Brasil es una de las bases de fans de F1 más
grandes y apasionadas del mundo (herencia de Senna, Interlagos), mercado desatendido en
contenido escrito de F1 en profundidad. No es un capricho, es oportunidad real de SEO/alcance.

**Estado de partida:** el routing por `[locale]` ya existe en la estructura de la app
(`app/[locale]/circuits`, etc.) — no se arranca de cero en infraestructura técnica.

**Por qué el glosario es el punto de entrada correcto:** cada idioma tiene intención de
búsqueda propia y separada en Google — "qué es DRS" / "what is DRS" / "o que é DRS" son
3 búsquedas distintas, no una traducida. Esto multiplica el SEO real ganado, no duplica
trabajo por duplicar.

**Priorización de qué se traduce, por tipo de contenido:**
1. **Glosario ELI5** — máxima prioridad, mejor ratio de SEO ganado vs esfuerzo (arranca ya)
2. **Contenido propio/análisis original** — alto valor pero más caro, necesita la voz real
   de Ismael en cada idioma, no traducción mecánica — prioridad futura, no de esta semana
3. **Briefs de agregación diaria (paso 5)** — menor prioridad, pero SÍ se traducen
   eventualmente (ver nota de complejidad abajo), no quedan encerrados en un solo idioma
   para siempre

**Método de traducción:** LLM asistido + revisión humana de Ismael siempre, nunca 100%
automático sin revisión — un término técnico mal traducido sería un error de calidad, no
solo de estilo. Requiere armar un pequeño glosario de términos que se quedan en inglés a
propósito en cada idioma (ej. "undercut" probablemente se usa tal cual en español/portugués
en la práctica de los fans, no traducido) para no sonar forzado.

**Estructura de URL:** paths (`/es/`, `/pt/`), no subdominios separados — mismo patrón visto
en aiweekly.co para contenido multi-idioma, coincide con el `[locale]` ya existente en la app.

**RESUELTO (2 sep 2026):** 17 términos nuevos escritos y publicados en formato de capas
(eli5/technical/fia), EN+ES, ver sección "Glosario — 17 términos en formato de capas,
completado" al final de este documento.

**Corrección de dirección de idioma (esta sesión):** el idioma fuente de los artículos
propios es **inglés**, traducidos a español y portugués — no al revés como se había asumido
inicialmente sin confirmar.

**Complejidad de traducir los briefs de agregación diaria (paso 5): baja técnicamente,
alta en carga de revisión.**
- Técnicamente fácil: reusa el mismo pipeline de n8n + LLM ya planeado para resumir/
  clasificar/taggear cada brief — traducir es una llamada más al mismo LLM, no arquitectura
  nueva.
- El costo real es la revisión humana a volumen diario: 2-3 briefs/día × 3 idiomas = 6-9
  piezas de texto diarias, insostenible de revisar todas con el mismo rigor que un
  artículo propio.
- **Estándar de revisión propuesto, distinto por tipo de contenido:**
  - Artículos propios → revisión completa de Ismael en cada idioma, siempre, sin atajos
  - Briefs de agregación → revisión tipo "spot-check" (muestreo, no el 100%), aceptando un
    estándar ligeramente menor a cambio de volumen sostenible — el prompt del LLM debe
    tener el glosario de términos que no se traducen bien definido, para minimizar errores
    desde el origen en vez de depender de corregir después
- **Alternativa más conservadora**: arrancar los briefs solo en inglés, sumar es/pt recién
  cuando el pipeline del paso 5 esté rodando de forma estable — evita cargar dos cosas
  nuevas a la vez (el feed + la traducción en volumen) desde el día 1. Pendiente de decidir
  cuál de las dos vías tomar al construir el paso 5.

## Hallazgo de seguridad: GRANT excesivo a nivel de schema completo — RESUELTO

Descubierto durante la migración de `content_type`/`authors`/`article_sources` (paso 2).
**No era un problema de esa migración puntual — era una configuración base de todo el
esquema**, encontrada en `supabase/migrations/00000000000000_baseline_schema.sql`:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
```

Esto le daba automáticamente `TRUNCATE`/`MAINTAIN`/`TRIGGER`/`REFERENCES` a `anon` y
`authenticated` en **cualquier tabla nueva** creada en el schema `public` — confirmado que
afectaba decenas de tablas existentes (`drivers`, `driver_stats`, `seasons`, `status`,
`sprint_results`, `subscribers`, y más), no solo un par sueltas.

**Por qué importaba:** `TRUNCATE` en Postgres **ignora completamente RLS** — no importa que
una tabla tenga policies de "solo lectura", el permiso de `TRUNCATE` es una puerta aparte.
El rol `anon` corresponde a la key pública que vive en el bundle de cliente del sitio
(`NEXT_PUBLIC_SUPABASE_ANON_KEY`), visible por cualquiera.

**Ya se había corregido puntualmente en dos lugares** antes de esta sesión (evidencia de
que no era la primera vez que se detectaba):
- La migración de `authors`/`article_sources` (corregida a solo `SELECT`)
- La migración de `delta_ribbon` (12 de agosto) — corregida ahí también, sin volver
  a arreglar `glossary_terms` retroactivamente en su momento

**RESUELTO en esta sesión (misma tarde del 27 ago).** Auditoría real vía SQL contra
las 37 tablas/vistas del schema `public` (no solo lo reconstruido de archivos de
migración), y corrección aplicada:

- Confirmado el exceso real: `REFERENCES, TRIGGER, TRUNCATE, MAINTAIN` en prácticamente
  todas las tablas para `anon` y `authenticated`, sin ningún caso de uso que lo
  justificara — el sitio solo lee, nunca necesita esos 4 privilegios desde el cliente
- **Hallazgo adicional serio, no esperado**: `subscribers` tenía RLS activado pero
  **cero policies** — es decir, `TRUNCATE` (que ignora RLS de todos modos) podía vaciar
  la tabla completa de suscriptores del newsletter sin ninguna barrera. Confirmado con
  grep que los únicos 3 usos reales de `subscribers` en el código corren 100%
  server-side con `service_role` (rutas `/api/subscribe`, `/api/unsubscribe`,
  `/api/digest/send`) — ningún cliente `anon`/`authenticated` la toca nunca
- Migración aplicada (`REVOKE ... ON ALL TABLES IN SCHEMA public FROM anon,
  authenticated`, más excepción para dejar `SELECT` donde ya existía): las 33
  tablas/vistas quedaron con solo `SELECT` para `anon`/`authenticated` (o `(none)` en
  el caso de `subscribers`, que no necesita nada)
- `ALTER DEFAULT PRIVILEGES` revocado **sin reemplazo automático** — de ahora en más,
  cualquier tabla nueva no recibe ningún grant por default; hay que otorgarlo
  explícitamente en su propia migración (mismo patrón ya usado hoy con
  `authors`/`tags`/`article_sources`)
- Verificado con la misma consulta de auditoría después de aplicar: resultado exacto
  al esperado, sin sorpresas

**Nota aparte, no bloqueante:** algunas tablas (`constructors`, `lap_times`,
`qualifying`, `series`, `sprint_results`, `status`, `constructor_stats`,
`driver_stats`) muestran `authenticated: (none)` — esto ya era así **antes** de esta
migración (no es una regresión de hoy), puede ser intencional o un gap menor separado,
sin urgencia.

## Backfill de articles.race_id — completado (Fase 1)

Resuelto lo que quedaba pendiente de la migración de tags: `japanese-gp`/`miami-gp`
dependían de resolverse vía `race_id` en vez de tags de texto libre.

**Hallazgo clave antes de tocar nada:** el matching por tag (`japanese-gp`/`miami-gp`)
solo hubiera cubierto 12 de 74 casos reales — muchos artículos mencionan la carrera en
el título (ej. "Suzuka") sin tener el tag correspondiente. El conteo inicial de "74 filas"
también se corrigió a "27 historias × 3 idiomas = 81 filas candidatas" al agrupar
correctamente por `slug`/`translation_group_id` en vez de por fila individual.

**Resultado de la Fase 1 (matching de alta confianza, año + nombre de carrera/circuito
inequívoco):**
- 19 historias (57 filas, 3 idiomas cada una) backfilleadas con `race_id` real, verificado
  sin ninguna historia partida entre dos carreras ni propagación parcial
- Distribución: Australian GP (15), Chinese GP (15), Japanese GP (18), Miami GP (3),
  Canadian GP (3), British GP (3)
- 8 historias quedaron deliberadamente en NULL por ambigüedad real, cada una con motivo
  específico confirmado (no forzado): GP de Bahrein cancelado (no existe en `races`),
  varios artículos de testing pretemporada (no son carreras), un artículo sobre Barcelona
  2032 (año distinto, asociarlo al GP de España 2026 sería un dato falso), un artículo
  sobre residencia fiscal en Mónaco (coincidencia de nombre de país, no del evento), un
  artículo sobre plazos regulatorios que solo menciona "Miami" como fecha límite
- 163 filas restantes (season_year sin indicio de carrera puntual — fichajes, finanzas,
  regulaciones generales) quedan con `race_id` NULL a propósito, correcto que así sea

**Principio aplicado:** ante la duda, NULL — nunca forzar una asociación cuando el dato
real es ambiguo o inexistente, mismo criterio que ya rige todo el proyecto.

Documentado en `supabase/migrations/` como registro histórico del backfill (no
re-ejecutable), no como migración de schema.

## Backfill de articles.race_id — Fase 2 (2 sep 2026)

Ismael pidió seguir con "los 163 artículos" pendientes citados en la nota de cierre de
la Fase 1. **Verificación antes de actuar reveló que el número ya no era correcto**: el
sitio siguió publicando desde la Fase 1, así que la cifra real al arrancar esta sesión
era 258 filas / 86 historias con `race_id` NULL, no 163 — y contrario a la nota anterior
("sin indicio de carrera puntual"), varias sí mencionaban una carrera puntual real que
la Fase 1 no había capturado.

**Método:** matching por palabra clave (nombre de circuito/ciudad/país) contra las 22
carreras de 2026 en `races`, sobre título+tags+cuerpo de las 86 historias EN. 33
historias dieron positivo por keyword — de esas, se leyó el cuerpo completo de cada una
(no se confió en el título solo) para separar menciones reales de la carrera de falsos
positivos (testing de pretemporada, lanzamientos de auto, residencia fiscal, etc.).

**Resultado: 15 historias backfilleadas** (45 filas, 3 idiomas cada una), todas
verificadas con contenido explícito de la carrera, no solo coincidencia de palabra:
- Australian GP (6): melbourne-2026-f1-prize-money, aston-martin-honda-melbourne-
  vibration-financial-cost-2026, aston-martin-honda-tax-budget-cap-2026, mercedes-pole-
  verstappen-crash-qualifying-australia-2026, russell-wins-australian-gp-2026, australian-
  gp-2026-analysis-mercedes-ferrari
- Japanese GP (4): nagoya-2026-japanese-gp-economic-impact, suzuka-qualifying-2026,
  bearman-50g-crash-suzuka-2026, verstappen-retirement-2026-f1-future (reacción post-
  Suzuka, "Suzuka Aftermath" explícito en el cuerpo)
- Miami GP (1), Canadian GP (1), Austrian GP (1), Hungarian GP (1), Belgian GP (1,
  "russell-antonelli-mercedes-software-fault-spa")

**Trampas reales evitadas verificando el cuerpo del artículo, no solo el título:**
- `f1-drivers-monaco-2026` — sobre residencia fiscal en Mónaco (12 de 22 pilotos viven
  ahí por el régimen impositivo), no sobre el GP de Mónaco. Mismo patrón que ya había
  identificado la Fase 1.
- `f1-2026-transition-barcelona`, `mercedes-w17-thermal-analysis`, `microsoft-mercedes-
  f1-cost-cap`, `williams-barcelona-intelligent-failure`, `cyan-ambitions...`,
  `f1-news-analysis-apple-newey-barcelona` — todos sobre testing de pretemporada o
  lanzamiento de auto en el circuito de Barcelona-Catalunya, no sobre el GP de España
  2026 (que es una carrera distinta, fecha distinta, mes distinto)
- `f1-2026-rule-changes-six-fixes-miami` — sobre 6 cambios de reglamento que entran en
  vigor "en" el GP de Miami, pero el artículo es sobre las reglas, no sobre la carrera —
  mismo patrón que el "plazo regulatorio que solo menciona Miami como fecha límite" ya
  descartado en Fase 1
- `f1-academy-2026-sponsor-grid` — corre en paralelo al GP de China pero es sobre F1
  Academy (categoría distinta), no sobre la carrera de F1 en sí
- `bahrain-testing-2026-economic-impact`, `cadillac-f1-team-cost-analysis`, `mclaren-
  2026-prize-money-ferrari-mercedes-cost` — parte de la serie "Team Finance" de
  PaddockIntel, usan una carrera como referencia temporal pero el tema es la situación
  financiera del equipo en general, no esa carrera puntual
- `alex-zanardi-career-crashes-legacy` — perfil histórico de su carrera en CART/IndyCar,
  la mención de Monza fue falso positivo del keyword matching
- `bahrain-grand-prix-2026-cancelled` — confirmado de nuevo: no hay fila de Bahréin en
  `races` 2026, no hay `race_id` posible
- `barcelona-2032-f1-investment-strategy` — mismo caso ya documentado en Fase 1, año
  distinto (2032), no es el GP de España 2026

**Estado final:** 213 filas (71 historias) siguen con `race_id` NULL, a propósito —
fichajes, valuaciones de equipo, salarios de pilotos, testing de pretemporada,
lanzamientos de auto, noticias de personal, F1 Academy, y series editoriales de
"Team Finance" que no son sobre una carrera puntual. Ninguna de las 71 mostró indicio
real de carrera al leer el cuerpo completo.

**Corrección de proceso importante:** la cifra "163" citada por Ismael venía de una nota
de cierre de sesión que quedó desactualizada por publicaciones posteriores — se verificó
contra la base antes de actuar en vez de confiar en el número recordado, y el método de
Fase 1 (matching por tag + nombre en título) resultó más angosto de lo necesario: no
capturaba menciones de carrera dentro del cuerpo del artículo cuando el título llevaba
un enfoque distinto (ej. "The Honda Tax..." en vez de "Australian GP..."). La Fase 2
usó body_markdown además de título/tags para el matching inicial, lo que encontró
historias reales que la Fase 1 se había perdido.

## `/about` de Ismael — resuelto

Bloqueador de EEAT marcado ayer como crítico, cerrado hoy mismo.

**Hallazgo importante en el camino:** ya existía una página `/about` con contenido
hardcodeado (no conectado a Supabase), y sus datos **no coincidían** con lo que Ismael
confirmó en esta sesión — la página vieja decía "GP de Las Vegas 2024" y "Production
Planner en Jabil", ninguno de los dos verificado hasta preguntarle directamente. Se
confirmó: el año estaba mal (fue 2025, no 2024), y Jabil/los clientes (P&G, Unilever,
Sazerac) sí son reales — Verst sigue trabajando con esos mismos clientes hoy.

**Bio final** (fusiona la era Schumacher-Montoya como gancho personal + la trayectoria
profesional real en logística/estimación): guardado en `authors.bio`, con el año
corregido.

**Arquitectura corregida:** `/about` pasó de tener el bio hardcodeado en el `.tsx` a
consultar `authors` por `slug='ismael-sandoval'` server-side — una sola fuente de verdad,
en vez de dos biografías que podían (y ya habían) desincronizarse. `revalidate = 3600`
agregado para que futuras ediciones del bio se reflejen sin necesitar un redeploy
completo, mismo patrón que ya usa el blog para contenido de Supabase.

**Principio general reforzado:** cuando el contenido existente no coincide con lo
confirmado en la sesión, preguntar directamente en vez de asumir cuál versión es la
correcta — en este caso evitó publicar una fecha incorrecta de forma permanente.

## Glosario — 17 términos en formato de capas, completado (2 sep 2026)

Cierra el pendiente de "elegir términos del glosario" marcado arriba. Sesión completa:
selección de términos → migración de schema → ruteo → piloto validado → 4 tandas de
contenido escritas, revisadas y publicadas.

**Schema:** migración `20260902191345_glossary_terms_depth_layers.sql` (aditiva) agregó
columna `depth` (`eli5`/`technical`/`fia`) a `glossary_terms` y cambió la unicidad de
`(locale, slug)` a `(locale, slug, depth)`. Los 6 términos económicos viejos (cost-cap,
concorde-agreement, anti-dilution-fee, prize-money, hosting-fee, title-sponsorship)
quedaron backfilleados a `depth='technical'` sin tocar su contenido — conviven con el
formato nuevo, no se migraron a 3 capas.

**Ruteo nuevo:** `/glossary/[slug]` sirve la capa `eli5` por default (fallback a
`technical` para los términos viejos sin capa eli5), `/glossary/[slug]/technical` y
`/glossary/[slug]/fia-regulation` sirven las otras dos. `DepthNav` solo aparece cuando
un término tiene más de 1 capa. Categorías nuevas agregadas en EN/ES (`strategy`,
`rules-format`, `technical`, `tyres`) y el título del glosario pasó de "F1 Economics
Glossary" a "F1 Glossary" — ya no es solo económico.

**Piloto de validación:** `undercut` se escribió primero solo, se generó un preview
local (artifact, sin tocar el status en Supabase) con toggle EN/ES × 3 capas para que
Ismael aprobara el formato antes de escalar — aprobado sin cambios.

**17 términos publicados**, EN+ES, 3 capas cada uno (102 filas nuevas + 18 de piloto/
strategy = 120 filas totales en la tabla):
- `strategy`: undercut, overcut, team-orders, dirty-air
- `rules-format`: parc-ferme, track-limits, grid-penalty, safety-car-vsc, red-flag,
  sprint-format
- `technical`: ground-effect, overtake-mode, drs, porpoising, power-unit
- `tyres`: tyre-compounds, tyre-blankets

**Corrección importante durante la investigación:** el candidato original de la lista
era "tyre-blanket-ban" (asumiendo que las mantas térmicas se prohibían en 2026). La
investigación mostró que eso es falso — la prohibición se apuntó para 2024, se pospuso
varias veces por objeciones de seguridad de pilotos y Pirelli, y en 2026 las mantas
siguen siendo legales (Artículo C10.8.4). Lo que cambió en 2026 es que se cerraron
otros trucos de calentamiento/enfriamiento por fuera de la manta (cubos, frenos,
carenados de suspensión sellados). El término se reescribió como "Mantas Térmicas"
reflejando la realidad verificada, no el mito — se verificó con búsqueda real antes de
escribir, no se asumió del candidato original de la lista.

**Ángulo "por qué cambió" (2026) explotado en varios términos**, tal como estaba
planeado en la estrategia: `overtake-mode`/`drs` (DRS reemplazado por impulso de
potencia eléctrica), `ground-effect`/`porpoising` (túneles venturi acortados),
`power-unit` (split 50/50 combustión/eléctrico, MGU-H eliminada), `sprint-format`/
`parc-ferme` (ventana de parc fermé dividida en dos para el fin de semana con Sprint).

**Interlinking real entre términos** vía sintaxis `[texto](/glossary/slug)` dentro de
`body_markdown` — el renderer de markdown del sitio ya la soportaba (`lib/markdown.ts`),
no hizo falta ningún cambio de código para esto.

**Pendiente real que queda:** el sub-glosario de términos que se quedan en inglés en
español (undercut, overcut, DRS, parc fermé, safety car, pole position, pit stop) se
usó de forma consistente en los 17 términos pero no se documentó como lista separada
en ningún lado — vale la pena escribirla aparte si se retoma el glosario más adelante.

## Drop de `articles.tags` (text[]) — completado (3 sep 2026)

**Cerrado.** Ismael corrió las dos migraciones en el SQL Editor de Supabase (la de
`position`+`data-desk` y el `DROP COLUMN` final) en la misma sesión. Verificado
después con datos reales — consultas directas a `article_tags`/`tags` (orden por
`position` correcto) y `npm run dev` local sirviendo artículo individual, magazine-
home, filtro `?tag=` y la versión ES, sin errores en ninguna ruta. `articles.tags`
confirmado inexistente (`column articles.tags does not exist`). Nada pendiente de
esta línea.

### Contexto de la migración (cómo se llegó a esto)

Pendiente marcado en la migración del 27 de agosto ("el drop de `tags` queda para
una sesión futura"). Al empezar esta sesión, verificación antes de tocar nada mostró
que **no era un simple `DROP COLUMN`** — `articles.tags` seguía siendo la fuente real
de 3 consumidores en producción, ninguno migrado a la tabla relacional `tags`/
`article_tags` creada hace una semana:

- `components/blog/ArticleHero.tsx` — usa `tags[0]` en el "kicker" del artículo
- `app/[locale]/(blog)/magazine-home/{page,data}.tsx` — muestra tags en las cards,
  filtra por `?tag=`, y usa tags especiales `featured`/`data-desk` para elegir qué
  artículo es portada y qué 3 aparecen en "The Data Desk"
- `scripts/ingest-article.ts` — todavía escribía en `tags` al ingestar artículos nuevos

**Hallazgo adicional:** la tabla `tags` (creada 27 ago) solo tiene una columna `name`
en inglés — sin variante por idioma. El texto que se mostraba hasta ahora funcionaba
por accidente: `articles.tags` guardaba el string ya en el idioma correcto por fila
(`analisis-de-carrera` en ES, `race-analysis` en EN). Migrar a la tabla canónica sin
resolver esto hubiera roto la traducción del badge.

**Solución aplicada, siguiendo el mismo patrón ya usado para categorías del glosario**
(slug canónico en la base, texto traducido en `locales/*.json`):
- Namespace nuevo `articleTags` agregado a `locales/en.json`, `es.json` y `pt.json`
  (34 claves — los 33 tags canónicos + `data-desk`, que existía en el código desde
  antes pero nunca se había canonizado porque ningún artículo lo usaba todavía)
- `lib/blog/tags.ts` (nuevo): `getArticleTagSlugs()` (batch, respeta orden) y
  `getArticleIdsForTagSlug()` (para `featured`/`data-desk`/`?tag=`)
- Los 3 consumidores reescritos para leer de `article_tags`/`tags` + traducir vía
  `getTranslations('articleTags')`, en vez de leer `articles.tags` directo
- `ArticlePreviewCard`/`FeaturedArticleCard`: prop `tags: string[]` → `tags:
  {slug, label}[]` (necesario para separar el texto mostrado del slug usado en el
  link `?tag=`)
- `scripts/ingest-article.ts`: ya no escribe `tags` en `articles` — resuelve los
  slugs del frontmatter contra la tabla `tags` y escribe en `article_tags`
  (reemplaza el set completo en cada re-ingesta, falla fuerte si un slug no existe)

**Migración de orden (`article_tags.position`):** `article_tags` no guardaba el
orden original del array viejo (se insertó con `select distinct`, sin posición) —
y el primer tag de cada artículo es justo lo que arma el kicker editorial. Se
recuperó el orden real re-leyendo `articles.tags` con `unnest ... with ordinality`
y el mismo mapeo valor-viejo→tag-canónico de la migración de agosto, antes de que
esa columna deje de existir — es la última oportunidad de hacerlo con la fuente
de verdad todavía viva. 18 filas (6 historias) tenían `season-2026` como
`tags[0]` — un bug de tageo preexistente (ese valor no es un tag real, se había
extraído a la columna `season_year` en la migración de agosto) — al no migrarse,
esas 6 historias muestran su primer tag real siguiente en vez de "SEASON-2026"
como texto de kicker, mejora de contenido, no regresión.

**Bloqueador real, no resuelto en esta sesión:** no hay forma de correr DDL
(`ALTER TABLE`) contra Supabase desde este entorno — no hay CLI vinculado ni
connection string de Postgres en `.env.local` (solo la `service_role` key, que
sirve para INSERT/UPDATE/SELECT vía PostgREST, no para cambios de esquema).
Confirmado con Ismael: las migraciones DDL anteriores se aplicaron pegándolas a
mano en el SQL Editor de Supabase — mismo camino para esta.

**Estado exacto al cierre — dos migraciones escritas, ninguna corrida todavía:**
1. `supabase/migrations/20260903120000_article_tags_position.sql` — aditiva,
   agrega `article_tags.position` + backfill + tag canónico `data-desk`. Correr
   primero.
2. `supabase/migrations/20260903130000_drop_articles_tags_column.sql` — el drop
   real. Correr **recién después** de aplicar la #1, deployar este código, y
   verificar en el sitio (o `npm run dev` local) que el artículo individual, la
   home de magazine y el filtro `?tag=` siguen mostrando tags bien — la corrida
   local de `npm run tsc`/`npm run build` pasó limpio, pero las queries reales a
   `article_tags.position` no se pudieron probar en runtime porque la columna
   todavía no existe en la base.

**Próximo paso de esta línea:** Ismael corre la migración #1 en el SQL Editor →
avisa → se verifica en local con datos reales → recién ahí se corre la #2.

## Paso 4 "Who's Who" — Fase 0 completada (3 sep 2026)

Lista curada de 34 voces (piso de 30 pedido por el roadmap cumplido), revisada en conjunto
con Ismael categoría por categoría, con criterio de curación defendible escrito antes de
listar nombres (acreditación de paddock / rol técnico real / trayectoria independiente
larga). Documento completo: `docs/WHOS-WHO-FASE0-CANDIDATES.md`.

**5 categorías ("lente"), adaptadas del modelo aiweekly.co a F1:** Investigación (16,
reporteros de paddock), Construcción (6, analistas técnicos), Crítica (8, ex-pilotos/
comentaristas), Contexto (3, veteranos independientes), Datos (1, estadística con
identidad real).

**Edición real aplicada en la revisión:** Antonio Lobato movido de Crítica a Contexto —
entra por trayectoria de narrador (20+ años), no por credencial de ex-piloto/técnico como
el resto de esa categoría.

**Corrección importante durante la verificación de handles de X** (hecha uno por uno vía
búsqueda real, no de memoria, para evitar cargar una cuenta equivocada en Supabase):
Duncan Alexander salió de la lista — resultó ser estadístico de **fútbol** (co-fundador de
OptaJoe), no de F1; se había colado por un hit de Wikipedia mal cruzado en la búsqueda
original de candidatos. Bruce Jones también salió — autor real y verificable (*The Formula
One Record Book*), pero sin cuenta de X pública confirmada, no sirve para el motor de
embeds del MVP aunque sí como fuente bibliográfica a citar en contenido aparte. Mismo
principio que ya rige el proyecto: ante la duda o el dato no verificable, afuera.

Dos ambigüedades de cuenta resueltas (más de un handle candidato por persona): Antonio
Lobato (`@alobatof1`, no `@Alobato_F1`) y Craig Scarborough (`@ScarbsTech`, no `@Scarbsf1`,
vieja/inactiva).

**Hallazgo aparte:** de las 34 personas, solo 2 tienen Bluesky confirmado en esta pasada
(Nate Saunders, Joe Saward) — no se buscó sistemáticamente para el resto, queda para la
Fase 1.

**Excluido a propósito de esta lista:** cuentas de análisis de datos anónimas/pseudónimas
(ej. `@f1dataanalytics`) — no pasan el criterio de identidad verificable definido; podrían
sumarse en una fase futura con un criterio distinto (verificar metodología en vez de
identidad).

**Pendiente real, no bloqueante:** decidir si se suma una segunda tanda de voces (alemanas/
italianas, dado el peso de Auto Motor und Sport / Sky Italia en la cobertura europea) para
acercarse más al techo de 50. Próximo paso de la línea es la Fase 1 (ingesta mínima de un
source vía embeds gratuitos de `publish.x.com`).

## Paso 4 "Who's Who" — Fase 1 completada (3 sep 2026)

Ingesta mínima de un source, probada de punta a punta antes de escalar a las 34 voces.

**Schema:** migración `20260903190000_whos_who_experts.sql` (aditiva) — tabla `experts`
con las 34 filas de la Fase 0 ya cargadas (`name`, `slug`, `category` con check constraint
a las 5 lentes, `role`, `x_handle`, `bluesky_handle`, `credibility_note`, `is_active`).
RLS + grants siguiendo el mismo patrón que `authors`/`tags` (solo `SELECT` para
`anon`/`authenticated`). Corrida por Ismael en el SQL Editor de Supabase — verificado
después con conteo real: 34 filas, distribución exacta por categoría (investigation 16,
construction 6, critique 8, context 3, data 1).

**Embed técnico:** `components/whos-who/XProfileEmbed.tsx` — mismo mecanismo que genera
`publish.x.com` (script `platform.twitter.com/widgets.js` + `<a class="twitter-timeline">`),
sin API paga. Client component porque el script corre en el browser.

**Piloto elegido:** Dieter Rencken (`@RacingLines`) — voz de RaceFans/RacingNews365 con
foco fuerte en política/economía de F1, el ángulo más cercano al de PaddockIntel de las 34.

**Ruta de prueba:** `/whos-who-preview`, deliberadamente sin linkear desde la navegación
y con `robots: noindex` — el paso 4 no está aprobado para lanzamiento público (eso lo
define la Fase 3, UI mínima mostrable). Verificado con `npm run dev` real: la página
sirve 200, trae nombre/rol/handle reales desde Supabase (no hardcodeados) y el HTML
incluye el embed inyectado correctamente.

**Pendiente real, no bloqueante:** escalar el patrón de embed a las 34 voces (Fase 3 es
la que decide la UI final, esto solo probó que el mecanismo funciona). La clasificación
automática por tema/lente y detección de tendencias sigue necesitando la Fase 2
(clustering con LLM) o proceso editorial semi-manual, como ya estaba anotado en el
research original.

## Paso 4 "Who's Who" — Fase 2 semi-manual, primer pick real cargado (3 sep 2026)

**Decisión de arquitectura, no solo de proceso:** el embed gratuito de X de la Fase 1
corre 100% client-side — nunca le llega texto del post al servidor. Sin ese texto no
hay nada que mandarle a un LLM para clasificación/tendencias automáticas, salvo pagando
la API de X (~$200/mes), lo que anularía el hallazgo que abarató el MVP en la Fase 1.
Se optó explícitamente por curación semi-manual en vez de eso: Ismael elige el post y
escribe (o dicta) el takeaway editorial a mano.

**Schema:** migración `20260903200000_expert_picks.sql` (aditiva) — tabla
`expert_picks` (`expert_id` FK a `experts`, `post_url`, `topic` texto libre —
deliberadamente sin FK a la tabla `tags` de artículos todavía, no hay volumen real
para saber si esa taxonomía aplica acá —, `takeaway`, `locale`, `is_active`). Mismo
patrón de RLS/grants que el resto (solo `SELECT` para `anon`/`authenticated`). Corrida
por Ismael en el SQL Editor de Supabase.

**Herramienta de carga:** `scripts/whos-who-pick.ts`, mismo patrón que
`ingest-article.ts` — un archivo `.md` en `whos-who-picks/` con `expert_slug` +
`post_url` en el frontmatter y el takeaway como cuerpo, sin prompts interactivos ni
dependencias nuevas (reusa `gray-matter`, ya en el proyecto).

**Primer pick real cargado y verificado:** tributo de Dieter Rencken a Bob Fernley
(`whos-who-picks/dieter-rencken-bob-fernley-tribute.md`,
`x.com/RacingLines/status/1723972603063287836`). Contenido del post confirmado
directamente por Ismael (no se pudo leer vía scraping — X devuelve 402 sin login tanto
a WebFetch como a WebSearch, confirmación en código de que la Fase 1 hizo bien en no
depender de leer contenido de X sin pagar la API). El takeaway verificó además datos
reales sobre Bob Fernley (director de facto de Force India 2008-2018, P4 en el
campeonato de constructores 2016 y 2017 con presupuesto muy por debajo del midfield)
antes de escribirlo — mismo principio de nunca inventar un dato que ya rige todo el
proyecto, extendido acá a contenido atribuido a una persona real de la lista curada.

**Pendiente real, no bloqueante:** ver con volumen real de varios picks si `topic`
como texto libre alcanza o conviene migrarlo a la taxonomía de `tags` que ya usan los
artículos (unificaría temas entre el blog y Who's Who). Fase 3 (UI mínima mostrable)
sigue sin arrancar — hoy los picks solo existen en Supabase, no se muestran en
ninguna página todavía.

## Glosario — capas eli5/fia para los 6 términos legacy, completado (2 sep 2026)

Los 6 términos económicos que ya existían antes de la expansión (cost-cap, concorde-
agreement, anti-dilution-fee, prize-money, hosting-fee, title-sponsorship) se habían
quedado con una sola capa (`depth='technical'`, backfill automático de la migración
de schema) mientras los 17 términos nuevos ya tenían las 3. Ismael pidió parejar esto.

**24 filas nuevas publicadas** (6 términos × 2 capas nuevas × 2 idiomas — EN+ES, mismo
criterio de idioma que el resto del glosario; PT no se tocó, sigue con una sola capa
como ya estaba). La fila `technical` existente de cada término no se tocó.

**La capa FIA de estos 6 términos requirió investigación real distinta a la de los 17
nuevos** — son términos de economía/gobernanza de F1, no de reglamento deportivo en
pista, así que "regulación FIA" significa algo distinto acá. Hallazgos verificados
antes de escribir (no asumidos):
- **Cost Cap**: la fiscalización real son DOS organismos separados — Cost Cap
  Administration (audita) deriva casos al **Cost Cap Adjudication Panel** (tribunal
  independiente de 12 jueces elegidos por la Asamblea General de la FIA), un detalle
  que la capa técnica original no cubría
- **Concorde Agreement**: la separación formal entre la FIA (autoridad regulatoria) y
  el F1 Group (Titular de los Derechos Comerciales) — son roles distintos que el
  propio Concorde Agreement define, confirmado con el 9no acuerdo firmado en diciembre
  de 2025 (vigente hasta 2030, corrobora la cifra "2026-2030" que ya estaba en el
  contenido viejo)
- **Anti-Dilution Fee**: existen DOS filtros secuenciales para un equipo nuevo, no uno
  — el proceso de Expresión de Interés de la FIA (evaluación técnica/financiera/
  sostenibilidad, $20.000 no reembolsables) es previo y separado del pago comercial en
  sí (que va a los equipos existentes, no a la FIA)
- **Prize Money**: corrección de una confusión común — el premio en dinero **no es una
  regulación de la FIA**, es 100% comercial vía Concorde Agreement entre el F1 Group y
  los equipos. El único rol real de la FIA es certificar la clasificación del
  campeonato de la que depende la fórmula de pago
- **Hosting Fee**: la licencia FIA Grado 1 (el nivel más alto de un sistema de 7
  niveles, con requisitos físicos de circuito: 3,5-7km, barreras, zonas de escape) es
  un filtro de seguridad completamente separado de la cuota comercial — un circuito
  puede estar dispuesto a pagar cualquier cifra, pero sin Grado 1 la negociación ni
  siquiera aplica
- **Title Sponsorship**: sin techo de valor regulado, pero sí restricciones reales de
  contenido — publicidad política/religiosa prohibida directamente, prohibición de
  patrocinio de tabaco eliminada gradualmente hacia fines de 2006, y un caso concreto
  de fiscalización (las franjas blancas estilo código de barras de Ferrari 2007-2010,
  que la FIA determinó que evocaban subliminalmente a Marlboro y ordenó quitar en 2010)

**Preview antes de publicar:** mismo patrón que el piloto de undercut — artifact local
con selector de término + toggle EN/ES + capas clickeables, sin tocar el status en
Supabase hasta la aprobación de Ismael.

**Sin cambio de código:** el ruteo (`DepthNav`, `/glossary/[slug]/[technical|fia-
regulation]`) ya soportaba términos con más de una capa desde la tanda anterior — esto
fue puramente contenido nuevo en `glossary_terms`, no requirió deploy.

## Paso 4 "Who's Who" — Fase 2 escalada a 3 picks (4 sep 2026)

**Bloqueador real encontrado y resuelto antes de poder cargar nada:** `.env.local`
todavía tenía las API keys legacy de Supabase (formato JWT, `eyJhbGci...`), deshabilitadas
por Supabase el 2026-08-25 — cualquier script que tocara Supabase desde local fallaba con
`Legacy API keys are disabled`. Migradas a las keys nuevas (`sb_publishable_...` /
`sb_secret_...`) desde Settings → API Keys → pestaña "Publishable and secret API keys"
del dashboard (project `PaddockIntel-Data`, rama `main` production) — la confusión real
fue que esa pestaña no es la que carga por defecto y hay que seleccionarla a mano; el
publishable key se puede tratar como público (la propia UI de Supabase lo dice), el
secret no.

**2 picks nuevos cargados**, mismo mecanismo semi-manual de la Fase 2 (post real elegido
por Ismael vía navegador logueado en X — leer contenido sin sesión sigue devolviendo el
mismo bloqueo 402/muro de login ya documentado —, dato de fondo verificado antes de
escribir el takeaway):
- **Chris Medland** (`chris-medland`, Investigación) — Colton Herta se quedó sin el punto
  bonus de Super Licencia en FP1 del GP de Italia en Monza por no completar el mínimo de
  100km, más un accidente en Lesmo en la práctica de F2 el mismo día. Verificado contra
  el reglamento real (100km mínimo por sesión FP1, tope de 10 puntos hacia el umbral de
  40) y el programa 2026 de Cadillac (4 sesiones de FP1 para Herta, arrancó el año a 5
  puntos de los 40 que necesita).
- **Craig Scarborough** (`craig-scarborough`, Construcción) — nuevos carenados en el
  "aero rake" de Aston Martin en Monza, con lectura honesta de Scarborough (no confirma
  si es un concepto nuevo de morro o solo mejor toma de datos de referencia).

**2 picks más, misma sesión, tras resolver el bloqueador de keys:**
- **Adam Cooper** (`adam-cooper`, Investigación) — comunicado oficial de Alpine tras la
  resolución del Tribunal de Apelación Internacional de la FIA sobre el P3 de Gasly en
  Mónaco. Verificado con fuentes externas (Autosport, RaceFans, Formula1.com): las
  penalizaciones se habían anulado primero por un error de medición de FOM en la
  distancia del pitlane, McLaren y Red Bull apelaron esa reversión, la Corte falló a
  favor de McLaren/Red Bull el viernes — Gasly baja a P7, Hadjar hereda el podio. Mismo
  evento real que el pick de Medland, ángulo complementario (comunicado oficial del
  equipo vs. la noticia en caliente).
- **David Hayhoe** (`david-hayhoe`, Datos) — estadística de archivo (no noticia del día):
  el GP de Rusia 2021 fue la primera carrera desde Gran Bretaña 2008 con primera fila
  íntegramente de pilotos sin victorias previas. Citado directo a su propio libro de
  referencia (sección 535 de *Formula 1 The Knowledge*) — contenido evergreen, no ligado
  a la fecha de publicación del tweet.

**1 pick más, cerrando la categoría Crítica:**
- **Jenson Button** (`jenson-button`, Crítica) — Button desmintiendo en su propia cuenta
  que vaya a reemplazar a Martin Brundle en la comentarista de Sky, después de que una
  cuenta de rumores anunciara un "cambio mayor" para 2026. La propia Community Note de X
  adjunta a ese post viral ya corrige el framing (Brundle sigue cubriendo ~16 carreras,
  bajando apenas de 18 en 2025, no el cambio drástico que se insinuaba) — pick con la
  corrección ya incorporada, no hizo falta buscarla aparte.

**Categoría Contexto: cerrada en una segunda sesión de navegador.** El primer intento
falló (solo página de perfil sin tweets, en los 3 nombres) — resultó ser vista inicial
gateada, no rate-limiting: con sesión nueva + scroll manual hacia abajo en el perfil, los
3 sí tenían contenido real más abajo en el feed. Lección para la próxima vez que se use
este mecanismo: si el perfil carga sin tweets visibles, scrollear antes de descartar la
cuenta.
- **Joe Saward** — el título del GP de Países Bajos 2026 fue el último de Zandvoort en
  el calendario. Verificado con fuentes externas: el promotor solo aceptó una extensión
  de un año en dic. 2024, F1 ofreció alternativas (alternancia, evento anual) que
  rechazó, razón declarada 100% financiera (sin respaldo estatal/soberano a diferencia
  de sedes nuevas), Portimão vuelve en 2027 como reemplazo.
- **James Allen** — paralelismo histórico real: Fisichella 2003 Brasil, mismo caso que
  Gasly en Mónaco 2026 (trofeo/puntos sin el momento real del podio) pero para una
  victoria, no un P3 — testimonio en primera persona, Allen comentaba esa carrera en
  vivo para ITV. Ojo con la fecha: es de junio, previa al fallo final de la Corte de
  Apelación de septiembre (ver picks de Medland/Cooper) — el takeaway lo aclara.
- **Antonio Lobato** — estadística de brecha de competitividad en FP1 carrera a carrera
  desde Mónaco (2.7s) hasta Bélgica (5.7s), lectura de temporada completa poco común en
  un solo tuit.

Total en `expert_picks` ahora: 9 (Rencken + estos ocho). Cobertura por categoría
completa: Investigación 3, Construcción 1, Crítica 1, Datos 1, Contexto 3. Sigue
corriendo solo en `/whos-who-preview`, sin linkear, `noindex` — Fase 3 (UI mínima
mostrable) sigue sin arrancar, es el bloqueador real que queda para que esto se vea en
el sitio.

**Pregunta real de Ismael, respondida — dónde quedan escuderías/FIA:** no encajan en
Who's Who — el schema de `experts` es de personas con lente propia (5 categorías fijas
por check constraint), no de fuentes institucionales. Un comunicado de equipo o un fallo
de FIA es la fuente primaria que un experto curado *reporta* (ya pasó sin planearlo: el
pick de Adam Cooper es Cooper reportando el comunicado de Alpine, no Alpine mismo). Esas
fuentes institucionales ya tienen hogar: `article_sources` (Paso 2, construida, vacía)
para citarlas en artículos propios, y el feed del Paso 5 para agregarlas con link de
salida. **Idea pendiente, no decidida:** un "wire" separado de comunicados oficiales de
escuderías/FIA, distinto de Who's Who — sería un feature nuevo, no encaja en el schema
actual de `experts`.

## Paso 4 "Who's Who" — Fase 2, tanda grande hasta 14 picks (4 sep 2026, continuación)

**Error real cometido y corregido antes de publicar:** al armar el pick de Thomas Maher,
escribí un `post_url` de memoria en vez de copiarlo del resultado real de la herramienta
de navegador — el link no coincidía con el tweet real. Detectado al releer el propio
flujo antes de cargarlo a Supabase, corregido con el href real confirmado. Lección para
la próxima vez: el `post_url` de cada pick tiene que venir literal de un resultado de
herramienta (`find`/`read_page` con `href` explícito en el output), nunca escrito de
memoria aunque parezca obvio cuál es.

**5 picks nuevos, cerrando construcción y sumando profundidad a investigación:**
- **Luke Smith** (Investigación) — Lando Norris (campeón vigente) cofundó LN4 Fusion,
  equipo junior para F3/FRECA/F4 Italia desde 2027, aplicando a F2, con ex-jefe de Prema
  como Team Principal. Verificado con fuentes externas, más rico que el tuit solo.
- **Thomas Maher** (Investigación) — choque real entre Andrea Stella (McLaren) y Flavio
  Briatore en la conferencia de prensa de Monza, sobre el mismo fallo del Tribunal de
  Apelación de Mónaco (Briatore acusó a un juez de vínculos no declarados con McLaren).
  Cita completa de Stella verificada con fuentes externas.
- **Toni Cuquerella** (Construcción) — preview técnico real de Monza (carga aero más
  baja del año, gestión de energía, compuestos, pit-loss de 24.5s).
- **Mark Hughes** (Construcción) — misma carrera, ángulo de clasificación ("200mph
  Rubik's Cube": frenada + velocidad de curva + batería + tow de 1.5s) — buen par
  editorial con el pick de Cuquerella, dos lentes distintas sobre el mismo fin de semana.
- **Nate Saunders** (Investigación) — Norris extiende con McLaren hasta 2030 (confirmado:
  su contrato anterior vencía en 2027), con el ángulo propio de Saunders sobre escasez
  real de asientos en los "Big 4" (McLaren/Red Bull/Ferrari ya atados a sus pilotos
  hasta la próxima década).

**Hallazgos reales sobre la lista curada, no bloqueantes pero worth anotar:**
- **@Giorgio_Piola no sirve para este mecanismo** — la cuenta dejó de postear contenido
  técnico real; el feed visible es 100% comercial (ventas de Black Friday, relojes de
  edición limitada), última actividad real nov. 2021. Pendiente: confirmar si tiene una
  cuenta más activa en otra red, o dejarlo sin picks por ahora.
- **Categoría Crítica sigue floja (1 de 8 voces con pick real).** Intentado con Rosberg
  (feed sin posts visibles en ningún intento), Villeneuve (cuenta casi inactiva, 78
  posts totales), Chandhok y de la Rosa (contenido real pero de caridad/nostalgia, no
  análisis — no forzado a pick por no ser sustancia real). Patrón real, no un fallo de
  la técnica de scroll: las cuentas de ex-pilotos con marca personal fuerte tienden a
  postear promoción/eventos, no análisis — puede necesitar picks de tipo "reacción en
  vivo" (comentario de TV) en vez de posts propios, o simplemente aceptar que esta
  categoría rinde menos con este mecanismo.

Total en `expert_picks` ahora: **14** (de 34 voces curadas, 14 con al menos un pick).
Cobertura por categoría: Investigación 6, Construcción 3, Crítica 1, Datos 1, Contexto 3.
Sigue todo sin mostrarse fuera de `/whos-who-preview` — Fase 3 (UI mínima mostrable)
sigue siendo el bloqueador real para que esto tenga impacto en el sitio.

## Paso 4 "Who's Who" — Fase 3, primera versión mínima mostrable (4 sep 2026)

**`/whos-who-preview` reconstruida de cero** — la versión de Fase 1 nunca leía
`expert_picks`, solo embebía el timeline en vivo (crudo, sin curar) de un experto
hardcodeado (Rencken) vía `XProfileEmbed`. Ahora la página hace la query real
(`expert_picks` + `experts`), agrupa los 14 picks por las 5 categorías y renderiza
nombre/rol/credibility_note del experto, el takeaway editorial completo, el tag de
topic, y un link de salida prominente al post original — seguido del patrón de citación
ya definido para el paso 5. `XProfileEmbed.tsx` queda sin uso (no se borró, por si sirve
para un futuro "perfil completo" fuera de la vista curada); la ruta sigue exactamente
igual de cautelosa que antes: `robots: noindex`, sin link desde ningún nav real.

**Sistema visual real, no genérico:** siguió el patrón ya aplicado en
`components/circuits/CircuitOverview.tsx` (Vintage Editorial post-relanzamiento) —
`var(--pi-display)` para el título, `var(--pi-mono)` para meta/labels, `var(--terracotta)`
para acentos y links de salida, `rounded-sm` en las cards (no zero-radius, ya superado),
línea de transparencia `SOURCE: SUPABASE (...)` al pie, mismo patrón que Circuits.

**Verificado antes de dar por terminado:** `tsc --noEmit` y `eslint` limpios, `npm run
dev` real con los 14 picks renderizando (no datos de prueba), responsive verificado a
375px (nav colapsa a hamburguesa, una sola columna, sin overflow horizontal) y desktop.
Un "1 Issue" del overlay de Next.js resultó ser un falso positivo de hidratación
causado por una extensión del navegador (`data-lt-installed`, corrector gramatical)
inyectando en `<body>` antes de hidratar — apunta al `layout.tsx` raíz, no a este
componente, no es un bug real.

**Todavía no es la UI final, es la Fase 3 "mínima mostrable" del roadmap** — decisiones
reales pendientes antes de considerar esto lanzable: ¿se linkea desde el nav real?, ¿se
saca el `noindex`?, ¿va con paginación/límite cuando haya más de ~30-40 picks?, ¿los
labels de categoría van con la etiqueta en inglés (como está ahora) o localizados por
`next-intl` como el resto del sitio? Ninguna de estas se resolvió — la página existe
para que Ismael la vea y decida, no como versión final.

**Tres de esas decisiones, resueltas por Ismael (4 sep 2026, misma sesión):**
1. **Sigue sin linkear del nav** — con 14/34 voces y Crítica floja, no está completa
   para mostrarse como sección oficial todavía.
2. **Sigue con `noindex`** — indexar algo no linkeado ni completo no suma, y contradice
   el criterio EEAT de no publicar contenido a medio construir.
3. **Los labels de categoría SÍ se localizan ya con `next-intl`** — nuevo namespace
   `whosWho.categories` en `locales/en.json`/`es.json`/`pt.json` (label + descripción de
   lente por cada una de las 5 categorías), la página usa `getTranslations('whosWho.
   categories')` en vez del objeto hardcodeado. PT recibió traducción real cuidada, no
   una pasada automática — son 5 etiquetas cortas + 5 oraciones descriptivas, mucho
   menor riesgo editorial que un artículo completo, así que no se dejó en blanco a la
   espera de una revisión nativa como pasó con otras piezas PT del proyecto.
   Verificado en vivo: `/es/whos-who-preview` y `/pt/whos-who-preview` responden 200 y
   muestran "Investigación/Construcción/Crítica/Contexto/Datos" e
   "Investigação/Construção/Crítica/Contexto/Dados" correctamente — el resto del copy
   estático de la página (título, intro, botón) queda en inglés a propósito, no se pidió
   localizarlo todavía.
   **Alcance deliberadamente angosto:** solo se localizaron las 5 categorías, no toda
   la página — evita trabajo de i18n completo sobre una vista que ni siquiera está
   aprobada para lanzamiento.

## Paso 4 "Who's Who" — Fase 2, 2 picks más hasta 16 (4 sep 2026, continuación)

- **Lawrence Barretto** (Investigación) — Verstappen extiende con Red Bull hasta 2030,
  anunciado antes de su GP de casa. Verificado: el contrato anterior (hasta 2028) tenía
  cláusulas de salida por rendimiento que alimentaron rumores de fuga; con este nuevo
  contrato llega a 15 temporadas en el equipo. Mismo patrón de "asientos grandes
  cerrados hasta 2027" que ya señaló el pick de Nate Saunders sobre Norris — dos
  reporteros distintos confirmando el mismo movimiento estructural del mercado de
  pilotos.
- **Mat Coch** (Investigación) — Woody Johnson (dueño de los Jets de la NFL) compra
  participación minoritaria en Aston Martin y entra como vice-chairman. Verificado:
  Yew Tree Consortium (Stroll) mantiene el control, Arctos Partners y Adrian Newey
  también son accionistas minoritarios. El ángulo real de Coch — "cómo se estructuró la
  empresa para liberar valor sin ceder control" — mientras el equipo está P10 en pista
  (Stroll+Alonso con 1 punto combinado) es exactamente el tipo de brecha entre
  valuación y resultado que PaddockIntel existe para explicar.

**Hallazgo adicional sobre la lista curada:** `@craigslatersky` tampoco sirve para este
mecanismo — solo 190 posts totales, feed sin contenido visible en ningún intento (a
diferencia de Piola, acá no hay ni contenido comercial, la cuenta parece casi vacía).
Tercer caso de handle problemático (después de Piola y, en menor medida, Ben Anderson
con solo 301 seguidores y su único post visible de 2019) — patrón real: algunas cuentas
de la lista de 34 fueron verificadas por handle/identidad en Fase 0 pero no por volumen
real de actividad reciente. Vale una segunda pasada futura confirmando actividad, no
solo identidad, antes de aprobar la lista definitiva.

Total en `expert_picks` ahora: **16** (de 34 voces curadas). Cobertura por categoría:
Investigación 8, Construcción 3, Crítica 1, Datos 1, Contexto 3.

## Paso 4 "Who's Who" — Fase 2, 2 picks más hasta 18, cierre de la sesión (4 sep 2026)

- **Jon Noble** (Investigación) — Monza "energy-poor" será un reto real para los autos
  2026, algunos pilotos creen que puede ser más lenta que Hungría. Cierra un cluster de
  3 expertos independientes (Cuquerella, Hughes, Noble) confirmando el mismo hallazgo
  real sobre el mismo fin de semana desde ángulos distintos — exactamente el tipo de
  convergencia que Who's Who existe para mostrar.
- **Scott Mitchell-Malm** (Investigación) — comentario real y polémico de Stefano
  Domenicali (CEO de F1) justificando sacar los gráficos de uso de batería de la
  transmisión citando una charla con George Lucas ("a nadie le interesa cómo manejás tu
  auto"). Verificado con fuentes externas: generó backlash real de fans técnicos.
  Tensión real de fondo (¿el crecimiento de F1 se construye ocultando la capa técnica o
  explicándola?) que es literalmente la razón de ser de PaddockIntel.

**Intentos sin resultado, no forzados:** Andrew Benson (BBC) no mostró ningún post en
varios intentos con scroll — mismo patrón de cuenta sin contenido visible que
Edmondson/Rosberg. Ted Kravitz repitió el mismo tuit de promoción de libro ya visto
antes, sin sustancia nueva — no se cargó por no ser suficientemente rico.

Total en `expert_picks` ahora: **18** (de 34 voces curadas). Cobertura por categoría:
Investigación 10, Construcción 3, Crítica 1, Datos 1, Contexto 3.

## Paso 4 "Who's Who" — Fase 2, último pick de la sesión hasta 19, límite real alcanzado (4 sep 2026)

- **Madeline Coleman** (Investigación) — Alex Albon llega a 100 carreras con Williams,
  con cita real suya ("I poured a lot of my time and energy into this team, and I hope
  it's for something"). Verificado: primer piloto en la historia de Williams en llegar
  a 100 arranques con el equipo, superó el récord de Nigel Mansell en el camino, menos
  de 30 pilotos en la historia de F1 llegaron al centenar con una sola escudería.

**Hallazgo real sobre Anthony Davidson (Crítica), no un handle roto sino inexistente:**
confirmado por búsqueda externa — Davidson no tiene cuenta personal de X, solo aparece
citado a través de la cuenta oficial `@SkySportsF1`. No es como Piola/Slater (cuentas
reales pero sin contenido útil) — acá el mecanismo de "un post por persona" no aplica
en absoluto, habría que decidir si se lo saca de la lista de 34 o se le busca otro
mecanismo de representación.

**Límite real alcanzado en esta sesión, no solo cansancio de intentos:** de las 34
voces curadas, ya se probaron las 34 al menos una vez (contando sesiones anteriores).
Los 15 nombres sin pick real quedan así, con motivo verificado, no por falta de
intento:
- **Sin contenido visible en ningún intento:** Rosberg, Villeneuve, Edmondson, Benson
- **Cuenta rota/inactiva para este mecanismo:** Piola (100% comercial desde 2021),
  Craig Slater (feed casi vacío), Anthony Davidson (no tiene cuenta personal)
- **Contenido real pero insuficientemente sustancial (no forzado):** Kravitz, Chandhok,
  de la Rosa, Brundle, Naomi Schiff, Gary Anderson, Bernie Collins

Total en `expert_picks` ahora: **19** (de 34 voces curadas — techo real alcanzado por
ahora, no por falta de tiempo). Cobertura por categoría: Investigación 11,
Construcción 3, Crítica 1, Datos 1, Contexto 3. Para sumar más picks reales, el próximo
paso sería que Ismael aporte contenido directo de las voces "sin sustancia" (mismo
mecanismo del primer pick de Rencken), no más intentos automatizados sobre las mismas
34 cuentas.

## Paso 3 "Newsletters" — corrección real de estado + Vol.06 publicado (4 sep 2026)

**Corrección importante, el estado de este doc estaba desactualizado.** La sección
"Newsletters" de arriba dice "research hecho, nada construido" — falso. En esta sesión
se encontró: la ruta `/weekly` ya existe y funciona (captura de email, listado real),
`digest_issues`/`digest_items` ya tienen 3 issues reales publicados (`vol-01-austria`,
`vol-02-belgium`, `vol-05-zandvoort`) con contenido genuino y bien sourceado (Apple
$140M/año, Cadillac $450M de fee de entrada, cost cap $215M, etc.) más 2 Recaps
(`recap-01`, `recap-02`) — nada de esto estaba documentado en ningún lado. Otra sesión
lo construyó sin dejar rastro escrito, mismo patrón que ya pasó una vez con el Delta
Ribbon (`v2_relaunch` memory). **Lección repetida:** verificar contra la base de datos
real antes de afirmar el estado de una feature, no solo contra este documento.

**Pipeline real ya existe y es automatizado, no manual:**
`scripts/generate_digest_draft.py` — usa Claude (Sonnet 5) con web search real (hasta 12
búsquedas) para investigar la semana, escribe el issue en la voz de PaddockIntel, y lo
guarda como `draft` (nunca auto-publica). Abre un GitHub issue de aviso si hay
`GITHUB_TOKEN` (localmente solo imprime). `scripts/publish_digest.py <slug>` flipea a
`published`, lo que dispara el cron de envío de email ya existente
(`app/api/digest/send`). Corre con `.venv-data` (ya tenía las deps instaladas:
anthropic, supabase, python-dotenv, requests — mismo `requirements-data.txt`).

**Vol.06 generado, corregido y publicado hoy:**
- Corrido `python scripts/generate_digest_draft.py` — tardó ~25 min (de red, no de CPU:
  búsquedas reales una por una). Generó `vol-06-week-2026-09-04`, 4 historias: valuación
  de Mercedes/Ferrari, Woody Johnson en Aston Martin, slot de título sin vender de
  Cadillac, extensión de Norris a 2030.
- **Verificación real antes de publicar** (no confiar ciegamente en el draft de la IA,
  mismo principio del sourcing rule de EDITORIAL.md aplicado a contenido generado):
  `WebFetch` de las 4 URLs citadas — 3 confirmadas casi textuales. La 4ta reveló un
  **error real, no solo falta de precisión**: el draft decía que Mercedes vale $6.4B —
  ese número es en realidad la valuación de **Ferrari** (Sportico), Mercedes está en
  $6B (venta de Wolff de ~5% a George Kurtz, CEO de CrowdStrike, por $300M). El dato de
  Ineos ($800M implícito en 2022) sí se confirmó independiente (33% por £208M en 2022).
  Corregido directamente en Supabase (intro_synthesis + el item de PlanetF1) antes de
  publicar — la cifra corregida además mejoró la narrativa real (Mercedes "cerrando la
  brecha" con Ferrari tiene sentido con $6B vs $6.4B, no con dos equipos al mismo número).
- Publicado con `python scripts/publish_digest.py vol-06-week-2026-09-04`. Verificado en
  vivo: `/weekly/vol-06-week-2026-09-04/` renderiza bien, la corrección está en el HTML
  servido. Queda pendiente el envío real de email — dispara solo con el próximo corrido
  del cron de `app/api/digest/send`, no se forzó manualmente.

**Gap real sin resolver, no bloqueante:** faltan `vol-03`/`vol-04` entre Bélgica
(20 jul) y Zandvoort (31 ago) — no se investigó por qué (¿semanas sin suficientes
historias verificables, como el propio script prefiere, o simplemente no se corrió?).
No se tocó esta sesión, queda para decidir si se llena o se deja como está.

## Paso 5 "Feed F1 news today" — MVP construido y en vivo (4 sep 2026)

**Confirmado en cero, a diferencia del Paso 3:** sin rutas, componentes ni migraciones
antes de esta sesión — acá el roadmap sí estaba al día.

**Decisión de arquitectura, confirmada con Ismael:** el feed reusa `digest_items` en
orden cronológico continuo (sin agrupar por issue semanal) en vez de crear una tabla
nueva — es literalmente el mismo patrón de cita (fuente externa + resumen propio + link
de salida) que el newsletter ya usa. **Excluye la serie `recap`** a propósito: mezclar
retrospectiva con "hoy" violaría el mismo principio de integridad que ya rige los
Recaps (nunca presentar contenido viejo como si fuera del momento).

**Gap real cerrado en el camino:** `generate_digest_draft.py` ya calculaba
`entity_tags` por item (empresas/personas/equipos) desde su schema JSON, pero ni el
propio script (`save_draft()`) ni `scripts/ingest-digest.ts` los guardaban nunca — la
columna no existía. Agregada (`supabase/migrations/20260904200000_digest_items_
entity_tags.sql`, corrida a mano en el SQL Editor de Supabase vía navegador, mismo
patrón que la migración de Who's Who de hoy), y los dos scripts corregidos para
persistirlos de acá en adelante. Backfilleados los 24 items existentes del newsletter
(no las 8 de Recaps) leyendo el contenido real ya publicado — sin inventar entidades,
solo categorizando lo que ya estaba escrito.

**`/feed` construida y verificada:** lista cronológica de los 24 items reales (fecha
real de cada historia, no la del issue — van desde oct. 2025 hasta hoy), con conteo real
de "más mencionados esta semana" (entity_tags de items publicados en los últimos 7
días, filtro de aparición >1 para no listar menciones únicas). Localizada en los tres
idiomas (`feed` namespace nuevo en en/es/pt.json) — verificado en vivo que
`/es/feed` y `/pt/feed` renderizan la UI traducida con el contenido real. `tsc`/`eslint`
limpios, responsive verificado. Mismo sistema visual Vintage Editorial que
`/weekly`/`/whos-who-preview` (Archivo Black, JetBrains Mono, terracota, `rounded-sm`).

**Sin decidir todavía, no bloqueante:** si el feed debería tener un límite de
antigüedad (¿90 días? ¿todo el histórico, como está ahora?) — con solo 24 items no
hace falta paginar todavía, pero crecerá cada vez que se corra el generador semanal.
Tampoco se linkeó desde el nav — mismo criterio cauteloso que Who's Who hasta que
Ismael decida.
