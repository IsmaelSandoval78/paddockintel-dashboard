# Paso 4 "Who's Who" — Fase 0: lista curada de voces (34 curadas, 31 elegibles para picks)

Investigación real vía web (sep 2026), no lista de memoria — cada persona tiene rol/outlet
verificado en el momento de escribir esto. Aprobada por Ismael en la Fase 0 original.

**Actualizado 8 sep 2026 — estado real del mecanismo de picks, no aspiracional:** de las 34
voces curadas por identidad, **31 siguen elegibles para producir un pick real**, **3 quedaron
excluidas del mecanismo** (cuentas verificadas como no funcionales para este propósito
específico, detalle en "Estado de la Fase 0" más abajo). De las 31 elegibles, **19 ya tienen
un pick real** publicado en `expert_picks`, y **12 están pendientes de que Ismael elija un
post real y arme el takeaway** (mismo mecanismo que ya funcionó con Rencken/Coleman/etc.) —
ninguna de las 34 está "lista para producir contenido" automáticamente, la curación siempre
es manual.

## Criterio de curación (defendible)

Una voz entra a la lista si cumple **al menos uno** de estos tres:
1. **Acreditación de paddock verificable** — trabaja o trabajó para un medio reconocido
   con acceso de prensa a F1 (Sky, BBC, ESPN, The Athletic, Motorsport.com, The Race,
   RaceFans, PlanetF1, DAZN/Movistar).
2. **Rol técnico real verificable** — ex-piloto de F1, ex-ingeniero/director técnico de
   un equipo, o analista técnico con trayectoria pública de largo plazo (ilustraciones,
   podcasts técnicos, libros).
3. **Trayectoria independiente de largo plazo con reputación establecida** — periodistas
   veteranos con blog/newsletter propio y década(s) cubriendo F1, reconocidos por sus
   pares (ej. citados por otros medios).

**Excluido deliberadamente de esta primera pasada:** cuentas de análisis de datos
anónimas o pseudónimas (ej. `@f1dataanalytics`, `@F1_dataanalysis` y similares) — pueden
tener contenido de calidad, pero no pasan el criterio de identidad verificable. Se pueden
sumar en una fase posterior con un criterio distinto (ej. verificar metodología en vez de
identidad), no en la Fase 0.

**Nota sobre "Estado de pick" (agregado 8 sep 2026):** cada tabla de abajo tiene una
columna de estado real, verificada contra `expert_picks` en Supabase, no contra este doc:
- ✅ **Pick real** — ya tiene un pick publicado.
- ⏳ **Pendiente de curación** — cuenta real y verificada, sin motivo para excluirla, solo
  falta que Ismael elija un post y arme el takeaway.
- ❌ **Excluida del mecanismo** — cuenta verificada como no funcional para picks (motivo
  específico en la nota de cada fila y en "Estado de la Fase 0").

## Categorías ("lente"), adaptadas del modelo aiweekly.co a F1

- **Investigación** — reporteros de paddock, rompen noticias, fuentes internas
- **Construcción** — analistas técnicos, explican cómo/por qué funciona algo
- **Crítica** — comentaristas/ex-pilotos, evalúan decisiones y desempeño
- **Contexto** — veteranos independientes, historia y política del deporte
- **Datos** — estadística verificable con identidad real detrás

---

## Lista (34 nombres curados por identidad) — 19 con pick real, 12 pendientes, 3 excluidas

Investigación 16 · Construcción 6 · Crítica 8 · Contexto 3 · Datos 1.

### Investigación — reporteros de paddock

