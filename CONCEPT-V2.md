# PaddockIntel v2 — Concepto de relanzamiento (Holanda, 23 ago 2026)

> Documento vivo. Nace de una sesión de diseño en conversación — no reemplaza `DESIGN.md`
> (tokens visuales) ni `CLAUDE.md`/`SKILL.md` (reglas de implementación), es el puente entre
> "por qué" y "qué construir". Rama: `v2-relanzamiento`.

## 1. Visión

PaddockIntel se convierte en la **Wikipedia visual de la Fórmula 1**: autoridad de datos
verificables + storytelling que hace sentir al lector "el que entiende el juego por dentro" —
nunca el drama manufacturado de los medios genéricos de F1. Objetivo de negocio explícito:
después del 23 de agosto, inversionistas llaman para invertir. Esto es el relanzamiento final
y definitivo — no un ajuste más.

**Regla de sabor, aplicada en toda la sesión:** el riesgo constante no es la paleta oscura en
sí (Data Mode navy+glow es, hoy, el nuevo cliché de IA genérica — sucesor del
glassmorphism/gradiente-morado). Lo que hace esto no-genérico tiene que ser **contenido F1
específico que ningún dashboard financiero puede robar**: geometría real de circuito, datos
reales de telemetría, voz editorial. Si lo primero que se nota es el fondo oscuro, se perdió
el juego. Si lo primero que se nota es "esto solo podría ser Suzuka", se ganó.

## 2. Cuatro patrones visuales, no gráficos improvisados

**Corregido tras auditar Drivers** — la sesión empezó pensando que había dos motivos (cinta vs.
celdas), pero el código real ya tiene un tercer patrón bien resuelto que la cinta no debe
pisar. Formalizado así evita que cada página invente un gráfico nuevo, y evita también que se
fuerce la cinta donde no corresponde:

- **La Cinta (Delta Ribbon)** — exclusiva de **2 partes en un contexto espacial** (dos pilotos,
  un trazado real). Ancho = magnitud del delta, color = quién gana terreno. No generaliza bien
  a más de dos sujetos ni a comparaciones puramente temporales — ver por qué abajo.
- **Gráfico multi-línea de batalla** (`ChampionshipBattle.tsx`, ya construido en Drivers) —
  para **N partes en el tiempo**: una línea por piloto/constructor, color de equipo, línea
  punteada para el segundo piloto del mismo equipo, bloque de gap con número rojo gigante al
  costado. Este es el patrón correcto para "cómo evolucionó la pelea por el campeonato ronda a
  ronda" — **no la cinta**. La cinta no escala a 3+ contendientes al título; un multi-línea sí.
- **Arco de un solo sujeto** (`CareerArc.tsx`, ya construido en Drivers) — línea+área de
  trayectoria de una sola entidad en el tiempo (puntos/posición de un piloto por temporada),
  sin comparación contra otro. Job distinto al multi-línea: no hay "quién gana", hay "cómo le
  fue a este".
- **Grilla de celdas + contador** — para un **hecho puntual curado**, sin arco: rachas, "forma
  de la temporada", streak activo. Ya resuelto en el Hub — no se toca la mecánica, solo tokens.

Donde un dato no tiene arco, o donde ya hay 3+ sujetos, no se le fuerza la cinta — eso también
es restraint. La cinta se reserva para el Delta Ribbon en pista, punto.

## 3. Pieza insignia — el Delta Ribbon

El comparador de track dominance. La pieza que un inversionista entiende en 3 segundos y que
no existe así en ningún medio de F1 hoy.

**Mecánica base:** el circuito se dibuja como silueta delgada y fantasma (plano, nunca
isométrico — regla ya existente en `DESIGN.md` para 9:16 mobile). Sobre él corre una cinta
cuyo **grosor = magnitud del delta** de tiempo entre dos pilotos y **color = de qué piloto**
(colores de equipo reales). Se scrubea con el dedo; un cluster sincronizado abajo (velocidad,
%acelerador, %freno, marcha, JetBrains Mono) actualiza en vivo como radio de boxes traducido a
números.

**Ciclo de vida completo (los 5 estados, en orden):**

1. **Histórico (sólido)** — lo que ya pasó, ancho/color = delta real ya ocurrido.
2. **Proyección (cono punteado)** — la cinta sigue de largo del punto actual del auto en trazo
   punteado que se abre en cono: cuanto más lejos en el tiempo/distancia, más ancho e incierto.
   El punto donde el cono cruza el trazado es el "punto de alcance proyectado", marcado con el
   nombre real de la curva, no coordenadas. **Explícitamente rechazado:** el gauge de
   porcentaje tipo AWS F1 Insights (ej. "68% probabilidad") — es fake precision, es el
   arquetipo de diseño de IA genérico, y ya existe en TV. El cono comunica incertidumbre real
   de forma honesta y espacial en su lugar.
3. **Snap (pasó) vs. disolución (se defendió)** — en el instante exacto del rebase, el cono se
   cierra de golpe en línea sólida (banda elástica soltándose), con el color cruzando en el
   punto exacto (x,y) del trazado + nombre de curva + vuelta. Sin confeti, sin ícono de check
   — el snap ES el festejo. Si el líder defiende, el cono se disuelve/retrae en vez de
   cerrarse — verbo visual distinto para resultado distinto, sin necesitar texto.
4. **Trenza (touch-and-go / pelea de varios cambios)** — si la posición cambia de mano más de
   una vez en una ventana corta, ese tramo deja de ser sólido y pasa a ser una trenza de los
   dos colores de equipo — la trenza ES la historia, no hace falta animar cada swap por
   separado (evita el parpadeo de snaps consecutivos). El cono de proyección se pausa durante
   una trenza activa (no fingir confianza sobre un tramo ya demostrado volátil). El label pasa
   de un punto ("Curva 3") a un rango ("Curvas 3–5"). El haptic en mobile dispara una sola vez,
   al destrenzar, no por cada cambio de mano.
