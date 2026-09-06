#!/usr/bin/env python3
"""Third glossary batch (category: rules-format) -- parc-ferme, track-limits,
grid-penalty, safety-car-vsc, red-flag, sprint-format. Same layered format
validated by the undercut pilot. EN+ES only. Seeds as 'draft'."""

import os
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "parc-ferme",
        "category": "rules-format",
        "related_terms": ["sprint-format"],
        "sources": [
            {"name": "FIA — Parc Life: how parc fermé regulations make sure the car that qualifies is the one that races", "url": "https://api.fia.com/news/fia-insights-parc-life-how-fias-parc-ferme-regulations-make-sure-car-qualifies-one-races"},
            {"name": "Motorsport.com — Insider's guide: what is parc fermé and what does it mean?", "url": "https://www.motorsport.com/f1/news/what-is-f1-parc-ferme-police/6863921/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Parc Fermé",
                    "short_definition": "Parc fermé (\"closed park\") is the rule that locks a car's setup once qualifying starts — no more suspension, ride-height, or aero changes — to guarantee the car that races on Sunday is the same one that earned its grid slot.",
                    "body_markdown": """Think of it like a sealed exam: once you turn in your answers, you don't get to go back and change them. From the moment a car first leaves the pit lane in qualifying, its setup is "sealed" — the team can still service it (tyres, brakes, fluids, minor cleanup) but can't secretly tune it to be a different, better car for the race than the one that actually qualified.

Without this rule, a team could qualify with a light, low-downforge setup built purely for one fast lap, then rebuild the car overnight into a completely different race machine — which would make qualifying meaningless as a predictor of anything. Parc fermé exists so the grid position a driver earns actually reflects the car they're racing.""",
                },
                "es": {
                    "term": "Parc Fermé",
                    "short_definition": "El parc fermé (\"parque cerrado\") es la regla que congela la puesta a punto de un auto apenas arranca la clasificación — nada de cambios de suspensión, altura o aerodinámica — para garantizar que el auto que corre el domingo sea el mismo que se ganó su lugar en la grilla.",
                    "body_markdown": """Es como un examen sellado: una vez que entregás tus respuestas, no podés volver a cambiarlas. Desde el momento en que un auto sale del pit lane por primera vez en clasificación, su puesta a punto queda "sellada" — el equipo todavía puede darle servicio (gomas, frenos, líquidos, limpieza menor) pero no puede afinarlo en secreto para que sea un auto distinto y mejor en la carrera del que realmente clasificó.

Sin esta regla, un equipo podría clasificar con una puesta a punto liviana y de poca carga aerodinámica hecha solo para una vuelta rápida, y después reconstruir el auto durante la noche en una máquina de carrera completamente distinta — lo que volvería sin sentido a la clasificación como predictor de nada. El parc fermé existe para que la posición de largada que se gana un piloto refleje de verdad el auto con el que corre.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Parc Fermé",
                    "short_definition": "Parc fermé locks suspension, ride height, and aerodynamic bodywork (beyond the front wing flap angle) from the start of qualifying through the race, permitting only tyre changes, brake bleeding, fluid top-ups, and other minor service — a violation forces a pit-lane start.",
                    "body_markdown": """**What's locked:** suspension geometry, ride height, aerodynamic bodywork setup — teams cannot rebuild the car's fundamental performance characteristics between qualifying and the race.

**What's still allowed:** tyre changes, brake bleeding, fluid top-ups, front wing flap angle adjustment, and general minor service work needed to keep the car race-ready.

**Timing:** parc fermé begins the moment a car leaves the pit lane for the first time in Q1. Cars must be placed in parc fermé conditions within a defined window after qualifying and remain there until close to the race start.

**The exception that requires special permission:** a team can request to work outside parc fermé conditions (e.g. after unexpected damage), but doing so typically forces the driver to start the race from the pit lane rather than their qualified grid slot — the rule trades setup freedom for grid position.

**2026 change:** with the Sprint format now running its own separate qualifying session, a single long parc fermé window has been split into two independent ones — one covering [Sprint Qualifying](/glossary/sprint-format) through the Sprint itself, a second starting fresh ahead of Grand Prix Qualifying. This means teams can legally adjust setup between the Sprint and the main qualifying session, something the older single-window rule didn't allow.""",
                },
                "es": {
                    "term": "Parc Fermé",
                    "short_definition": "El parc fermé bloquea la suspensión, la altura al piso y la carrocería aerodinámica (más allá del ángulo del flap del alerón delantero) desde el inicio de la clasificación hasta la carrera, permitiendo solo cambios de goma, purgado de frenos, recarga de líquidos y otro servicio menor — una violación fuerza una largada desde el pit lane.",
                    "body_markdown": """**Qué queda bloqueado:** geometría de suspensión, altura al piso, puesta a punto de la carrocería aerodinámica — los equipos no pueden reconstruir las características fundamentales de rendimiento del auto entre la clasificación y la carrera.

**Qué sigue permitido:** cambios de goma, purgado de frenos, recarga de líquidos, ajuste del ángulo del flap del alerón delantero, y trabajo de servicio menor general necesario para mantener el auto listo para correr.

**Momento:** el parc fermé empieza en el instante en que un auto sale del pit lane por primera vez en Q1. Los autos deben quedar en condición de parc fermé dentro de una ventana definida después de la clasificación y permanecer así hasta cerca del inicio de la carrera.

**La excepción que requiere permiso especial:** un equipo puede pedir trabajar fuera de las condiciones de parc fermé (por ejemplo, después de un daño inesperado), pero hacerlo típicamente obliga al piloto a largar la carrera desde el pit lane en vez de desde su lugar clasificado en la grilla — la regla cambia libertad de puesta a punto por posición de largada.

**Cambio de 2026:** como el formato Sprint ahora corre su propia sesión de clasificación separada, una única ventana larga de parc fermé se dividió en dos independientes — una que cubre la [clasificación del Sprint](/glossary/sprint-format) hasta el propio Sprint, y una segunda que arranca de cero antes de la clasificación del Gran Premio. Esto significa que los equipos pueden ajustar legalmente la puesta a punto entre el Sprint y la clasificación principal, algo que la regla vieja de una sola ventana no permitía.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Parc Fermé",
                    "short_definition": "Parc fermé is defined in the FIA Sporting Regulations, requiring cars to be placed under parc fermé conditions from their first pit-lane exit in Q1 through a defined post-session window, with the 2026 regulations formally splitting the window into a Sprint-qualifying period and a separate Grand-Prix-qualifying period.",
                    "body_markdown": """The rule is a sporting regulation, not a technical one — it governs *when* teams may work on the car, not what the car may be built like. Its purpose, stated directly by the FIA, is to ensure "the car that qualifies is the one that races": once a car has set a representative qualifying time, the regulations remove the opportunity to substantially rebuild it before the race.

**Enforcement:** parc fermé is monitored by FIA technical delegates at the circuit, who inspect cars and log any parts replaced or work carried out. Any change outside the permitted list (tyres, brakes, fluids, front wing flap angle, minor service) requires the team to formally request permission — granted only for legitimate need (such as crash damage) — and typically comes with the penalty of starting from the pit lane instead of the earned grid position.

**2026 structural change:** the Sporting Regulations for 2026 formally define two separate parc fermé periods on a Sprint weekend instead of one continuous one — a first period from Sprint Qualifying through the end of the Sprint, and a second, independent period beginning ahead of Grand Prix Qualifying and running through the race. This is a regulatory acknowledgment that Sprint and Grand Prix setups can legitimately differ, where the previous single-window rule effectively forced one compromise setup across both sessions.""",
                },
                "es": {
                    "term": "Parc Fermé",
                    "short_definition": "El parc fermé está definido en el Reglamento Deportivo de la FIA, y exige que los autos queden en condición de parc fermé desde su primera salida del pit lane en Q1 hasta una ventana definida posterior a la sesión, con el reglamento 2026 dividiendo formalmente esa ventana en un período de clasificación del Sprint y otro separado para la clasificación del Gran Premio.",
                    "body_markdown": """La regla es de reglamento deportivo, no técnico — regula *cuándo* los equipos pueden trabajar en el auto, no cómo puede estar construido el auto. Su propósito, declarado directamente por la FIA, es asegurar que "el auto que clasifica es el que corre": una vez que un auto marcó un tiempo de clasificación representativo, el reglamento elimina la posibilidad de reconstruirlo sustancialmente antes de la carrera.

**Fiscalización:** el parc fermé es controlado por los delegados técnicos de la FIA en el circuito, que inspeccionan los autos y registran cualquier pieza reemplazada o trabajo realizado. Cualquier cambio fuera de la lista permitida (gomas, frenos, líquidos, ángulo del flap del alerón delantero, servicio menor) requiere que el equipo pida permiso formalmente — concedido solo por necesidad legítima (como daño por choque) — y típicamente viene con la penalización de largar desde el pit lane en vez de la posición de grilla ganada.

**Cambio estructural 2026:** el Reglamento Deportivo de 2026 define formalmente dos períodos de parc fermé separados en un fin de semana con Sprint, en vez de uno continuo — un primer período desde la clasificación del Sprint hasta el final del Sprint, y un segundo período independiente que arranca antes de la clasificación del Gran Premio y corre hasta la carrera. Es un reconocimiento regulatorio de que las puestas a punto de Sprint y Gran Premio pueden diferir legítimamente, donde la regla vieja de una sola ventana efectivamente forzaba una puesta a punto de compromiso para ambas sesiones.""",
                },
            },
        },
    },
    {
        "slug": "track-limits",
        "category": "rules-format",
        "related_terms": [],
        "sources": [
            {"name": "Motor Sport Magazine — What are F1 track limits? Rules, penalties and what is changing", "url": "https://www.motorsportmagazine.com/articles/single-seaters/f1/what-are-f1-track-limits-rules-penalties-and-what-is-changing/"},
            {"name": "Motorsport.com — What are track limits in F1 and how do they work?", "url": "https://www.motorsport.com/f1/news/what-are-track-limits-f1-how-do-they-work/10554255/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Track Limits",
                    "short_definition": "Track limits are the white lines marking the edge of the circuit — a driver must keep at least part of the car within them, and running consistently wide to carry more speed through a corner gets that lap time deleted or the driver penalized.",
                    "body_markdown": """It's the same idea as an out-of-bounds line in tennis or basketball: touching the line is fine, but once you're clearly outside it, the point — or in F1's case, the lap time — doesn't count.

The reason it matters so much in F1 is that going wide off a corner, onto smoother asphalt runoff instead of the bumpy kerb, is almost always *faster*. Without a firmly policed limit, drivers would routinely cut corners to save time, turning the track's actual layout into more of a suggestion than a boundary. So the rule isn't really about safety — the runoff areas are paved and safe to drive on — it's about making sure everyone is racing the same track.""",
                },
                "es": {
                    "term": "Límites de Pista (Track Limits)",
                    "short_definition": "Los límites de pista son las líneas blancas que marcan el borde del circuito — un piloto debe mantener al menos parte del auto dentro de ellas, y salirse sistemáticamente para llevar más velocidad en una curva hace que esa vuelta se borre o que el piloto reciba una penalización.",
                    "body_markdown": """Es la misma idea que la línea de fuera de cancha en tenis o básquet: tocar la línea está bien, pero una vez que estás claramente afuera, el punto — o en el caso de F1, el tiempo de vuelta — no cuenta.

La razón por la que importa tanto en F1 es que salirse de una curva, hacia el asfalto liso de la zona de escape en vez del pianito con baches, casi siempre es *más rápido*. Sin un límite fiscalizado con firmeza, los pilotos cortarían curvas de manera habitual para ganar tiempo, y el trazado real del circuito se volvería más una sugerencia que un límite. Por eso la regla no es tanto de seguridad — las zonas de escape están pavimentadas y son seguras para manejar — sino para asegurar que todos corran el mismo circuito.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Track Limits",
                    "short_definition": "A driver must keep at least part of the car within the white lines defining the track edge; enforcement combines GPS/telemetry, fixed cameras, and (at some circuits) sensor-equipped kerbs, with qualifying violations deleting the lap and race violations building toward escalating time penalties.",
                    "body_markdown": """**Detection:** modern F1 cross-references multiple systems — each car's GPS and telemetry data, fixed trackside cameras at known problem corners, and at some circuits, pressure or laser sensors built into kerbs — to flag when a car has run outside the white line with no part of the car touching it.

**In qualifying and practice:** a violation simply deletes that lap's time. The driver keeps their fastest *legal* lap instead — a strong incentive against pushing the boundary on a hot lap, since the whole lap is voided, not just the corner in question.

**In the race:** the standard escalation many events use is a warning system — a driver gets a small number of "free" violations before receiving a black-and-white flag warning that the next one draws a time penalty, with penalties (commonly five seconds, then ten for repeat offenses) escalating from there. The exact thresholds are set out by the Race Director for each individual event rather than being a single fixed rule applied identically everywhere, since track geometry and runoff design vary enormously by circuit.

**Judgment calls:** stewards can also issue penalties outside the standard warning ladder if they judge a driver gained a clear advantage from a single track-limits breach — for example, running wide to complete an overtake rather than being forced wide by another car.""",
                },
                "es": {
                    "term": "Límites de Pista (Track Limits)",
                    "short_definition": "Un piloto debe mantener al menos parte del auto dentro de las líneas blancas que marcan el borde de la pista; la fiscalización combina GPS/telemetría, cámaras fijas y, en algunos circuitos, sensores en los pianos, con violaciones en clasificación que borran la vuelta y violaciones en carrera que escalan hacia penalizaciones de tiempo.",
                    "body_markdown": """**Detección:** la F1 moderna cruza varios sistemas — datos de GPS y telemetría de cada auto, cámaras fijas de pista en curvas conflictivas conocidas, y en algunos circuitos, sensores de presión o láser integrados en los pianos — para marcar cuándo un auto corrió fuera de la línea blanca sin que ninguna parte del auto la tocara.

**En clasificación y prácticas:** una violación simplemente borra el tiempo de esa vuelta. El piloto se queda con su vuelta rápida *legal* en su lugar — un incentivo fuerte contra forzar el límite en una vuelta rápida, ya que se anula toda la vuelta, no solo la curva en cuestión.

**En carrera:** la escalada estándar que usan muchos eventos es un sistema de advertencia — el piloto tiene una pequeña cantidad de violaciones "gratis" antes de recibir una bandera blanquinegra de advertencia de que la próxima genera una penalización de tiempo, con penalizaciones (comúnmente cinco segundos, después diez por reincidencia) que escalan desde ahí. Los umbrales exactos los define el Director de Carrera para cada evento en particular, en vez de ser una regla única fija aplicada igual en todos lados, porque la geometría de la pista y el diseño de las zonas de escape varían enormemente según el circuito.

**Decisiones de criterio:** los comisarios también pueden emitir penalizaciones fuera de la escalera estándar de advertencias si consideran que un piloto ganó una ventaja clara con una sola infracción de límites de pista — por ejemplo, salirse para completar un sobrepaso en vez de ser forzado a salirse por otro auto.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Track Limits",
                    "short_definition": "Track limits enforcement flows from the general principle in the FIA Sporting Regulations that drivers must use the track at all times, with the precise definition of the track edge and the specific penalty escalation for each Grand Prix set out in the Race Director's event notes, not a single universal rule.",
                    "body_markdown": """The FIA's core regulation is deliberately general: it establishes that drivers must make every reasonable effort to use the track, and defines the track itself as the area between the white lines — but it leaves circuit-by-circuit implementation to the Race Director rather than hard-coding exact corner-by-corner boundaries and penalty counts into the season-long Sporting Regulations.

**Why it's delegated per-event:** every circuit's runoff areas, kerb profiles, and problem corners are different, so the FIA issues event-specific driver notes ahead of each Grand Prix defining exactly which corners are being monitored for track limits, how violations will be counted, and what the escalation to a time penalty looks like at that specific venue. This is why the "three warnings then a penalty" pattern fans often cite isn't a fixed rule in the regulations themselves — it's a common but not universal approach the Race Director can adjust per race.

**Stewarding discretion:** beyond the standard escalation, stewards retain the authority under the regulations to penalize any single violation they judge gained a clear sporting advantage, independent of how many prior violations that driver has accumulated in the session.""",
                },
                "es": {
                    "term": "Límites de Pista (Track Limits)",
                    "short_definition": "La fiscalización de límites de pista surge del principio general del Reglamento Deportivo de la FIA de que los pilotos deben usar la pista en todo momento, con la definición precisa del borde de pista y la escalada de penalización específica para cada Gran Premio establecida en las notas del Director de Carrera, no en una regla única universal.",
                    "body_markdown": """La regulación central de la FIA es deliberadamente general: establece que los pilotos deben hacer todo esfuerzo razonable por usar la pista, y define la pista misma como el área entre las líneas blancas — pero deja la implementación circuito por circuito al Director de Carrera, en vez de fijar en el Reglamento Deportivo de toda la temporada límites exactos curva por curva y cantidades de penalización.

**Por qué se delega por evento:** las zonas de escape, el perfil de los pianos y las curvas problemáticas de cada circuito son distintas, así que la FIA emite notas específicas para los pilotos antes de cada Gran Premio definiendo exactamente qué curvas se monitorean por límites de pista, cómo se van a contar las violaciones, y cómo es la escalada hacia una penalización de tiempo en esa sede en particular. Por eso el patrón de "tres advertencias y después penalización" que muchos hinchas citan no es una regla fija en el reglamento en sí — es un enfoque común pero no universal que el Director de Carrera puede ajustar por carrera.

**Criterio de los comisarios:** más allá de la escalada estándar, los comisarios conservan la autoridad bajo el reglamento de penalizar cualquier violación individual que consideren que generó una ventaja deportiva clara, independientemente de cuántas violaciones previas acumuló ese piloto en la sesión.""",
                },
            },
        },
    },
    {
        "slug": "grid-penalty",
        "category": "rules-format",
        "related_terms": [],
        "sources": [
            {"name": "Formula1.com — The beginner's guide to F1 power unit penalties", "url": "https://www.formula1.com/en/latest/article/the-beginners-guide-to-formula-1-engine-and-gearbox-penalties.2TSy7BFgEvdNLojGLWS3F1"},
            {"name": "Sport Rules — F1 Grid Penalties and Power Unit Component Rules Explained", "url": "https://www.sportrules.org/formula-1/grid-penalties-and-power-unit-component-rules/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Grid Penalty",
                    "short_definition": "A grid penalty moves a driver back a set number of starting positions from where they qualified — most often because their team used more engine parts than the season allows, not because of anything they did wrong on track.",
                    "body_markdown": """Think of it like a season-long budget of spare parts each team gets for the engine — a set number of fresh internal combustion engines, turbos, batteries, and so on, to last the whole year. Go over that budget, and the "cost" isn't paid in money — it's paid in starting positions at the next race.

So a driver can put in a brilliant qualifying lap, end up on pole, and still start from 10th or worse because their team decided this was the right weekend to fit a new part they'd already used up their allowance for. It's one of the more confusing rules for new fans precisely because it has nothing to do with how the driver actually performed that weekend — it's an accounting penalty from a completely separate part of the regulations.""",
                },
                "es": {
                    "term": "Penalización de Grilla (Grid Penalty)",
                    "short_definition": "Una penalización de grilla mueve a un piloto hacia atrás una cantidad fija de posiciones de largada respecto a donde clasificó — casi siempre porque su equipo usó más piezas de motor de las que permite la temporada, no por algo que hizo mal en pista.",
                    "body_markdown": """Pensalo como un presupuesto de repuestos para toda la temporada que recibe cada equipo para el motor — una cantidad fija de motores de combustión interna nuevos, turbos, baterías, etc., para que alcancen todo el año. Pasarse de ese presupuesto no se "paga" en dinero — se paga en posiciones de largada en la próxima carrera.

Así que un piloto puede hacer una vuelta de clasificación brillante, quedar en la pole, y aun así largar desde el décimo puesto o peor porque su equipo decidió que este era el fin de semana correcto para poner una pieza nueva de la que ya se habían quedado sin cupo. Es una de las reglas más confusas para los fans nuevos justamente porque no tiene nada que ver con cómo rindió el piloto ese fin de semana — es una penalización contable de una parte completamente separada del reglamento.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Grid Penalty",
                    "short_definition": "Each driver has a season allowance for individual power-unit elements (ICE, turbocharger, MGU-K, energy store, control electronics, exhaust); using an element beyond that allowance triggers a grid-position drop — 10 places for the first extra unit, 5 for each subsequent one of that element, stacking if multiple elements are exceeded the same weekend.",
                    "body_markdown": """A modern F1 power unit is broken into separately-tracked elements — internal combustion engine (ICE), turbocharger (TC), MGU-K, energy store (ES), control electronics (CE), and exhaust (EX) among them — and each has its own season limit rather than one combined "engine" allowance.

**Allowance and penalty structure:** once a driver's team fits a component beyond that season's limit, the driver takes a grid penalty at the race where it's first used — 10 places for the first excess unit of that component, 5 places for any further excess unit of the *same* component later in the season.

**Stacking:** if a team changes multiple over-limit components in the same weekend, the penalties add together. Fitting a first extra MGU-K (10 places) and a second extra turbocharger (5 places) in the same weekend means a combined 15-place drop.

**The back-of-grid rule:** once combined penalties for a driver exceed 15 places in a single weekend, the driver simply starts from the back of the grid instead of literally counting down 20+ places from their qualifying position — the exact running order among multiple penalized drivers at the back is then settled by other criteria (e.g. which penalty was accrued first).

**Why teams do it anyway:** an underperforming or failing component often costs more race pace over several events than a one-time grid penalty costs in a single race — so despite the penalty, replacing a worn component is frequently still the faster strategic choice over a season.""",
                },
                "es": {
                    "term": "Penalización de Grilla (Grid Penalty)",
                    "short_definition": "Cada piloto tiene una cuota por temporada para cada elemento del motor (ICE, turbo, MGU-K, batería, electrónica de control, escape); usar un elemento por encima de esa cuota genera una caída de posiciones en la grilla — 10 puestos por la primera unidad de más, 5 por cada unidad adicional de ese mismo elemento, y se acumulan si se superan varios elementos el mismo fin de semana.",
                    "body_markdown": """Un motor moderno de F1 se divide en elementos rastreados por separado — motor de combustión interna (ICE), turbocompresor (TC), MGU-K, batería o unidad de almacenamiento de energía (ES), electrónica de control (CE) y escape (EX), entre otros — y cada uno tiene su propio límite por temporada en vez de una cuota combinada de "motor".

**Estructura de cuota y penalización:** una vez que el equipo de un piloto pone un componente por encima del límite de esa temporada, el piloto recibe una penalización de grilla en la carrera donde se usa por primera vez — 10 puestos por la primera unidad de exceso de ese componente, 5 puestos por cualquier unidad de exceso adicional del *mismo* componente más adelante en la temporada.

**Acumulación:** si un equipo cambia varios componentes que ya superaron el límite en el mismo fin de semana, las penalizaciones se suman. Poner una primera MGU-K extra (10 puestos) y un segundo turbo extra (5 puestos) el mismo fin de semana significa una caída combinada de 15 puestos.

**La regla del fondo de la grilla:** una vez que las penalizaciones combinadas de un piloto superan los 15 puestos en un mismo fin de semana, el piloto directamente larga desde el fondo de la grilla en vez de contar literalmente 20+ puestos desde su posición de clasificación — el orden exacto entre varios pilotos penalizados en el fondo se resuelve después con otros criterios (por ejemplo, qué penalización se acumuló primero).

**Por qué los equipos lo hacen igual:** un componente que rinde mal o está por fallar suele costar más ritmo de carrera a lo largo de varias fechas que lo que cuesta una penalización de grilla puntual en una sola carrera — así que, pese a la penalización, cambiar un componente desgastado suele seguir siendo la decisión estratégica más rápida a lo largo de una temporada.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Grid Penalty",
                    "short_definition": "Power-unit grid penalties are set out in the FIA Technical and Sporting Regulations, which fix the season allowance per power-unit element (base allowance of 3 for ICE/turbocharger/exhaust and 2 for MGU-K/energy-store/control-electronics under the 2026 regulations, each with one additional permitted unit) and the resulting penalty scale for exceeding it.",
                    "body_markdown": """The FIA regulates this at the component level specifically to stop teams from treating the "engine" as one item — by tracking ICE, turbocharger, MGU-K, energy store, control electronics, and exhaust separately, a team can't simply swap the whole power unit fresh every weekend without consequence, but can still replace a single failing part without necessarily exhausting its entire allowance at once.

**Monitoring:** power-unit elements are sealed by the FIA, and a component is officially considered "used" the moment a car's timing transponder confirms it has left the pit lane in an official session — this closes the door on a team claiming a part was fitted but not actually used competitively.

**2026 allowance figures:** under the current regulations, the base season allowance is three units each of the ICE, turbocharger, and exhaust, with one additional unit permitted across the championship; and two units each of the MGU-K, energy store, and control electronics, also with one additional unit permitted. Exceeding any of these triggers the standard 10-place (first excess) / 5-place (subsequent excess of the same element) grid-penalty scale, stacking when multiple elements are exceeded in the same weekend, with a 15-place combined threshold triggering an automatic back-of-grid start.""",
                },
                "es": {
                    "term": "Penalización de Grilla (Grid Penalty)",
                    "short_definition": "Las penalizaciones de grilla por motor están fijadas en el Reglamento Técnico y Deportivo de la FIA, que establece la cuota por temporada para cada elemento del motor (cuota base de 3 para ICE/turbo/escape y 2 para MGU-K/batería/electrónica de control bajo el reglamento 2026, cada una con una unidad adicional permitida) y la escala de penalización resultante por superarla.",
                    "body_markdown": """La FIA regula esto a nivel de componente específicamente para evitar que los equipos traten al "motor" como una sola pieza — al rastrear ICE, turbo, MGU-K, batería, electrónica de control y escape por separado, un equipo no puede simplemente cambiar toda la unidad de potencia nueva cada fin de semana sin consecuencias, pero sí puede reemplazar una sola pieza que está fallando sin necesariamente agotar toda su cuota de una vez.

**Fiscalización:** los elementos de la unidad de potencia están precintados por la FIA, y un componente se considera oficialmente "usado" en el momento en que el transponder de cronometraje del auto confirma que salió del pit lane en una sesión oficial — esto cierra la puerta a que un equipo alegue que una pieza se puso pero no se usó realmente en competencia.

**Cifras de cuota 2026:** bajo el reglamento actual, la cuota base por temporada es de tres unidades cada una para ICE, turbo y escape, con una unidad adicional permitida a lo largo del campeonato; y dos unidades cada una para MGU-K, batería y electrónica de control, también con una unidad adicional permitida. Superar cualquiera de estos dispara la escala estándar de penalización de grilla de 10 puestos (primer exceso) / 5 puestos (exceso posterior del mismo elemento), que se acumula si se superan varios elementos el mismo fin de semana, con un umbral combinado de 15 puestos que dispara una largada automática desde el fondo de la grilla.""",
                },
            },
        },
    },
    {
        "slug": "safety-car-vsc",
        "category": "rules-format",
        "related_terms": ["red-flag"],
        "sources": [
            {"name": "Motorsport.com — F1 safety car: what is it and how does it work?", "url": "https://www.motorsport.com/f1/news/f1-safety-car-how-does-it-work/10553952/"},
            {"name": "F1 Fansite — VSC in F1: how the Virtual Safety Car works, Bianchi origin explained", "url": "https://www.f1-fansite.com/glossary/vsc-virtual-safety-car/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "The safety car is a real car sent out to physically lead the field at reduced speed, bunching everyone up, when it's dangerous for cars to keep racing at full pace. The Virtual Safety Car does the same job electronically — every car slows to a set pace without an actual car leading them or the field bunching together.",
                    "body_markdown": """A full safety car is like a police escort car flagging down an entire highway and leading every car at a crawl — visible, physical, and everyone ends up nose-to-tail behind it.

The Virtual Safety Car is more like every driver's speedometer suddenly getting a shared speed limit at the same moment, enforced electronically rather than by a car to follow. No physical car appears, and — this is the key practical difference — the field doesn't bunch up. Each driver just has to hit a required lap-time delta everywhere on track, so the gaps between cars stay roughly what they were before it was called, only slower.

Race control reaches for the VSC first for smaller incidents (a car parked safely, light debris) since it's quicker to deploy and remove. A full safety car comes out when marshals need to physically walk onto the track — recovering a car, clearing wreckage — situations serious enough to need everyone genuinely gathered up and controlled at a crawling pace.""",
                },
                "es": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "El safety car es un auto real que sale a liderar físicamente el pelotón a velocidad reducida, juntando a todos, cuando es peligroso seguir corriendo a ritmo completo. El Virtual Safety Car (VSC) hace el mismo trabajo de forma electrónica — todos los autos bajan a un ritmo fijo sin un auto real liderándolos ni el pelotón agrupándose.",
                    "body_markdown": """Un safety car completo es como un auto de escolta policial deteniendo toda una autopista y guiando a cada auto a paso de hombre — visible, físico, y todos terminan en fila uno detrás del otro.

El Virtual Safety Car se parece más a que el velocímetro de cada piloto de repente tenga un límite de velocidad compartido en el mismo instante, impuesto de forma electrónica en vez de con un auto para seguir. No aparece ningún auto físico y — esta es la diferencia práctica clave — el pelotón no se junta. Cada piloto solo tiene que cumplir un delta de tiempo de vuelta requerido en todo el circuito, así que las diferencias entre autos se mantienen más o menos como estaban antes de activarse, solo que más lento.

Dirección de carrera recurre primero al VSC para incidentes menores (un auto estacionado de forma segura, restos livianos) porque es más rápido de activar y quitar. Un safety car completo sale cuando los comisarios necesitan caminar físicamente sobre la pista — recuperar un auto, limpiar restos — situaciones lo suficientemente serias como para necesitar a todos genuinamente agrupados y controlados a paso de hombre.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "Both neutralize racing and ban overtaking, but a full safety car physically leads and bunches the field at a set pace, while the VSC imposes a delta-time speed limit at reference points around the track — cutting pace to roughly 30-40% below racing speed without cars converging.",
                    "body_markdown": """**Full Safety Car:** a real car (typically a high-performance road car) joins the track and leads the race leader, with the entire field required to close up behind it in order, no overtaking permitted (except in specific circumstances, like a car being lapped or told to pass). Marshals can safely work anywhere on track since every competing car is physically accounted for behind the safety car.

**Virtual Safety Car (VSC):** introduced in 2015, the VSC imposes a maximum time — a "delta" — that every car must not beat between fixed reference points on the lap. No physical car deploys, cars keep their relative track position and gaps rather than bunching together, and it's typically faster to deploy and withdraw than a full safety car, making it the preferred tool for shorter, lower-severity stoppages.

**Strategic effect:** both periods make pit stops relatively "cheaper" — because the whole field is slowed, the time cost of diving into the pits is much smaller than it would be at racing speed, which is why teams often use a safety car or VSC period to take a scheduled or opportunistic pit stop. A full safety car compresses the field further (since cars queue up nose-to-tail), which can undo a lead built up over many laps of green-flag racing — a source of frequent complaint from drivers who feel a well-earned gap gets erased by bad timing beyond their control.""",
                },
                "es": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "Los dos neutralizan la carrera y prohíben adelantar, pero el safety car completo lidera físicamente y junta al pelotón a un ritmo fijo, mientras que el VSC impone un límite de velocidad por delta de tiempo en puntos de referencia alrededor del circuito — bajando el ritmo a un 30-40% menos que la velocidad de carrera sin que los autos se junten.",
                    "body_markdown": """**Safety Car completo:** un auto real (típicamente un auto de calle de alto rendimiento) sale a pista y lidera al líder de la carrera, con todo el pelotón obligado a agruparse detrás en orden, sin adelantamientos permitidos (salvo en circunstancias específicas, como un auto siendo doblado o al que se le indica pasar). Los comisarios pueden trabajar con seguridad en cualquier parte de la pista porque cada auto en competencia está físicamente contabilizado detrás del safety car.

**Virtual Safety Car (VSC):** introducido en 2015, el VSC impone un tiempo máximo — un "delta" — que ningún auto puede superar entre puntos de referencia fijos en la vuelta. No sale ningún auto físico, los autos mantienen su posición relativa en pista y sus diferencias en vez de agruparse, y típicamente es más rápido de activar y retirar que un safety car completo, lo que lo convierte en la herramienta preferida para interrupciones más cortas y de menor gravedad.

**Efecto estratégico:** ambos períodos hacen que las paradas en boxes sean relativamente "más baratas" — porque todo el pelotón está más lento, el costo de tiempo de meterse a boxes es mucho menor de lo que sería a velocidad de carrera, por eso los equipos suelen aprovechar un período de safety car o VSC para hacer una parada programada u oportunista. Un safety car completo comprime aún más al pelotón (porque los autos se ponen en fila), lo que puede borrar una ventaja construida durante muchas vueltas de carrera en verde — una fuente de queja frecuente de los pilotos que sienten que una diferencia bien ganada se borra por mal timing fuera de su control.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "Both are defined in the FIA Sporting Regulations as race-neutralization tools deployed by Race Control; the VSC was introduced specifically in 2015 following Jules Bianchi's fatal accident at the 2014 Japanese Grand Prix, where a recovery vehicle was on track during double-waved yellow flags.",
                    "body_markdown": """**Origin of the VSC:** the Virtual Safety Car exists because of a specific, documented failure of the previous system. At the 2014 Japanese Grand Prix, Jules Bianchi crashed into a recovery vehicle that was on track clearing a previous incident, under double-waved yellow flags that require slowing but don't mandate the level of speed reduction a full safety car does. Bianchi died from his injuries months later. The FIA introduced the VSC in 2015 specifically to provide a faster, more forceful neutralization option for situations serious enough to need marshals or recovery vehicles on a live track but not severe enough (or not requiring enough time) to justify deploying a full physical safety car.

**Regulatory mechanism:** the Sporting Regulations empower Race Control to deploy either tool based on the severity of the incident. The VSC enforces compliance via mandatory minimum sector/segment times (the "delta") that every car must respect, monitored electronically — a car that breaches the delta can be investigated and penalized after the session. The full Safety Car is governed by more traditional real-time compliance: closing up behind it, no overtaking, with stewards monitoring via track position and radio communication with the safety car itself.""",
                },
                "es": {
                    "term": "Safety Car vs. Virtual Safety Car (VSC)",
                    "short_definition": "Los dos están definidos en el Reglamento Deportivo de la FIA como herramientas de neutralización de carrera activadas por Dirección de Carrera; el VSC se introdujo específicamente en 2015 tras el accidente fatal de Jules Bianchi en el GP de Japón de 2014, donde un vehículo de recuperación estaba en pista durante banderas amarillas dobles.",
                    "body_markdown": """**Origen del VSC:** el Virtual Safety Car existe por una falla específica y documentada del sistema anterior. En el GP de Japón de 2014, Jules Bianchi chocó contra un vehículo de recuperación que estaba en pista limpiando un incidente previo, bajo banderas amarillas dobles que exigen reducir la velocidad pero no imponen el nivel de reducción que sí exige un safety car completo. Bianchi murió por sus lesiones meses después. La FIA introdujo el VSC en 2015 específicamente para dar una opción de neutralización más rápida y contundente para situaciones lo suficientemente serias como para necesitar comisarios o vehículos de recuperación en una pista activa, pero no tan graves (o que no requieren tanto tiempo) como para justificar un safety car físico completo.

**Mecanismo regulatorio:** el Reglamento Deportivo faculta a Dirección de Carrera para activar cualquiera de las dos herramientas según la gravedad del incidente. El VSC impone el cumplimiento mediante tiempos mínimos obligatorios por sector o segmento (el "delta") que cada auto debe respetar, monitoreados electrónicamente — un auto que incumple el delta puede ser investigado y penalizado después de la sesión. El Safety Car completo se rige por un cumplimiento en tiempo real más tradicional: agruparse detrás de él, sin adelantamientos, con los comisarios monitoreando por posición en pista y comunicación de radio con el propio safety car.""",
                },
            },
        },
    },
    {
        "slug": "red-flag",
        "category": "rules-format",
        "related_terms": ["safety-car-vsc"],
        "sources": [
            {"name": "PlanetF1 — Explained: What does a red flag mean and how does a race restart?", "url": "https://www.planetf1.com/features/f1-red-flag-stoppage-rules-explained"},
            {"name": "F1 Fansite — Red flag in F1: rules, restart procedure and the 75 per cent points rule", "url": "https://www.f1-fansite.com/glossary/red-flag/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Red Flag",
                    "short_definition": "A red flag stops a session completely — every car returns to the pits and racing pauses — used when conditions are too dangerous to continue even under a safety car, such as a serious crash or unsafe weather.",
                    "body_markdown": """It's F1's version of a fire alarm: everything stops immediately, and everyone follows the same evacuation procedure, no matter what was happening a second earlier. Cars slow down and file back to the pit lane instead of continuing to circulate.

What makes red flags strategically interesting is what teams are suddenly allowed to do during the stoppage: normally you can't rebuild a damaged front wing or swap tyres for free mid-race, but during a red flag, mechanics can perform repairs and tyre changes in the garage that a driver would otherwise have to do — and pay for in time — at a normal pit stop. A driver who was struggling on old tyres right before a red flag can come back out on a fresh set at no strategic cost at all, which is why a red flag can completely scramble a race that looked settled moments before.""",
                },
                "es": {
                    "term": "Bandera Roja (Red Flag)",
                    "short_definition": "Una bandera roja detiene una sesión por completo — todos los autos vuelven a boxes y la carrera se pausa — se usa cuando las condiciones son demasiado peligrosas para seguir incluso bajo safety car, como un choque serio o clima inseguro.",
                    "body_markdown": """Es la versión F1 de una alarma de incendio: todo se detiene de inmediato, y todos siguen el mismo procedimiento de evacuación, sin importar qué estaba pasando un segundo antes. Los autos bajan la velocidad y desfilan de vuelta al pit lane en vez de seguir dando vueltas.

Lo que hace estratégicamente interesantes a las banderas rojas es lo que de repente se les permite hacer a los equipos durante la interrupción: normalmente no podés reconstruir un alerón delantero dañado o cambiar gomas gratis a mitad de carrera, pero durante una bandera roja, los mecánicos pueden hacer reparaciones y cambios de goma en el garage que un piloto de otra forma tendría que hacer — y pagar en tiempo — en una parada normal. Un piloto que venía sufriendo con gomas viejas justo antes de una bandera roja puede volver a salir con un juego fresco sin ningún costo estratégico, por eso una bandera roja puede revolver completamente una carrera que parecía definida momentos antes.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Red Flag",
                    "short_definition": "A red flag halts a session entirely; cars return to the pit lane and the session can restart via a rolling start (safety-car procedure) or a standing start (full grid formation), with the effect on session timing and permitted repairs varying by whether it's a practice, qualifying, or race session.",
                    "body_markdown": """**How time is handled depends on the session type:**
- **Race:** the clock continues counting toward the maximum permitted session time even while stopped — laps don't tick down during the stoppage, but the overall time limit still applies, and in extreme cases a race can be called off entirely if the maximum time expires.
- **Qualifying:** the session clock pauses at the moment of the red flag and resumes with the same time remaining once the session restarts.
- **Practice:** the clock keeps running through the stoppage — time lost to a red flag in practice is simply lost.

**Restart procedure:** Race Control chooses between a rolling start (cars form up and get underway similarly to a safety-car restart) or a standing start (a full grid formation, as at the original race start), depending on the circumstances and how much of the original start procedure needs repeating.

**The strategic window:** because cars are stationary in the garage during a red flag, teams can carry out repairs and tyre changes that would otherwise cost significant time at a normal pit stop — a driver can effectively get a "free" tyre change or minor repair, which is why a red flag can flip the competitive order of a race in a way a caution period (VSC/[safety car](/glossary/safety-car-vsc)) typically doesn't.""",
                },
                "es": {
                    "term": "Bandera Roja (Red Flag)",
                    "short_definition": "Una bandera roja detiene una sesión por completo; los autos vuelven al pit lane y la sesión puede reiniciar con una salida rodante (procedimiento de safety car) o una salida detenida (formación completa de grilla), con el efecto sobre el cronómetro de la sesión y las reparaciones permitidas variando según sea una práctica, clasificación o carrera.",
                    "body_markdown": """**Cómo se maneja el tiempo depende del tipo de sesión:**
- **Carrera:** el reloj sigue contando hacia el tiempo máximo permitido de la sesión aunque esté detenida — las vueltas no descuentan durante la interrupción, pero el límite de tiempo general sigue aplicando, y en casos extremos una carrera puede suspenderse por completo si se agota el tiempo máximo.
- **Clasificación:** el cronómetro de la sesión se pausa en el momento de la bandera roja y retoma con el mismo tiempo restante una vez que la sesión reinicia.
- **Práctica:** el reloj sigue corriendo durante la interrupción — el tiempo perdido por una bandera roja en la práctica simplemente se pierde.

**Procedimiento de reinicio:** Dirección de Carrera elige entre una salida rodante (los autos se forman y arrancan de forma similar a un reinicio de safety car) o una salida detenida (formación completa de grilla, como en la largada original), según las circunstancias y cuánto del procedimiento de largada original haga falta repetir.

**La ventana estratégica:** como los autos están detenidos en el garage durante una bandera roja, los equipos pueden hacer reparaciones y cambios de goma que de otra forma costarían tiempo significativo en una parada normal — un piloto puede, en la práctica, conseguir un cambio de goma o una reparación menor "gratis", por eso una bandera roja puede dar vuelta el orden competitivo de una carrera de una forma en la que un período de precaución (VSC/[safety car](/glossary/safety-car-vsc)) típicamente no lo hace.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Red Flag",
                    "short_definition": "Red-flag procedures and their points implications are set out in the FIA Sporting Regulations: if a race is stopped before the leader completes two laps, no points are awarded; between two laps and 75% of scheduled distance, points are awarded on a reduced sliding scale; above 75%, full points apply.",
                    "body_markdown": """The points rule exists to keep the championship's scoring proportional to how much racing actually happened. A red flag that ends a race almost immediately shouldn't hand out a full winner's points haul for what was barely a race — but a red flag near the scheduled finish shouldn't cost a driver who'd essentially completed the job either.

**The scale:**
- **Under two completed laps by the leader:** no championship points awarded at all.
- **Two laps up to 75% of the scheduled race distance:** points awarded, but reduced on a sliding scale rather than the full points table — the earlier the stoppage within that range, the smaller the reduced haul.
- **75% of scheduled distance or more:** full points, as if the race had run its complete original distance.

**Why this specific structure exists:** it replaced an earlier, simpler system that fans and teams criticized as too punishing for races stopped just short of completion — the sliding scale between two laps and 75% was designed to make the points outcome track more smoothly with how much of the race was actually contested, rather than jumping abruptly between "half points" and "no points" at a single cutoff.""",
                },
                "es": {
                    "term": "Bandera Roja (Red Flag)",
                    "short_definition": "Los procedimientos de bandera roja y sus implicancias en puntos están fijados en el Reglamento Deportivo de la FIA: si una carrera se detiene antes de que el líder complete dos vueltas, no se otorgan puntos; entre dos vueltas y el 75% de la distancia programada, se otorgan puntos en una escala reducida; por encima del 75%, aplican los puntos completos.",
                    "body_markdown": """La regla de puntos existe para que el puntaje del campeonato sea proporcional a cuánta carrera realmente sucedió. Una bandera roja que termina una carrera casi de inmediato no debería repartir el puntaje completo de ganador por lo que apenas fue una carrera — pero una bandera roja cerca del final programado tampoco debería costarle puntos a un piloto que básicamente ya había completado el trabajo.

**La escala:**
- **Menos de dos vueltas completadas por el líder:** no se otorga ningún punto de campeonato.
- **Entre dos vueltas y el 75% de la distancia programada de carrera:** se otorgan puntos, pero reducidos en una escala móvil en vez de la tabla de puntos completa — cuanto más temprana la interrupción dentro de ese rango, menor la cosecha reducida.
- **75% de la distancia programada o más:** puntos completos, como si la carrera hubiera corrido su distancia original completa.

**Por qué existe esta estructura específica:** reemplazó a un sistema anterior más simple que hinchas y equipos criticaban por ser demasiado severo para carreras detenidas justo antes de completarse — la escala móvil entre dos vueltas y el 75% se diseñó para que el resultado en puntos siga de forma más gradual cuánto de la carrera realmente se disputó, en vez de saltar abruptamente entre "medios puntos" y "sin puntos" en un solo corte.""",
                },
            },
        },
    },
    {
        "slug": "sprint-format",
        "category": "rules-format",
        "related_terms": ["parc-ferme"],
        "sources": [
            {"name": "Motor Sport Magazine — How 2026 F1 sprint races work: qualifying, points and schedule", "url": "https://www.motorsportmagazine.com/articles/single-seaters/f1/how-2026-f1-sprint-races-work-qualifying-points-and-schedule/"},
            {"name": "Sky Sports — F1 Sprint: Schedule, points, results format explained", "url": "https://www.skysports.com/f1/news/12433/13518235/f1-sprint-schedule-points-results-format-explained-qualifying-race-and-venues-for-2026-season"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Sprint",
                    "short_definition": "A Sprint is a short standalone race — about a third the distance of a normal Grand Prix, roughly 30 minutes — held on select weekends with its own separate qualifying session and its own, smaller points payout, on top of the regular Sunday race.",
                    "body_markdown": """Think of it as a mini-race bolted onto a normal race weekend: instead of two more practice sessions before Sunday, a handful of events each year get a genuine second race on Saturday, with its own grid decided by its own short qualifying session — completely separate from the qualifying that sets Sunday's grid.

There are no mandatory pit stops in a Sprint, so it's a straight sprint to the finish rather than a strategy battle, and only the top eight finishers score points — a smaller points table than the full Grand Prix, but points that count toward the same championship totals all the same.""",
                },
                "es": {
                    "term": "Sprint",
                    "short_definition": "Un Sprint es una carrera corta independiente — cerca de un tercio de la distancia de un Gran Premio normal, unos 30 minutos — que se corre en fines de semana seleccionados con su propia sesión de clasificación separada y su propio reparto de puntos, más chico, además de la carrera normal del domingo.",
                    "body_markdown": """Pensalo como una mini-carrera pegada a un fin de semana normal: en vez de dos prácticas más antes del domingo, un puñado de fechas cada año tienen una segunda carrera de verdad el sábado, con su propia grilla definida por su propia clasificación corta — completamente separada de la clasificación que arma la grilla del domingo.

No hay paradas obligatorias en un Sprint, así que es una carrera directa hasta la bandera en vez de una batalla de estrategia, y solo los primeros ocho puntúan — una tabla de puntos más chica que la del Gran Premio completo, pero puntos que igual cuentan para los mismos totales del campeonato.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Sprint",
                    "short_definition": "A Sprint runs 100km (roughly a third of a Grand Prix), with its own condensed knockout qualifying (SQ1/SQ2/SQ3), mandatory-tyre rules per segment, and a top-8 points scale (8-7-6-5-4-3-2-1) that counts toward the same Drivers' and Constructors' totals as the main race.",
                    "body_markdown": """**Weekend structure:** Sprint Qualifying replaces second practice on Friday afternoon, and the Sprint itself replaces third practice on Saturday morning — drivers get one practice session on Friday, then go straight into competitive sessions for the rest of the weekend.

**Sprint Qualifying format:** a condensed knockout format — 12-minute SQ1, 10-minute SQ2, 8-minute SQ3 — eliminating the six slowest drivers in each of the first two segments, leaving 10 to fight for pole in SQ3. Tyre rules differ from normal qualifying: a new set of medium tyres is mandatory in SQ1 and SQ2, and a set of softs (new or used) is mandatory for SQ3.

**Points:** the top eight Sprint finishers score 8-7-6-5-4-3-2-1 — compressed compared to the 25-down-to-1 Grand Prix scale, but added directly to the same championship totals, not tracked separately.

**No mandatory pit stops:** unlike the main race's mandatory two-compound rule, the Sprint has no forced tyre-strategy requirement — teams generally run it as a single, flat-out stint rather than a strategic contest.""",
                },
                "es": {
                    "term": "Sprint",
                    "short_definition": "Un Sprint corre 100km (cerca de un tercio de un Gran Premio), con su propia clasificación de eliminación condensada (SQ1/SQ2/SQ3), reglas de neumáticos obligatorios por segmento, y una escala de puntos para el top 8 (8-7-6-5-4-3-2-1) que cuenta para los mismos totales de Pilotos y Constructores que la carrera principal.",
                    "body_markdown": """**Estructura del fin de semana:** la clasificación del Sprint reemplaza la segunda práctica del viernes por la tarde, y el Sprint en sí reemplaza la tercera práctica del sábado por la mañana — los pilotos tienen una sola práctica el viernes, y después van directo a sesiones competitivas el resto del fin de semana.

**Formato de la clasificación del Sprint:** un formato de eliminación condensado — SQ1 de 12 minutos, SQ2 de 10 minutos, SQ3 de 8 minutos — eliminando a los seis más lentos en cada uno de los primeros dos segmentos, y dejando a 10 peleando por la pole en SQ3. Las reglas de neumáticos difieren de la clasificación normal: un juego nuevo de gomas medias es obligatorio en SQ1 y SQ2, y un juego de blandas (nuevas o usadas) es obligatorio para SQ3.

**Puntos:** los primeros ocho del Sprint puntúan 8-7-6-5-4-3-2-1 — comprimido respecto a la escala de 25 a 1 del Gran Premio, pero sumado directamente a los mismos totales del campeonato, no se lleva por separado.

**Sin paradas obligatorias:** a diferencia de la regla de dos compuestos obligatorios de la carrera principal, el Sprint no tiene ningún requisito de estrategia de neumáticos forzada — los equipos generalmente lo corren como un único stint a fondo en vez de una contienda estratégica.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Sprint",
                    "short_definition": "The Sprint format is defined in the FIA Sporting Regulations, which for 2026 also formally split the parc fermé window into two independent periods — one for Sprint Qualifying through the Sprint, a second for Grand Prix Qualifying through the race — allowing legal setup changes between the two that weren't previously permitted.",
                    "body_markdown": """The Sprint's regulatory novelty for 2026 isn't the race format itself, which has existed in earlier forms since 2021 — it's the change to [parc fermé](/glossary/parc-ferme) that comes with it. Previously, a single continuous parc fermé period covered a Sprint weekend from the start of Sprint Qualifying all the way through the Grand Prix, which meant teams were locked into one compromise setup that had to work for both a 100km sprint and a full Grand Prix distance, on potentially very different tyre and fuel-load conditions.

**The 2026 fix:** the Sporting Regulations now define two separate parc fermé periods on a Sprint weekend — the first running from Sprint Qualifying through the end of the Sprint, and a second, independent period starting fresh ahead of Grand Prix Qualifying. This lets a team legally adjust the car's setup between the two competitive segments of the weekend, something the single-window rule structurally prevented.

**Points allocation:** the Sprint's own points system (8-7-6-5-4-3-2-1 for the top eight) is defined separately from the Grand Prix's scale but feeds into the same championship tables — there's no separate "Sprint championship," it's simply additional points within the regular Drivers' and Constructors' standings.""",
                },
                "es": {
                    "term": "Sprint",
                    "short_definition": "El formato Sprint está definido en el Reglamento Deportivo de la FIA, que para 2026 también dividió formalmente la ventana de parc fermé en dos períodos independientes — uno para la clasificación del Sprint hasta el Sprint, otro para la clasificación del Gran Premio hasta la carrera — permitiendo cambios legales de puesta a punto entre los dos que antes no estaban permitidos.",
                    "body_markdown": """La novedad regulatoria del Sprint para 2026 no es el formato de carrera en sí, que existe en formas anteriores desde 2021 — es el cambio al [parc fermé](/glossary/parc-ferme) que viene con él. Antes, un único período continuo de parc fermé cubría un fin de semana con Sprint desde el inicio de la clasificación del Sprint hasta el final del Gran Premio, lo que significaba que los equipos quedaban atados a una puesta a punto de compromiso que tenía que funcionar tanto para un sprint de 100km como para la distancia completa de un Gran Premio, con condiciones de goma y carga de combustible potencialmente muy distintas.

**La corrección de 2026:** el Reglamento Deportivo ahora define dos períodos de parc fermé separados en un fin de semana con Sprint — el primero corriendo desde la clasificación del Sprint hasta el final del Sprint, y un segundo período independiente que arranca de cero antes de la clasificación del Gran Premio. Esto le permite a un equipo ajustar legalmente la puesta a punto del auto entre los dos segmentos competitivos del fin de semana, algo que la regla de una sola ventana impedía estructuralmente.

**Reparto de puntos:** el sistema de puntos propio del Sprint (8-7-6-5-4-3-2-1 para los primeros ocho) está definido por separado de la escala del Gran Premio pero alimenta las mismas tablas del campeonato — no existe un "campeonato de Sprint" separado, son simplemente puntos adicionales dentro de la clasificación regular de Pilotos y Constructores.""",
                },
            },
        },
    },
]


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    inserted = 0
    for entry in TERMS:
        group_id = str(uuid.uuid4())
        for depth, by_locale in entry["layers"].items():
            for locale in ("en", "es"):
                content = by_locale[locale]
                row = {
                    "translation_group_id": group_id,
                    "locale": locale,
                    "slug": entry["slug"],
                    "depth": depth,
                    "term": content["term"],
                    "category": entry["category"],
                    "short_definition": content["short_definition"],
                    "body_markdown": content["body_markdown"],
                    "related_terms": entry["related_terms"],
                    "sources": entry["sources"],
                    "status": "draft",
                    "published_at": None,
                }
                sb.table("glossary_terms").upsert(row, on_conflict="locale,slug,depth").execute()
                inserted += 1
    print(f"Seeded {inserted} rows ({len(TERMS)} terms x 3 depths x 2 locales), status=draft")


if __name__ == "__main__":
    main()