| Nombre | Rol / outlet | Handle X | Estado | Nota |
|---|---|---|---|---|
| Chris Medland | Freelance, paddock veterano (ex Sky/RACER) | `@ChrisMedlandF1` | ✅ Pick real | Voz muy respetada, sindicado en varios medios |
| Lawrence Barretto | Corresponsal, F1.com | `@lawrobarretto` | ✅ Pick real | Acceso oficial F1 |
| Jonathan Noble | Editor de F1, Motorsport.com | `@NobleF1` | ✅ Pick real | 20+ años en la disciplina |
| Adam Cooper | Motorsport.com / Motor Sport Magazine | `@adamcooperF1` | ✅ Pick real | Veterano, cobertura histórica |
| Luke Smith | Senior writer, The Athletic | `@LukeSmithF1` | ✅ Pick real | Foco en detrás de escena (mecánicos, ingenieros) |
| Madeline Coleman | Staff writer, The Athletic | `@mwc13_3` | ✅ Pick real | Co-cobertura con Smith |
| Andrew Benson | Corresponsal de F1, BBC Sport | `@andrewbensonf1` | ⏳ Pendiente de curación | Cuenta oficial BBC, 185.2K seguidores, activa con contenido real de F1 (verificado 8 sep 2026) — solo falta que Ismael elija un post |
| Nate Saunders | ESPN (podcast *Unlapped*) | `@natesaundersF1` (+ Bluesky `@natesaunders.bsky.social`) | ✅ Pick real | Único confirmado con presencia activa en Bluesky |
| Laurence Edmondson | ESPN, editor de F1 | `@Edmondson_F1` | ⏳ Pendiente de curación | Cuenta real confirmada (verificado 8 sep 2026), pocos seguidores (3,894) para su rol, sin post puntual indexado — sin evidencia de cuenta rota, solo falta curación |
| Scott Mitchell-Malm | The Race | `@SMitchellF1` | ✅ Pick real | — |
| Ben Anderson | The Race (Group F1 Editor) / WTF1 | `@BenAndersonAuto` | ⏳ Pendiente de curación | Handle confirmado correcto (Group F1 Editor real en The Race, no otro "Ben Anderson" automotriz — verificado 8 sep 2026), 5,577 seguidores, rol profesional activo, sin post puntual indexado |
| Thomas Maher | PlanetF1 | `@thomasmaheronf1` | ✅ Pick real | — |
| Mat Coch | PlanetF1 (Deputy Editor) | `@matcoch` | ✅ Pick real | — |
| Dieter Rencken | RaceFans / RacingNews365, ex-Autosport (25 años) | `@RacingLines` | ✅ Pick real | Fuerte en política/economía de F1 — relevante para el ángulo de PaddockIntel |
| Craig Slater | Sky Sports News, reportero de F1 | `@craigslatersky` | ❌ Excluida del mecanismo | Cuenta real pero prácticamente vacía (~190 posts totales, feed sin contenido visible en ningún intento) — problema de datos, no de identidad |
| Ted Kravitz | Sky Sports F1 ("Kravitz Notebook") | `@tedkravitz` | ⏳ Pendiente de curación | Investigativo, fuentes de paddock — cuenta real y activa, sin nada que haya llegado a nivel de pick todavía |

### Construcción — analistas técnicos

| Nombre | Rol / outlet | Handle X | Estado | Nota |
|---|---|---|---|---|
| Craig Scarborough | Freelance, F1 TV Tech Talk (ScarbsF1) | `@ScarbsTech` | ✅ Pick real | Ilustrador/analista técnico dedicado — `@Scarbsf1` es una cuenta vieja suya, inactiva, no usar |
| Giorgio Piola | Veterano (50+ años) | `@Giorgio_Piola` | ❌ Excluida del mecanismo | Cuenta real, pero 100% comercial desde nov. 2021 (Black Friday, relojes de edición limitada) — sin contenido técnico real que citar. Excluirlo evita atribuirle al ilustrador técnico histórico de F1 una opinión que nunca dio (riesgo real de EEAT, no solo falta de material) |
| Mark Hughes | The Race / Motor Sport / F1.com | `@SportmphMark` | ✅ Pick real | Veterano en análisis técnico/estrategia |
| Gary Anderson | The Race F1 Tech Show | `@GaryAndersonF1` | ⏳ Pendiente de curación | Ex-director técnico real (Jordan, Jaguar) — ojo, homónimo del jugador de darts, verificar handle con "F1" en el nombre |
| Bernie Collins | Sky Sports F1, analista | `@bernie_collins1` | ⏳ Pendiente de curación | Ex-jefa de estrategia (Aston Martin, McLaren) — rol técnico real |
| Toni Cuquerella | DAZN España, comentarista (ex-Movistar+) | `@tonicuque` | ✅ Pick real | Ex-ingeniero de pista en escuderías de F1 |

### Crítica — ex-pilotos y comentaristas

