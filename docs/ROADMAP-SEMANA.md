# Roadmap de la semana — PaddockIntel

Plan declarado por Ismael para una semana de sesiones intensas (arrancó 25 ago 2026).
Este doc se actualiza al final de cada sesión con el progreso real, no se deja como
aspiracional. Si algo cambia de prioridad o se descarta, se anota acá también, no se
borra sin dejar rastro.

## Los 5 pasos, en orden

### 1. Migración a Cloudflare
**Estado: en curso, bloqueado parcialmente.**
- Bloqueador: bug de población de R2 (issues #1110/#12413/#1284 de opennextjs/opennextjs-cloudflare).
  Fix candidato: PR #1290 (`--rclone` opt-in), aprobado por un reviewer pero **no mergeado**
  a la fecha de esta nota. Revisar `npm view @opennextjs/cloudflare version` cada vez que
  se retome, y buscar si #1290 ya se mergeó.
- Mientras tanto: R2 incremental cache desactivado en `open-next.config.ts` (comentario
  fechado en el archivo explica por qué), deploy funcional en modo degradado
  (sin cache persistente, cada request re-renderiza).
- Detalle técnico completo: `docs/CLOUDFLARE-MIGRATION.md`.

### 2. Estructura de blog
**Estado: no empezado.**
Objetivo: publicar 2-3 historias diarias. Pendiente diseñar el esquema de datos con
tagging por equipo/piloto/tema **desde el día 1** — esto alimenta directamente los
pasos 3 (newsletters) y 5 (feed), así que no conviene construirlo aislado.

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