5. **Export compartible** — la cinta congelada en el punto de mayor delta ES el scorecard
   (1:1, 9:16, 16:9, fondo claro `#F4F4F0`, sin watermark oscuro). Usa el estándar Remotion
   "Blueprint" ya existente en `DESIGN.md` (línea dura, sin glow, grid técnico) —
   **deliberadamente no** el lenguaje glow de Data Mode: lo que sale a redes no tiene que
   matchear el dashboard en vivo, mismo criterio para scorecards en general.

**De qué datos reales sale (nada inventado, todo por verificar en implementación):**
`/location` de OpenF1 (x,y,z ~3.7Hz) para el delta espacial · `/laps`
`segments_sector_1/2/3` para no recalcular mini-sectores desde cero · `/car_data` para
throttle/brake/speed/gear (alimenta cluster + títulos por plantilla, nunca narrativa libre de
IA) · `/intervals` para tasa de cierre de brecha · `/stints` para delta de compuesto/edad de
neumático · flag de DRS.

**Corte de alcance para el 23 de agosto — cerrado 2026-08-11 (panel de asesores, ver §12):**
el modo batalla en vivo (punto (b) de abajo) **queda fuera del lanzamiento.** El Delta Ribbon
del 23 de agosto es **solo modo histórico** — los 5 estados del ciclo de vida de arriba,
aplicados post-carrera, leyendo de Supabase precalculado (mismo patrón barato que ya usa todo
el sitio). Tres lentes independientes del panel (Lógica, CFO, Sistemas) llegaron a esta misma
recomendación por caminos distintos: es la única excepción que rompería la regla arquitectónica
de nunca llamar a OpenF1/jolpica directo desde una request, y no tiene arquitectura resuelta a
12 días del lanzamiento. El modo histórico solo ya cumple la promesa de "lo que un
inversionista entiende en 3 segundos" — no se pierde la pieza insignia, se recorta la parte más
cara y menos probada. El motor de detección de rebases que esto habilitaría queda agrupado con
Mi Box Fase 2 (§4) y "rivalidades" de Drivers (§6) como un solo bloque post-lanzamiento, ya que
los tres dependen de la misma pieza no resuelta.

**Pendiente de verificar, no de inventar (ahora relevante solo para la fase post-lanzamiento):**
(a) si OpenF1 tiene un endpoint directo de eventos de rebase o hay que derivarlo cruzando
`/position` con `/intervals`; (b) el modo batalla en vivo necesita polling/websocket contra
OpenF1 en vivo (arquitectura distinta al modo histórico post-carrera que lee de Supabase
precalculado) — no resuelto, solo anotado.

**Resuelto tras auditar Circuits (§8) — la tabla de nombres de curva ya existe.** No es un
hueco de dato — `CircuitCorner` (usado en `CircuitHero.tsx`) ya trae `corner_number`, `name`,
`type`, `sector`, `path_percent`, `is_drs_zone`, `description` por circuito, verificado y en
producción hoy. El Delta Ribbon reusa este mismo modelo, no construye uno nuevo.