| Nombre | Rol / outlet | Handle X | Estado | Nota |
|---|---|---|---|---|
| Martin Brundle | Sky Sports F1 | `@MBrundleF1` | ⏳ Pendiente de curación | Ex-piloto de F1 |
| Jenson Button | Sky Sports F1 | `@JensonButton` | ✅ Pick real | Campeón del mundo F1 |
| Nico Rosberg | Sky Sports F1 | `@NicoRosberg` | ⏳ Pendiente de curación | Campeón del mundo F1 — cuenta activa con contenido real de F1 confirmado (post del 18 mar 2026 reaccionando a la victoria de Antonelli en Australia, verificado 8 sep 2026), mezclado con contenido de su fondo VC |
| Jacques Villeneuve | Sky Sports F1 | `@27villeneuve` | ⏳ Pendiente de curación | Campeón del mundo F1 — cuenta real confirmada (24.9K seguidores desde 2009), muy citado en medios durante 2026 sobre reglamentos/mercado de pilotos, sin post propio indexado con URL específica (verificado 8 sep 2026) |
| Karun Chandhok | Sky Sports F1 | `@karunchandhok` | ⏳ Pendiente de curación | Ex-piloto de F1 |
| Anthony Davidson | Sky Sports F1 | `@antdavidson` | ❌ Excluida del mecanismo | Ex-piloto de F1 — no tiene cuenta personal de X en absoluto, solo aparece citado a través de `@SkySportsF1`. Distinto a Piola/Slater: acá no hay handle que corregir, el mecanismo de "un post por persona" no le aplica en absoluto (sin plataforma propia, requisito explícito de `docs/advisors/EEAT-EXPERT.md`) |
| Naomi Schiff | Sky Sports F1 | `@NaomiSchiff` | ⏳ Pendiente de curación | Ex-piloto GT |
| Pedro de la Rosa | DAZN/Movistar España, embajador Aston Martin | `@PedrodelaRosa1` | ⏳ Pendiente de curación | Ex-piloto de F1 |

### Contexto — veteranos independientes

| Nombre | Rol / outlet | Handle X | Estado | Nota |
|---|---|---|---|---|
| Joe Saward | Independiente (Joe Blogs F1 / Motorsport Week) | `@joesaward` (+ Bluesky `@joesaward.bsky.social`) | ✅ Pick real | Décadas cubriendo F1, fuerte en política del deporte |
| James Allen | JA on F1 (Motorsport.com/Autosport/Motor1) | `@Jamesallenonf1` | ✅ Pick real | Veterano, ex-comentarista TV |
| Antonio Lobato | DAZN España, narrador principal | `@alobatof1` | ✅ Pick real | 20+ años narrando F1 en español — trayectoria, no credencial técnica/ex-piloto. `@Alobato_F1` es una cuenta secundaria con menos seguidores, confirmada como no la principal — no usar |

### Datos — identidad real detrás de la estadística

**Corrección (revisión de handles):** Duncan Alexander salió de la lista — es estadístico de
**fútbol** (co-fundador de OptaJoe), no de F1; se coló por un hit de Wikipedia mal cruzado en
la búsqueda original. Bruce Jones también salió — sin cuenta de X pública confirmada, no
sirve para el motor de embeds del MVP aunque sea una fuente bibliográfica válida para citar
en contenido aparte.

| Nombre | Rol / outlet | Handle X | Estado | Nota |
|---|---|---|---|---|
| David Hayhoe | Estadístico del anuario *Autocourse* desde 1991 | `@davidf1data` | ✅ Pick real | Autor de 4 ediciones del *Grand Prix Data Book* (1950-presente) — identidad y trayectoria verificables |

---

## Nota sobre acceso a redes (retomando el bloqueador de la Fase 1)

Ninguna de estas personas requiere una API paga para arrancar el MVP: el hallazgo clave
del roadmap (`docs/ROADMAP-SEMANA.md` §4) sigue aplicando — embeds gratuitos de
`publish.x.com` alcanzan para mostrar un post destacado por persona, sin necesidad del
tier de desarrollador pagado (~$200/mes). De los 34, solo 2 tienen Bluesky confirmado en
esta pasada (Nate Saunders, Joe Saward) — el resto no se buscó ahí específicamente.

**Confirmado 8 sep 2026:** sin acceso directo al feed en vivo de X tampoco se puede
automatizar la verificación de actividad — se intentó vía Nitter como alternativa (mismo
mecanismo que documenta el roadmap) y los espejos públicos están caídos desde el 24 ago
2026 por cartas de cese y desista de X Corp. La verificación de las 5 voces del "Grupo C"
(ver "Estado de la Fase 0" abajo) se hizo vía búsqueda web indexada, no acceso directo al
feed — suficiente para confirmar que las cuentas son reales y no encontrar evidencia de
que estén rotas, pero no al mismo nivel de certeza que un feed en vivo.

## Estado de la Fase 0

1. ✅ **Aprobación de Ismael** — lista revisada categoría por categoría, con ediciones
   reales aplicadas en el camino (Antonio Lobato movido de Crítica a Contexto).
