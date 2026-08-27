# Roadmap de la semana — PaddockIntel

Plan declarado por Ismael para una semana de sesiones intensas (arrancó 25 ago 2026).
Este doc se actualiza al final de cada sesión con el progreso real, no se deja como
aspiracional. Si algo cambia de prioridad o se descarta, se anota acá también, no se
borra sin dejar rastro.

## Los 5 pasos, en orden

### 1. Migración a Cloudflare
**Estado: bloqueador principal RESUELTO esta sesión.**
- El bug de población de R2 (issues #1110/#12413/#1284) está confirmado resuelto con
  evidencia real: PR #1290 (`--rclone` opt-in) YA estaba mergeado desde la versión 1.20.0
  (ya instalada). Se probó con un deploy real: 9 objetos subidos en 0.5 segundos, cierre
  limpio, sin colgarse — vs el hang indefinido en 0 objetos de antes.
- Se descartó primero la hipótesis de `cloudflared` faltante (instalado y probado sin
  efecto — ese binario no interviene en el paso de población de R2, que sube directo por
  API, no por túneles de Cloudflare).
- Setup que hizo falta: cuenta R2 API Token nuevo (Object Read & Write, scoped al bucket
  `paddockintel-isr-cache`), `rclone.js` instalado como dependencia opcional, 3 variables
  en `.dev.vars` (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CF_ACCOUNT_ID`) — confirmado
  en `.gitignore`.
- Comando de deploy actualizado: `opennextjs-cloudflare deploy --rclone` (no `wrangler
  deploy` directo — el flag es del CLI de OpenNext).
- `r2IncrementalCache` reactivado en `open-next.config.ts` (ya no desactivado).
- **Pendiente si se automatiza el deploy en el futuro** (ej. GitHub Actions): las 3
  variables de `.dev.vars` van a necesitar vivir como secrets del pipeline de CI, no solo
  en el Codespace local.
- Detalle técnico completo: `docs/CLOUDFLARE-MIGRATION.md` (actualizar con esta resolución).

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
- Migración aplicada manualmente vía Supabase SQL Editor (sin CLI/`psql` conectado en
  este entorno) y verificada después vía REST API: 315/315 filas con `content_type` y
  `author_id` poblados, cero `NULL`s; `authors` con la única fila de Ismael Sandoval;
  `article_sources` existe y vacía como se esperaba. Archivo:
  `supabase/migrations/20260827160000_articles_content_type_authors_sources.sql`

**Pendiente:** tagging real por equipo/piloto/tema para publicar 2-3 historias diarias
sigue sin construirse (el `tags` existente es un array de texto plano, no relacional por
categoría) — esto alimenta directamente los pasos 3 (newsletters) y 5 (feed).

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
**Estado: research de arquitectura hecho, nada construido. Más caro que el paso 5.**
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
**Estado: research hecho, nada construido.**
Referencia: aiweekly.co/ai-news-today — feed de noticias ya publicadas (no social),
resumidas en 2-3 líneas, tageadas por categoría, con contador de "entidades más
mencionadas esta semana" (movers, % de cambio vs promedio).

Es casi gratis si el paso 2 se diseña bien desde el principio: misma base de datos
(artículos tageados por equipo/piloto/tema), solo una vista distinta (feed cronológico +
contador de menciones). Mucho más simple técnicamente que el paso 4 — no hay scraping
social ni atribución a personas, es agregación de prensa + tagging.

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

**27 ago 2026 (sesión de esquema de blog):**
- Confirmado que `articles` ya tenía 315 filas reales en Supabase — se corrigió la
  suposición de "arranca de cero" del paso 2
- Migración aditiva aplicada: `content_type` (backfill a `original_analysis` en las 315
  filas), tabla `authors` (con la fila de Ismael), `author_id` en `articles` (backfill a
  las 315 filas), tabla `article_sources` (vacía, lista para agregación futura)
- Verificado post-migración vía REST API: 315/315 filas con `content_type` y `author_id`
  poblados, cero `NULL`s
- Hallazgo de seguridad detectado durante la migración: `ALTER DEFAULT PRIVILEGES` en
  `baseline_schema.sql` le da `TRUNCATE`/`MAINTAIN`/`TRIGGER`/`REFERENCES` a `anon` y
  `authenticated` en toda tabla nueva del schema `public` — afecta decenas de tablas
  existentes, no solo esta migración (detalle completo en la sección dedicada más abajo)

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
**Ya implementado** (ver sesión del 27 ago arriba) — columna agregada a `articles`, las
315 filas existentes backfilleadas a `original_analysis`.

**Impacto en EEAT de cada tipo (distinción confirmada esta sesión):**
- Artículo propio con datos de Jolpica/OpenF1 → construye Experience y Expertise fuerte
- Brief de agregación bien citado → mantiene Trustworthiness (no la destruye), pero no
  construye Experience — en el mejor caso suma algo de Expertise si cruza fuentes con criterio

**Autoría:** aunque hoy Ismael es el único autor, el esquema de blog debería tener un campo
`author` real desde el día 1 (no hardcodeado), para escalar sin fricción el día que se sume
alguien más al equipo editorial. **Ya implementado** — tabla `authors` + `articles.author_id`
(ver sesión del 27 ago arriba).

## Pendiente crítico: página `/about` de Ismael Sandoval

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

Nota de esta sesión: la tabla `authors` (`bio`, `avatar_url`) ya tiene la fila de Ismael
creada pero con esos dos campos en `NULL` — quedan pendientes de completar el mismo día
que se defina el contenido del `/about`, para no tener que sincronizar dos fuentes de
verdad por separado.

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

**Pendiente de definir en próxima sesión:** lista de 15-20 términos candidatos del glosario
(usando el método de minería manual de preguntas reales ya definido arriba), y el glosario
de términos "que se quedan en inglés" por idioma.

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

## Hallazgo de seguridad pendiente: GRANT excesivo a nivel de schema completo

Descubierto durante la migración de `content_type`/`authors`/`article_sources` (paso 2).
**No es un problema de esta migración puntual — es una configuración base de todo el
esquema**, encontrada en `supabase/migrations/00000000000000_baseline_schema.sql`:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
```

Esto le da automáticamente `TRUNCATE`/`MAINTAIN`/`TRIGGER`/`REFERENCES` a `anon` y
`authenticated` en **cualquier tabla nueva** creada en el schema `public` — confirmado que
afecta decenas de tablas existentes (`drivers`, `driver_stats`, `seasons`, `status`,
`sprint_results`, `subscribers`, y más), no solo un par sueltas.

**Por qué importa:** `TRUNCATE` en Postgres **ignora completamente RLS** — no importa que
una tabla tenga policies de "solo lectura", el permiso de `TRUNCATE` es una puerta aparte.
El rol `anon` corresponde a la key pública que vive en el bundle de cliente del sitio
(`NEXT_PUBLIC_SUPABASE_ANON_KEY`), visible por cualquiera.

**Ya se corrigió puntualmente en dos lugares** (evidencia de que no es la primera vez que
se detecta):
- La migración de `authors`/`article_sources` de esta sesión (corregida a solo `SELECT`)
- La migración de `delta_ribbon` (12 de agosto) — ya fue corregida ahí también, sin volver
  a arreglar `glossary_terms` retroactivamente

**`glossary_terms` sigue con el problema sin corregir.**

**Por qué NO se arregla hoy, a propósito:** un `REVOKE` masivo sobre decenas de tablas
existentes es delicado y necesita revisión tabla por tabla, no una regla ciega. Ejemplo
concreto de riesgo: `subscribers` tiene además `INSERT, DELETE` — el `INSERT` ahí podría
ser legítimo (un formulario de suscripción al newsletter necesita que `anon` pueda
insertar una fila). Revocar todo sin distinguir rompería funcionalidad real.

**Pendiente para una sesión dedicada (no ahora, no de paso):**
1. Corregir el `ALTER DEFAULT PRIVILEGES` en `baseline_schema.sql` para futuras tablas
   (que solo otorgue `SELECT` por default a `anon`/`authenticated`)
2. Auditar tabla por tabla cuáles necesitan legítimamente algo más que `SELECT` (ej.
   `subscribers` con `INSERT` para el formulario) antes de revocar en las existentes
3. Corregir `glossary_terms` específicamente, que quedó con el problema sin arreglar
   pese a que `delta_ribbon` ya se corrigió