**Riesgo legal real, no cerrado — corregido 2026-08-11 (ver §12):** OpenF1 se declara
explícitamente de uso **no comercial** (licencia CC BY-NC-SA 4.0; "intended for educational
purposes, personal learning projects, research, and non-commercial fan engagement... For other
use cases, please contact us to discuss appropriate licensing"). PaddockIntel es, por
definición propia (§1), un producto comercial de cara a inversionistas — contradicción directa
no resuelta. `CLAUDE.md` sigue diciendo "confirmado" sobre esta fuente; en la práctica falta
escribirle a OpenF1 (vía openf1.org/contact) y a los mantenedores de jolpica-f1 pidiendo
autorización explícita de uso comercial esta semana — no bloquea desarrollo, pero si la
respuesta es negativa o no llega a tiempo, hace falta una fuente alternativa identificada antes
del 23, no después.

**Reencuadre — no vender esto como "foso" (moat), corregido 2026-08-11:** el 100% del dato
crudo sale de APIs públicas y gratuitas — cualquier competidor con las mismas keys tiene la
materia prima idéntica el día que lanza, y el propio ciclo de vida de 5 estados descrito arriba
es, en sí mismo, un blueprint público fácil de clonar por observación. Ante inversionistas,
encuadrar el Delta Ribbon honestamente como **ventaja de ejecución/primero-en-hacerlo**, no
como barrera de entrada — y no invertir tiempo de los días que quedan en "blindarlo" más allá
de que el modo histórico funcione bien.

## 4. Panel personal — "Mi Box" (no fantasy team)

**Rechazado explícitamente:** clonar F1 Fantasy oficial (presupuesto, transferencias,
scoring). Ya existe, no diferencia, y es semanas de ingeniería que no hay para el 23 de
agosto.

**Reencuadre:** no es un juego, es tu propio registro de "el que entiende" — la métrica que el
panel mide es standing personal de conocimiento, no puntaje de fantasy.

- **Seguir, no fichar** — pilotos/constructores favoritos, sin presupuesto ni cap.
- **Identidad sin avatar subido** — un número propio (como el número de carrera permanente de
  un piloto real) en JetBrains Mono + acento de color del equipo que seguís, en vez de foto de
  perfil (fricción + moderación de contenido innecesaria para el 23).
- **Personalización por orden, no por configuración** — lo que seguís sube en el orden de lo
  que ves en Hub/Blog/Digest. Cero fricción de setup, nada de arrastrar widgets.
- **Conexión real con el Delta Ribbon** — el usuario puede pronosticar antes de que se resuelva
  una batalla en vivo; el panel guarda tu llamada vs. la proyección del algoritmo vs. lo que
  pasó. Con el tiempo, un solo número honesto en mono — % de aciertos — sin insignias, sin
  trofeos, sin racha con emoji.

**Fase 1 (23 ago):** seguir + número propio + orden personalizado de contenido. Standalone,
funciona sin la Fase 2.
**Fase 2 (post-lanzamiento):** pronósticos + score de aciertos — depende de que el modo batalla
en vivo del Delta Ribbon esté probado en producción primero (ver corte de alcance en §3 —
Fase 2 no puede cerrar para el 23 bajo ninguna secuencia realista, ya estaba bien anticipado).

**Hueco real, marcado por el panel de asesores (§12):** "standalone, cero fricción de setup"
asume implícitamente algún mecanismo de persistencia de usuario entre sesiones (a quién seguís,
tu número propio) — hoy no está decidido. No hace falta un sistema de cuentas para el 23: la
recomendación es cookie o `localStorage` sin login, pero hay que decidirlo explícitamente antes
de construir la UI de Fase 1, no asumirlo.

## 5. Hub — auditoría real (código leído, no supuesto)

**Hallazgo importante:** `CLAUDE.md` describe un Hub de mapa+panel lateral. Eso **no es lo que
existe**. Lo real y en vivo (confirmado en `app/[locale]/(hub)/page.tsx` y
`components/home/kinetic/HomeExperience.tsx`) es una experiencia kinetic de scroll de 9
secciones + footer:

```
Hero → Ticker → LastRaceChapter → NextRaceChapter → TheGrid → StreaksSection
  → FormGuideSection → SeasonShapeSection → ChampionshipGapSection → KineticFooter
```

`SKILL.md` documenta solo 6 de las 9 — le faltan Form Guide, Season Shape, Championship Gap.
Ambos docs quedan desincronizados de la realidad; corregir es tarea de docs, no bloquea el
diseño.

**Por sección:**

- **Hero** (`Hero.tsx`) — bien ejecutado: número de auto fantasma, nombre kinetic SplitText,
  banda de stats (pts/wins/poles), indicador LIVE. El fondo `WarpField.tsx` está calibrado
  para fondo claro (78% tinta casi-negra / 14% color equipo / 8% rojo) — **requiere
  recalibración de color real para Data Mode**, no es solo una variable CSS. La idea inicial
  de poner la cinta congelada como fondo completo se descartó al ver que ya hay dos capas
  ambiente apiladas (WarpField + número fantasma) sobre contenido denso — meterla completa
  compite por atención. Ajuste: el hairline superior de 1px (hoy línea plana de color de
  equipo) se convierte en mini-cinta viva — mismo gesto, escala apropiada.

  **Discrepancia resuelta 2026-08-11 — confirmado que faltaba, ya agregado.** El subhead NO
  existía en `Hero.tsx` (el panel de asesores tenía razón, §12) — se agregó: `useTranslations
  ('hub')` + key `hub.tagline`, renderizado justo debajo de la línea de meta, antes del bloque
  de nombre/stats (el "por qué" registra antes que el "quién"). Reusa una key `hub.tagline` que
  ya existía en los tres locales pero estaba huérfana (sin ningún componente que la
  consumiera) — se sobrescribió su valor. EN: "Understand the sport. Not just watch it." ES:
  "Entender la Fórmula 1. No solo mirarla." **PT: sigue mostrando el placeholder viejo ("Hub de
  inteligência F1") a propósito — no se inventó una traducción nueva, sigue pendiente el pase
  nativo (§11).** Verificado con dev server en EN y ES, cero errores de consola.
- **LastRaceChapter / NextRaceChapter** — comparten el mismo componente `TrackDraw.tsx`, que
  hoy dibuja idéntico en los dos casos (línea fantasma + sólida, 0→100% al scroll) sin
  distinguir "ya pasó" de "todavía no pasó". Nota: son circuitos distintos casi siempre (no un
  mismo trazado con dos estados). Propuesta real: agregar prop `state: 'confirmed' |
  'projected'` a `TrackDraw` — el de `NextRaceChapter` dibuja punteado/tinte teal, mismo
  lenguaje que el cono del Delta Ribbon, reforzado en el código, no solo en la intención.
  Ambos archivos ya usan 100% variables CSS (cero hex hardcodeado) — el re-skin a Data Mode es
  cambiar `globals.css`, no tocar estos componentes.
- **TheGrid** — ranked list bien resuelta (ghost numerals, barra de puntos scrubbed, skew por
  velocidad de scroll, hover flood de color de equipo). No necesita la cinta — ya es una lista
  rankeada, que es justamente la regla del sistema (nunca pie charts). Se valida tal cual, solo
  tokens.
- **StreaksSection / FormGuideSection / SeasonShapeSection** — las tres son la misma mecánica
  (grilla de celdas + contador) con datos distintos, **tres veces seguidas** en el scroll. Esto
  es un problema real de ritmo: mismo golpe visual repetido 3 veces antes de que
  `ChampionshipGapSection` finalmente cambie de registro. Recomendación: consolidar
  Streaks+FormGuide en una sola sección de hasta 6 celdas, y/o resecuenciar para que no haya
  tres beats idénticos consecutivos. Pendiente de decisión del usuario — no ejecutado.
- **ChampionshipGapSection** — hoy es un snapshot puro (`HomeChampionshipGapData` solo trae
  gap actual, sin histórico por ronda). **Corregido tras auditar Drivers:** no hace falta
  cinta nueva ni dato nuevo — `ChampionshipBattle.tsx` (página índice de Drivers) ya resuelve
  esto con un multi-línea por piloto/color de equipo + el mismo bloque de gap con número rojo
  gigante, y su tipo `DriversBattleData` (`rounds` + `series`) ya trae el histórico por ronda
  que se pensaba que faltaba. Propuesta real: el Hub reusa ese mismo componente/dato (o una
  variante compacta del mismo), no inventa uno nuevo. Ahorra el trabajo de datos que se había
  anotado como pendiente.

## 6. Drivers — auditoría real (código leído)

**Página de detalle** (`DriverDetailExperience.tsx`) — orden real: Hero → 01 banda de stats →
`CareerArc` (arco de un solo sujeto, ya bueno, ver §2) → grid 2 columnas (02 Season-by-Season
| 03 Win History + 04 Qualifying) → 05 Constructors → 06 `CircuitRecordSection` → 07
`CareerPathTimeline` → scorecard compartible. Todo en variables CSS, re-skin limpio.

**Página índice** (`DriversClient.tsx`, orquestador real detrás de `drivers/page.tsx`) — orden
real: `FormStrip` → `ChampionsWall` → `ChampionshipBattle` (solo vista 2026) → `QualiDuel`
(solo vista 2026) → `EraGrid` → `InlineDriverPanel` (overlay al seleccionar un piloto).

**Lo que ya existe y no hay que reinventar:**
- `CareerArc` — trayectoria de puntos/posición por temporada de un piloto, con marcador dorado
  en años de campeonato. Correcto tal cual, solo tokens.
- `ChampionshipBattle` — multi-línea de la pelea por el título, con dato histórico por ronda
  ya disponible (`DriversBattleData`). Reusar para el Hub, ver §5.
- `QualiDuel` — duelo de clasificación compañero-vs-compañero, barra que abre de 50/50 al
  resultado real. Buen patrón restringido a la temporada actual.

**Lo que sí es un hueco real, confirmado (no redundante con lo anterior):** "rivalidades" —
con qué oponentes (no solo compañeros de equipo) peleó más este piloto en pista, a través de
circuitos y temporadas. No existe en ningún componente auditado. Sigue siendo candidato a
compartir motor de detección de batallas con el Delta Ribbon, pendiente de la misma
verificación de datos anotada en §3 (endpoint de eventos de OpenF1 vs. derivarlo).

**Hallazgo de tokens, no de layout:** varios componentes de Drivers usan `var(--gold)` (años
de campeonato) que `DESIGN.md` v2 no define explícitamente para Data Mode — falta agregar el
equivalente oscuro de `--gold`/`--gold-dim` (y probablemente `--green`/`--green-dim`) al
documento de tokens antes de re-skinear estas páginas.

## 7. Constructors — auditoría real (código leído) — hallazgo grave

Tesis narrativa sin cambios: "la máquina, no la persona" — desarrollo del auto, boxes,
confiabilidad; color/librea de equipo como señal dominante; hero number propio (parada más
rápida / racha de finalizaciones), no puntos.

**Pero el código real cambia el plan.** A diferencia de Drivers, acá el índice y el detalle
están en estados completamente distintos:

- **Página índice** (`ConstructorsClient.tsx`, `InlineConstructorPanel.tsx`,
  `ConstructorEraGrid.tsx`) — sana, cliente, usa variables CSS consistentemente (9-21 usos de
  `var(--...)` por archivo). Mismo tratamiento de re-skin liviano que el resto del sitio.
- **Página de detalle** (`app/[locale]/(hub)/constructors/[slug]/page.tsx`, 708 líneas) —
  **no pasó por el sistema de diseño actual en absoluto.** Sin `'use client'`, sin GSAP, sin
  motion. Usa `font-serif` (no existe en el sistema tipográfico — ni Archivo Black, ni
  JetBrains Mono, ni Lora, ni Inter). Colores 100% hex hardcodeados, no variables:
  `#050505`, `#0A0A0A`, `#1A1A1A`, `#2A2A2A`, `#6B6B6B`, `#D4D0C8`. Un hallazgo puntual serio:
  usa `#E10600` para rojo de acento en vez de `--red: #E61919` — **es un rojo distinto**, un
  bug de inconsistencia de marca ya presente hoy, no algo que introduce el v2. Tiene además una
  banda de stats con fondo oscuro (`#0A0A0A`) incrustada dentro de una página clara — un
  "dual mode" ad hoc, mal hecho, con hex que no coinciden con ningún token real.

Esto confirma la deuda técnica que ya estaba anotada en `SKILL.md` ("Constructors detail page
redesign") — no es cosmético, es severo. **No se puede re-skinear con un cambio de tokens
como Hub/Drivers** — hay que reconstruirla. Recomendación: usar `DriverDetailExperience.tsx`
como plantilla de grammar (breadcrumb → hero → banda de stats → grid 2 columnas → secciones
numeradas), no parchear los hex existentes uno por uno.

**Decisión cerrada 2026-08-04 — Fase 2, patch mínimo ahora.** La reconstrucción completa
(plantilla `DriverDetailExperience.tsx`, Data Mode, motion) queda para después del 23 de
agosto — no entra en el alcance del lanzamiento. Antes del 23 de agosto, solo se corrige el
bug de marca `#E10600` → `--red: #E61919` (cambio de una línea, sin tocar el resto del hex
hardcodeado ni agregar motion). El resto de la página sigue tal cual está — sin Data Mode, sin
`'use client'`, sin `font-serif` corregido — hasta la reconstrucción de fase 2.

## 8. Circuits — auditoría real (código leído) — mejor de lo esperado

Tesis narrativa confirmada y ya construida en gran parte: "el carácter del lugar". A
diferencia de Constructors, acá el código real está **adelantado** respecto a lo que se había
supuesto en la tesis original.

**Orden real** (`CircuitDetailExperience.tsx`): Breadcrumb → `CircuitHero` → 01 Decade
Dominance (constructor dominante por década, con un "muro de eras" de celdas por año — bueno,
específico, no genérico) → 02 Constructor Wins (barras rankeadas) → 03 Qualifying Record
(pole histórica + poles recientes) → 04 Race 2026 result/countdown → 05 Circuit Intelligence
(`CircuitIntelGrid`) → 06 Champions Timeline (`CircuitTimeline`) → 07 Head to Head
(`TrackDominancePanel`).

**Hallazgos grandes, todos buenos:**
- `CircuitHero.tsx` ya dibuja el trazado real del circuito (mismo `trackPathData` que usa el
  Hub), **plano** (cumple la regla de `DESIGN.md`), con los tres sectores coloreados y
  dibujándose en secuencia "como si cayeran los parciales de una vuelta" — S1 en los colores
  reales de la bandera del país (`FLAG_COLORS`, 35+ países), S2 blanco, S3 rojo. Ya tiene
  **marcadores de curva reales con hover** (número, nombre verificado, tipo, zona DRS,
  descripción) — esto resuelve directamente el hueco de dato que se había anotado en §3 para
  el Delta Ribbon, ver la corrección ahí.
- El mapa de trazado ya vive como "objeto oscuro, no fondo de página" (comentario explícito en
  el código) sobre fondo `#555555` — es decir, **ya es un fragmento de Data Mode dentro de una
  página Story-Mode-como-v0.3.0**. El re-skin acá no invierte nada, extiende el tratamiento
  oscuro que ya existía a toda la página.
- `CircuitIntelGrid` trae contenido genuinamente específico y no genérico: % DNF y sus causas,
  conversión pole-a-victoria, rachas, ganador más joven/viejo, evolución de boxes por década,
  victorias por nacionalidad — exactamente el nivel de especificidad que pide la regla de
  "Specificity" del Critique Gate. Ya usa `InfoTooltip.tsx` para explicar metodología por
  celda — **es el mismo patrón de "mostrar el método" que se propuso para el cono predictivo
  del Delta Ribbon (§3)**; no hay que inventarlo, reusar `InfoTooltip`.
- `TrackDominancePanel.tsx` — aclaración de nombre, no hallazgo de bug: pese al nombre del
  archivo, no es el Delta Ribbon. Es un head-to-head de **victorias históricas en este
  circuito** entre dos pilotos elegidos (winsA vs winsB, barra partida), correctamente
  etiquetado en la UI como "Head to Head", no "dominance". Sin colisión real con el usuario,
  pero vale renombrar el archivo cuando se toque, para no confundir a futuro con el Delta
  Ribbon.

**Deuda real, pero menor:**
- Falta el render de los subtipos de desnivel (puente de Suzuka / terrazas Spa-COTA,
  definidos en `DESIGN.md` §elementos firma) — hoy todo se dibuja plano siempre, sin
  excepción. Es trabajo nuevo real, no reconstrucción.
- `FLAG_COLORS` está duplicado hex-por-hex entre `CircuitHero.tsx` y `CircuitLeftPanel.tsx` —
  limpieza menor (extraer a un módulo compartido), no bloquea nada.

**Corrección a una confusión de sesiones anteriores:** el layout de "mapa interactivo + panel
lateral que swapea al click" que describe `CLAUDE.md` § Hub Principal Layout **no es el Hub**
(que es la experiencia kinetic de scroll, §5) — es el patrón real de la página índice
`/circuits` (`CircuitsClient.tsx` + `CircuitLeftPanel.tsx` + mapa). El doc describe la página
correcta con el nombre equivocado; hay que corregir `CLAUDE.md` para que diga "Circuits index
layout", no "Hub Principal Layout", cuando se sincronicen los docs.

## 9. Records — auditoría real (código leído) — la más sana de las cinco

Tesis narrativa parcialmente confirmada, parcialmente pendiente: "los extremos, en tensión, no
archivados".

**Estado real:** `records/page.tsx` (índice, top-3 por categoría: récords de piloto, de
constructor, ganador más joven/viejo, récord de victorias por circuito, campeonatos más
reñidos), las páginas de detalle (`RecordRankingDetail` — listas rankeadas, cumple la regla de
"nunca pie charts") y `closest-championships` (top-10 de títulos más reñidos de la historia,
con detalle por año) — **cero hex hardcodeado en las 9 archivos auditados.** Es el re-skin más
limpio de las cinco páginas, solo tokens.

**"En tensión" ya existe, pero solo mirando para atrás.** `closest-championships` ya da el
marco de tensión histórica (rankeado por margen más chico de la historia) — es una base real,
no hay que inventarla. Lo que sigue siendo un hueco genuino: el módulo de **"récords en riesgo
esta temporada"** (mirando para adelante, conectando un récord histórico con quién puede
romperlo ahora) no existe en ningún lado. Es la pieza que falta para que Records se sienta vivo
y no solo un archivo.

**Hallazgo de duplicación, cross-cutting con Hub y Drivers:** `SeasonBattleChart.tsx` (usado en
`closest-championships/[year]`) es una **tercera implementación independiente** del mismo
patrón "multi-línea de batalla temporal" — más simple que `ChampionshipBattle.tsx` de Drivers
(2 líneas con tooltip al hover, sin color de equipo, en vez de N líneas team-colored con
draw-on-scroll), resolviendo la misma pregunta que necesita `ChampionshipGapSection` del Hub
(§5). Con esto son **tres construcciones separadas del mismo gráfico** en tres páginas
distintas. Recomendación: extraer un componente `BattleChart` compartido (con variante
compacta/hover para Records, variante rica/draw-on-scroll/team-colored para Drivers y Hub) en
vez de mantener tres implementaciones bespoke. Actualiza el patrón §2 — el multi-línea de
batalla ya no es "un componente que se reusa", es un patrón que se construyó tres veces por
separado y ahora hay que consolidar.

Con esto, las cinco páginas quedan auditadas contra código real (Hub, Drivers, Constructors,
Circuits, Records — §5–§9).

## 10. Decisiones — cerradas 2026-08-04

- **OpenF1 + jolpica-f1 confirmado como fuente de dato — pero no legalmente cerrado, corregido
  2026-08-11.** `CLAUDE.md` actualizado (regla vieja tachada, no borrada, con fecha). Supabase
  sigue siendo la capa de verdad — nunca llamar a OpenF1/jolpica directo desde una request,
  precalcular/cachear. **Lo que sí falta:** OpenF1 se declara de uso no comercial en sus propios
  términos — ver el riesgo legal real marcado en §3 y §12. La decisión técnica (usar estas
  fuentes) sigue en pie; lo que no estaba resuelto es el permiso de uso comercial, que hay que
  gestionar por escrito esta semana.
- **Delta Ribbon — modo en vivo cortado del alcance del 23 de agosto, cerrado 2026-08-11
  (panel de asesores, §12).** El Delta Ribbon lanza solo en modo histórico. El modo batalla en
  vivo, Mi Box Fase 2 y el motor de "rivalidades" de Drivers quedan agrupados como un solo
  bloque post-lanzamiento — los tres dependían de la misma pieza de arquitectura no resuelta.
  Ver §3.
- **PWA confirmado** para el lanzamiento del 23 de agosto (no app nativa). Anotado en
  `CLAUDE.md` § Performance Rules. Nativo se evalúa después, con tracción real.
- **Consolidación Streaks/FormGuide/SeasonShape confirmada** — se funden en una sola sección
  del Hub (hasta 6 celdas) en vez de tres secciones seguidas con el mismo golpe visual. Queda
  como tarea de implementación pendiente (no ejecutada en esta sesión, que fue de concepto).
- **Tokens `--gold`/`--green` para Data Mode, definidos** — ver `DESIGN.md` §Tokens Data Mode.
  Washes ahora son alpha sobre el fondo (`rgba(...)`), no hex sólido — el patrón de v0.3.0 (un
  crema sólido) no traduce a navy oscuro.
- **Digest = Data Mode, Motion/Remotion = se mantiene Blueprint** — confirmadas antes en la
  sesión, sin cambios.
- **Constructors detail — Fase 2, patch mínimo ahora.** Reconstrucción completa queda para
  después del 23 de agosto. Antes del lanzamiento solo se corrige el bug de rojo `#E10600` →
  `--red`. Ver §7.

**Sigue abierto:** `skills.md` sección 6 — falta en el documento fuente que subió el usuario
(salta de 5 a 7), sin definir si se retoma o se descarta. No bloquea nada del trabajo actual.

## 11. Storytelling — marco narrativo (inspirado en la estructura de ERA Residence)

No se copia la estética de esa referencia (cálida, inmobiliaria de lujo — no tiene nada que
ver con Data/Story Mode) — se copia la **estructura**: una promesa emocional corta, tres
pilares nombrados, un detalle estructural elevado a filosofía repetida, y todo revelado en
orden progresivo. Igual que en el resto del documento, el inglés es la fuente de verdad
(`EDITORIAL.md` § Translation Process) — ES y PT son parallel drafts, nunca traducción
literal.

### Promesa emocional (Hero)

- **EN (fuente de verdad):** *"Understand the sport. Not just watch it."*
- **ES (borrador en español neutro — sin voseo/tuteo, por infinitivo; falta el pase editorial
  real que pide `EDITORIAL.md`, esto no es una traducción final):** *"Entender la Fórmula 1.
  No solo mirarla."*
- **PT:** pendiente — necesita un pase real de alguien que escriba en portugués de Brasil, no
  una traducción mía. No inventar esta.

Traduce directo la tesis de psicología ya validada en `DESIGN.md` (el fan busca status de "el
que entiende", no drama) — vive como subhead del Hero, al lado de la cinta congelada del Delta
Ribbon (§5), no tiene que cargar sola con el peso emocional.

### Línea de firma / filosofía repetida

- **EN:** *"Every number has a source."*
- **ES:** *"Nunca un número sin su origen."*
- **PT:** pendiente, mismo criterio que arriba.

No es solo un eslogan — ya es como está construido `InfoTooltip.tsx` (§8), es la razón por la
que se rechazó el gauge de porcentaje tipo AWS (§3), es la razón por la que el cono se abre en
vez de fingir certeza. Se repite como microcopy cada vez que el producto afirma algo (una
predicción, un récord, una stat curada) — no una vez en un about.

### Tres pilares (simétricos, aparecen juntos, temprano en el recorrido)

| EN | ES (borrador) |
|---|---|
| **Verified.** | **Verificable.** |
| **Explained, not sensationalized.** | **Explicado, no sensacionalista.** |
| **Yours.** | **Tuyo.** |

Mapean directo a trabajo ya definido en la sesión: Verified → regla EEAT + `InfoTooltip`.
Explained not sensationalized → Delta Ribbon, récords con contexto, nunca el gauge de falsa
precisión. Yours → Mi Box (§4).

### Arco de revelación progresiva (a nivel de sitio completo)

Hub — gancho (Hero con la cinta) → tres pilares → Drivers/Constructors/Circuits — las
"tipologías", elegís el lente (por piloto, por equipo, por pista) → Records — la profundidad
que sostiene la autoridad → Mi Box — lo hacés tuyo → metodología visible en cada dato, en todo
el recorrido, no solo al final.

**Hueco real, marcado por el panel de asesores (§12):** en ningún punto de este arco hay un
punto de conversión para inversionista — todo el recorrido está optimizado para retención de
fan (Mi Box, streaks, quali duels), pero el objetivo de negocio explícito del §1 ("después del
lanzamiento, inversionistas llaman para invertir") no tiene ninguna acción concreta asociada en
la experiencia. No hace falta que sea intrusivo — puede ser tan discreto como un link
"About/Methodology" en el footer kinetic, o una mención en la línea de firma — pero hoy no
existe ninguno y el objetivo de negocio lo exige. Pendiente de agregar.

## 12. Panel de asesores — auditoría 2026-08-11

Panel de 6 agentes independientes (Lógica, Foso defensivo/Moat, EEAT/Legal, CFO/Unit Economics,
Sistemas, UX/CRO) + 1 Sintetizador, corrido contra este documento tal como estaba el 11 de
agosto. Metodología inspirada en el "Consejo de Consultores" que el usuario viene afinando en
paralelo — panel real, no simulado, cada agente leyó el documento de forma independiente.

**Veredicto: VIABLE CON AJUSTES OBLIGATORIOS.** El re-skin de tokens (Hub/Drivers/Circuits/
Records) y Mi Box Fase 1 son alcanzables en los días que quedan — el panel cita como evidencia
real de velocidad de ejecución (no solo intención) que el 11 de agosto ya se habían completado
el fix del rojo de marca y la conexión de `BattleChart` al Hub. Pero el plan tal como estaba
escrito — con el modo en vivo del Ribbon, Mi Box Fase 2, "rivalidades" de Drivers y el copy de
PT tratados en la misma lista plana que el resto del alcance del 23 — no era defendible en 12
días para un fundador solo.

**Consenso más fuerte — 3 lentes independientes, mismo destino por caminos distintos:** cortar
el modo en vivo del Delta Ribbon del alcance del 23 de agosto (ya ejecutado arriba, §3/§10).

**Hallazgo nuevo más importante:** riesgo legal real de licencia comercial con OpenF1 (§3/§10),
no detectado hasta este panel — el propio EEAT/Legal fue a verificar los términos reales en vez
de asumirlos.

**Discrepancia sin resolver, no un hallazgo cerrado:** UX cuestiona si el subhead del Hero y la
cinta congelada realmente existen en `Hero.tsx` tal como los describe la narrativa de §11 — los
demás lentes asumen que sí sin haberlo verificado. Ver la nota agregada en §5.

**Conflicto real entre lentes, sin resolver a propósito (no se fuerza consenso donde no lo
hay):** Moat argumenta no invertir tiempo extra puliendo el Delta Ribbon más allá de lo
necesario, mientras Lógica/CFO/Sistemas/UX siguen tratándolo como la prioridad de ingeniería
de los días que quedan. No es contradictorio del todo — Moat no dice "no lo construyan", dice
"no lo blinden de más" — pero es una tensión real sobre cuánto tiempo de los 12 días restantes
va a pulir del Ribbon versus a otras cosas que otros lentes marcan como más urgentes (Hero,
WarpField, copy de PT).

**Ajustes ya propagados al resto del documento** (no repetidos acá, ver la sección citada):
corte del modo en vivo (§3/§10), riesgo legal OpenF1 (§3/§10), mecanismo de persistencia de
Mi Box sin decidir (§4), verificación pendiente del subhead del Hero (§5), falta de punto de
conversión para inversionista (§11).

**Pendiente, sin propagar todavía — para la próxima sesión de implementación:** asignar dueño y
fecha esta semana para el pase nativo de portugués de Brasil (Hero + línea de firma, §11) — es
la única dependencia bloqueante del documento entero sin ningún responsable asignado, y bloquea
un locale de lanzamiento obligatorio.

## 13. Próximos pasos

**Las cinco páginas (Hub, Drivers, Constructors, Circuits, Records) ya están auditadas contra
código real — §5–§9, y todas las decisiones de alcance están cerradas — §10.** Queda ejecutar:

1. ~~Corregir el bug de marca `#E10600` vs. `--red: #E61919`~~ — **hecho 2026-08-11.** Era más
   amplio de lo anotado: no solo Constructors detail (2 usos) — también
   `components/drivers/CircuitRecordSection.tsx` (const `RED` de una scorecard exportable vía
   `html2canvas`, corregida como hex literal a propósito, no `var(--red)`, porque el canvas
   necesita el valor resuelto) y `components/map/CircuitMap.tsx` (dos usos en HTML de
   `divIcon` de Leaflet — el mismo archivo ya usaba `#E61919` correcto en otra línea, confirma
   que era un error de tipeo, no una paleta distinta a propósito). Los 4 usos corregidos,
   `grep -rn "E10600"` en el repo da cero resultados. Constructors detail sigue con el resto
   del hex hardcodeado sin tocar — eso queda en fase 2 (§10).

   **Hallazgo colateral, no corregido:** `CircuitMap.tsx` importa `leaflet` (`import L from
   'leaflet'`) — viola directo el "Do Not" de `CLAUDE.md` ("no reintroduce Leaflet... el mapa
   es un SVG plano con d3-geo"). Es un problema real y preexistente, pero reemplazar Leaflet
   ahí es un cambio de arquitectura mucho más grande que "el fix del rojo" — no se tocó, queda
   anotado para decidir aparte.
2. ~~Extraer el componente `BattleChart` compartido~~ — **hecho 2026-08-11.** Nuevo
   `components/ui/BattleChart.tsx`, dos variantes (`rich` — DrawSVG on scroll, labels de fin
   de línea, hover-para-aislar, usada por Drivers; `compact` — render estático, tooltip al
   mouse-move, usada por Records). `ChampionshipBattle.tsx` (Drivers) y `SeasonBattleChart.tsx`
   (Records) ahora son wrappers finos sobre el componente compartido — misma API pública hacia
   afuera, sin cambios para sus callers. `SeasonBattleChart` mantiene su firma
   `{rounds, championName, runnerUpName}` intacta. Typecheck (`tsc --noEmit`) y `eslint` limpios
   en los tres archivos.

   ~~Conectarlo a `ChampionshipGapSection` del Hub~~ — **hecho 2026-08-11.** `getHomeData()`
   (`app/[locale]/(hub)/page.tsx`) ahora trae `driver_standings`/`constructor_standings`
   históricos por ronda para P1/P2 (nuevo batch de fetch después de calcular quiénes son P1/P2,
   cumulativo por ronda con forward-fill, mismo patrón que ya usaba Drivers). Tipo
   `HomeChampionshipGapData` extendido con `history: {rounds, driverSeries, constructorSeries}`.
   `ChampionshipGapSection.tsx`/`GapPanel` renderizan el `BattleChart` (`compact`) debajo del
   número de gap existente — el número gigante rojo no se tocó, sigue siendo el read-en-3-
   segundos, la cinta es contexto adicional, no un reemplazo. Verificado con dev server:
   ambos paneles (pilotos y constructores) muestran la evolución de la brecha ronda a ronda,
   colores de equipo correctos, hover funciona, cero errores de consola.

   **Verificado visualmente con dev server + Playwright, 2026-08-11 — sin regresión en
   ninguno de los dos consumidores.** Records (`compact`): "1984 · Closest Championships"
   (Lauda vs. Prost) renderiza igual que antes, tooltip al hover funciona. Drivers (`rich`):
   "01 · THE TITLE FIGHT" renderiza igual que antes — líneas team-colored, punteado correcto
   para el segundo piloto del mismo equipo, labels de fin de línea, hover-para-aislar
   funcionando. Cero errores de consola en ambas.

   **Bug real encontrado y corregido de paso, no causado por este refactor:** `/drivers`
   mostraba "0 DRIVERS" — `getDriversData()` (`app/[locale]/(hub)/drivers/page.tsx`) buscaba
   "última carrera 2026 por fecha de calendario" (`races.date <= hoy`), encontró la ronda 11
   (ya corrida por fecha) pero esa ronda **todavía no tiene resultados cargados** en
   `driver_standings` — la página cortaba en seco a lista vacía. El Hub nunca pisó esto porque
   busca "última carrera CON standings" (`MAX(race_id)` de `driver_standings`), no por fecha.
   Corregido: `/drivers` ahora usa el mismo criterio robusto que el Hub. Confirmado contra
   Supabase real antes y después del fix (ronda 11 sin standings, ronda 10 sí). No se cargó la
   ronda 11 — esa acción se dejó explícitamente afuera, solo se corrigió la lógica.

**Secuencia recomendada por el panel de asesores (§12), reemplaza el orden anterior:**

3. En paralelo, sin bloquear desarrollo, esta semana: escribir a OpenF1 (openf1.org/contact) y
   a los mantenedores de jolpica-f1 pidiendo autorización explícita de uso comercial (§3/§10);
   identificar fuente alternativa como plan B si la respuesta tarda o es negativa. Asignar dueño
   y fecha para el pase nativo de portugués de Brasil del Hero y la línea de firma (§11).
4. ~~Confirmar contra `Hero.tsx` si el subhead existe~~ — **hecho 2026-08-11.** No existía,
   se agregó (EN + ES; PT queda con placeholder viejo a propósito, pendiente pase nativo). Ver
   §5.
5. ~~Re-skin de tokens en Hub/Drivers/Circuits/Records~~ — **hecho 2026-08-11, colores base.**
   Hallazgo antes de tocar nada: los cuatro registros (Hub, Blog, Digest, Book) compartían **un
   solo set de variables CSS** en `globals.css` — cambiar `:root` directo habría roto Blog
   (Story Mode) también. Solución: nuevo `lib/siteMode.ts` (reusa la misma detección de host
   `hub.paddockintel.com` vs. `paddockintel.com` que ya usaba `Navbar.tsx` para
   `isMagazine` — refactorizado para no duplicar el set de hosts), `data-mode="data"|"story"`
   seteado en `<html>` desde `[locale]/layout.tsx` según el host de la request, y los tokens
   oscuros de Data Mode viven en un bloque `[data-mode="data"] { ... }` en `globals.css` — el
   `:root` original (Story Mode) queda intacto, Blog/Book no se tocan. Verificado: Hub, Drivers,
   Circuits, Records — los 4 con `data-mode="data"` y fondo `#0B1220` real, cero errores de
   consola; el host de magazine (`curl -H "Host: paddockintel.com"` — los navegadores no dejan
   spoofear ese header, se verificó con curl) devuelve `data-mode="story"` correctamente. La
   mayoría de componentes auditados en §5–§9 ya usaban variables CSS, así que el cambio de color
   cascadeó solo, sin tocar componentes uno por uno — confirma que esos audits tenían razón.

   ~~Recalibración de `WarpField` para Data Mode~~ — **hecho 2026-08-11.** El 78% "tinta
   casi-negra" (`0x0a0a0a`) se reemplazó por casi-blanco (`0xf4f4f0`), visible contra el navy;
   el 8% de rojo tenía el mismo bug de marca que ya se había corregido en otros 3 archivos
   (`0xe10600` en minúscula, no lo agarró el grep anterior por case-sensitive) — corregido a
   `0xe61919` de paso. Verificado con dev server: el flujo de líneas ahora tiene densidad
   completa (blanco/teal/rojo) en vez del ~22% que quedaba visible antes, cero errores de
   consola. Confirmado con `grep -rn "e10600"` (minúscula incluida) en todo el repo: cero
   resultados.

   **Pendiente, no incluido en este paso:** (a) el radio de 4-8px en
   tarjetas de dato (`DESIGN.md` §Tokens Data Mode) — quedó afuera de este paso, todas las
   superficies siguen con el radio-cero anterior; (b) consolidación
   Streaks+FormGuide+SeasonShape del Hub (§10) — es un cambio de layout, no de color, sigue
   pendiente aparte.
6. Antes de construir la UI de Mi Box Fase 1: decidir el mecanismo mínimo de persistencia
   (cookie o `localStorage`, sin cuentas — §4).
7. Delta Ribbon en modo histórico únicamente (§3) — los 5 estados del ciclo de vida, leyendo de
   Supabase precalculado. Mi Box Fase 1 (seguir + número propio + orden personalizado),
   standalone.
8. Confirmado fuera de alcance del 23 de agosto, no requieren acción antes del lanzamiento:
   modo en vivo del Delta Ribbon, Mi Box Fase 2, motor de "rivalidades" de Drivers, módulo
   "récords en riesgo esta temporada" de Records (§9), reconstrucción completa de Constructors
   detail (§7/§10), subtipos de desnivel de Circuits (§8), reemplazo de Leaflet en
   `CircuitMap.tsx` (§8).