2. ✅ **Handles de X verificados** uno por uno vía búsqueda — no de memoria. Corrigió un
   error real en el camino: Duncan Alexander (estadístico de **fútbol**, no de F1) salió
   de la lista; Bruce Jones también, por no tener cuenta de X pública confirmada.
3. **Pendiente real, no bloqueante:** confirmar Bluesky para el resto de la lista, y
   decidir si se suma una segunda tanda de voces (alemanas/italianas) para acercarse más
   al techo de 50 — 34 curadas ya cumple el piso de 30 pedido por el roadmap, y 31
   elegibles para picks lo sigue cumpliendo tras las exclusiones de abajo.
4. **Ambigüedades de cuenta, ya resueltas:** Antonio Lobato → `@alobatof1` (no
   `@Alobato_F1`, secundaria) y Craig Scarborough → `@ScarbsTech` (no `@Scarbsf1`,
   vieja/inactiva). Ninguna bloquea la carga en Supabase.
5. **Decisión aplicada 8 sep 2026 — 3 de las 34 cuentas quedan excluidas del mecanismo de
   picks de forma permanente, verificadas individualmente, sin reemplazo por ahora:**

   - **Giorgio Piola** (`@Giorgio_Piola`) — cuenta real, pero 100% comercial desde
     nov. 2021 (ventas de Black Friday, relojes de edición limitada), sin contenido
     técnico real que citar. Forzar un pick acá violaría `docs/advisors/EEAT-EXPERT.md`
     (nunca atribuir a un experto una toma de postura que no es realmente suya).
   - **Craig Slater** (`@craigslatersky`) — cuenta real pero prácticamente vacía
     (190 posts totales, feed sin contenido visible en ningún intento). Problema de
     datos, no de identidad — la cuenta es genuina, simplemente no hay material.
   - **Anthony Davidson** — no tiene cuenta personal de X en absoluto; solo aparece
     citado a través de `@SkySportsF1`. Distinto a los dos anteriores: acá no hay
     handle que corregir, el mecanismo de "un post por persona" no le aplica — sin
     plataforma propia, bloqueador estructural per `EEAT-EXPERT.md` ("real identity
     AND platform must be clear"), no de contenido.

   **Por qué sin reemplazo por ahora:** 34 − 3 = 31 voces siguen elegibles, todavía por
   encima del piso de 30 que fijó el roadmap para la Fase 0 — no hace falta forzar un
   reemplazo hoy. Si se decide sumar reemplazos reales y verificables (o una segunda
   tanda para acercarse a 50), es tarea aparte con la misma investigación real que armó
   esta lista, nunca nombres inventados.

6. **Verificación del "Grupo C" completada 8 sep 2026 — 5 voces sin pick, investigadas
   una por una con búsqueda real, mismo rigor que el punto 5:** Nico Rosberg, Jacques
   Villeneuve, Laurence Edmondson, Andrew Benson y Ben Anderson. Las 5 tienen cuenta real
   confirmada, ninguna mostró evidencia de estar rota o vacía como Piola/Slater — 2
   (Rosberg, Benson) tienen contenido de F1 real y reciente confirmado con URL de post
   específica; las otras 3 (Villeneuve, Edmondson, Ben Anderson) tienen rol profesional
   real confirmado pero sin post puntual indexado por búsqueda (limitación de la
   herramienta, no evidencia de cuenta muerta). **Las 5 se clasifican como "pendiente de
   curación", ninguna se suma a la exclusión.**

7. **Estado real consolidado de las 34 voces curadas, verificado contra `expert_picks` en
   Supabase (no contra ninguna versión anterior de este doc):**
   - **19 con pick real** — ver columna "Estado" en cada tabla de arriba.
   - **12 pendientes de curación** (Ted Kravitz, Karun Chandhok, Pedro de la Rosa, Martin
     Brundle, Naomi Schiff, Gary Anderson, Bernie Collins, Nico Rosberg, Jacques
     Villeneuve, Laurence Edmondson, Andrew Benson, Ben Anderson) — cuentas reales y
     verificadas, sin motivo para excluirlas, esperando que Ismael elija un post real y
     arme el takeaway (mismo mecanismo que ya funcionó con Rencken/Coleman/etc., un LLM
     ayuda a redactar, nunca a elegir qué es relevante).
   - **3 excluidas del mecanismo** (Giorgio Piola, Craig Slater, Anthony Davidson) — ver
     punto 5.
   - 19 + 12 + 3 = 34, cuenta exacta (corrige un error de conteo del 4 sep 2026 en
     `docs/ROADMAP-SEMANA.md`, donde la enumeración de "15 nombres sin pick" solo sumaba
     14 — faltaba Ben Anderson).
