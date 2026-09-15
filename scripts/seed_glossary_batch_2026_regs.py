#!/usr/bin/env python3
"""Fifth glossary batch (category: technical) -- active-aero,
aerodynamic-testing-restrictions, advanced-sustainable-fuel. Same layered
format validated by the undercut pilot. EN+ES only, matching every batch
since seed_glossary_batch_technical.py. Seeds as 'draft'."""

import os
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "active-aero",
        "category": "technical",
        "related_terms": ["overtake-mode", "drs", "ground-effect"],
        "sources": [
            {"name": "Motorsport.com — Explained: How F1's active aero works and what it means for driver workload", "url": "https://www.motorsport.com/f1/news/explained-how-f1s-active-aero-works-and-what-it-means-for-workload-on-drivers/10793678/"},
            {"name": "Formula1.com — EXPLAINED: From more agile cars to 'X-mode' and 'Z-mode' – unpicking the 2026 aerodynamics regulations", "url": "https://www.formula1.com/en/latest/article/explained-2026-aerodynamic-regulations-fia-twitter-mode-z-mode-.26c1CtOzCmN3GfLMywrgb2"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Active Aero",
                    "short_definition": "Active Aero is the general name for F1's 2026 system where the wings physically open up for less drag on the straights and close back up for grip in the corners — every lap, for every driver, on a button the driver presses themselves.",
                    "body_markdown": """Picture a bird tucking its wings in to dive fast, then spreading them back out to glide and turn — that's basically what a 2026 F1 car's wings do, on purpose, every single lap. Coming onto a long enough straight, the driver presses a button and the front and rear wing flaps open flat, cutting drag so the car can hit a higher top speed. Coming back to a corner, the driver closes them again (or the car does it automatically the moment they brake or lift off the throttle, as a safety backstop) so the wings go back to squeezing the car down onto the track for grip.

It's a manual system, not something the computer decides on its own — much like the old [DRS](/glossary/drs) button, just usable on a lot more straights per lap instead of one designated zone. The big difference from DRS: Active Aero doesn't care who's ahead of you. Every driver gets it, every lap, with no need to be chasing anyone. The proximity rule — being within one second of the car in front — only applies to a separate system, [Overtake Mode](/glossary/overtake-mode), which is about power, not wings.""",
                },
                "es": {
                    "term": "Active Aero",
                    "short_definition": "Active Aero es el nombre general del sistema de F1 2026 donde los alerones se abren físicamente para reducir resistencia en las rectas y se cierran de nuevo para dar agarre en las curvas — en cada vuelta, para cada piloto, con un botón que el propio piloto presiona.",
                    "body_markdown": """Imagina un pájaro que repliega las alas para bajar en picada rápido, y después las vuelve a abrir para planear y girar — eso es más o menos lo que hacen a propósito los alerones de un auto de F1 2026, en cada vuelta. Al llegar a una recta lo suficientemente larga, el piloto aprieta un botón y los flaps del alerón delantero y trasero se abren y quedan planos, recortando la resistencia para que el auto llegue a más velocidad máxima. Al volver a una curva, el piloto los vuelve a cerrar (o el propio auto lo hace automáticamente en el momento en que frena o suelta el acelerador, como respaldo de seguridad) para que los alerones vuelvan a apretar el auto contra la pista y den agarre.

Es un sistema manual, no algo que decide la computadora sola — parecido al viejo botón del [DRS](/glossary/drs), solo que usable en muchas más rectas por vuelta en vez de una sola zona designada. La gran diferencia con el DRS: a Active Aero no le importa quién va adelante. Cada piloto lo tiene, en cada vuelta, sin necesidad de estar persiguiendo a nadie. La regla de proximidad — estar a menos de un segundo del auto de adelante — solo aplica a un sistema separado, [Overtake Mode](/glossary/overtake-mode), que es de potencia, no de alerones.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Active Aero",
                    "short_definition": "Active Aero refers to F1's 2026 driver-activated wing system — Straight Mode (low-drag) and Corner Mode (high-downforce) — that opens and closes front and rear wing flaps within FIA-designated track zones, distinct from the separate, proximity-gated Overtake Mode power system.",
                    "body_markdown": """**Two states, one manual control:** Active Aero covers the front and rear wing flaps switching between **Straight Mode** (flaps open flat, minimizing drag for top speed) and **Corner Mode** (flaps closed, maximizing downforce for cornering grip). Activation is manual — the driver triggers Straight Mode with a control on the steering wheel, the same basic mechanic as the old [DRS](/glossary/drs) button — but it's available across far more of the lap than DRS ever was, in every FIA-designated zone long enough to be used safely (roughly straights of three seconds or more), not just one marked zone per circuit.

**Automatic safety backstop:** while activation is driver-triggered, the wings close automatically the instant the driver brakes or lifts off the throttle, so a driver can't be caught in low-drag/low-downforce Straight Mode entering a corner by mistake.

**Not proximity-gated:** unlike old DRS, which only worked within one second of the car ahead (in the race), Straight Mode is available to every driver, every lap, regardless of gap to any other car — it's a universal drag-reduction tool, not a following-car aid.

**Distinct from Overtake Mode:** the actual proximity-gated, following-car advantage in 2026 comes from a separate system, [Overtake Mode](/glossary/overtake-mode) — an extra burst of electrical power (not a wing adjustment) available only within one second of the car ahead at a defined detection point. Active Aero (the wings) and Overtake Mode (the power boost) are commonly confused because both replaced pieces of what DRS used to do alone.""",
                },
                "es": {
                    "term": "Active Aero",
                    "short_definition": "Active Aero es el sistema de alerones activado por el piloto en F1 2026 — Straight Mode (poca resistencia) y Corner Mode (mucha carga aerodinámica) — que abre y cierra los flaps del alerón delantero y trasero dentro de zonas designadas por la FIA, distinto del sistema separado y condicionado por proximidad, Overtake Mode, que es de potencia.",
                    "body_markdown": """**Dos estados, un control manual:** Active Aero cubre el cambio de los flaps del alerón delantero y trasero entre **Straight Mode** (flaps abiertos y planos, minimizando la resistencia para más velocidad máxima) y **Corner Mode** (flaps cerrados, maximizando la carga aerodinámica para agarre en curva). La activación es manual — el piloto activa Straight Mode con un control en el volante, la misma mecánica básica que el viejo botón del [DRS](/glossary/drs) — pero está disponible en mucha más parte de la vuelta de lo que estuvo nunca el DRS, en cada zona designada por la FIA lo suficientemente larga para usarse con seguridad (rectas de aproximadamente tres segundos o más), no solo una zona marcada por circuito.

**Respaldo de seguridad automático:** aunque la activación la dispara el piloto, los alerones se cierran automáticamente en el instante en que el piloto frena o suelta el acelerador, para que no quede atrapado en Straight Mode (poca resistencia, poca carga) entrando a una curva por error.

**No está condicionado por proximidad:** a diferencia del viejo DRS, que solo funcionaba a menos de un segundo del auto de adelante (en carrera), Straight Mode está disponible para cada piloto, en cada vuelta, sin importar la distancia a ningún otro auto — es una herramienta universal de reducción de resistencia, no una ayuda para perseguir a otro auto.

**Distinto de Overtake Mode:** la ventaja real condicionada por proximidad para perseguir a otro auto en 2026 viene de un sistema separado, [Overtake Mode](/glossary/overtake-mode) — un impulso extra de potencia eléctrica (no un ajuste de alerón) disponible solo a menos de un segundo del auto de adelante en un punto de detección definido. Active Aero (los alerones) y Overtake Mode (el impulso de potencia) suelen confundirse porque los dos reemplazaron partes de lo que hacía el DRS solo.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Active Aero",
                    "short_definition": "Active Aero's driver-activated wing states were introduced by the FIA under the working names X-Mode and Z-Mode, renamed to Straight Mode and Corner Mode ahead of the 2026 season as part of a broader fan-facing terminology simplification.",
                    "body_markdown": """When the FIA first published the technical detail behind the 2026 aerodynamic regulations, the two wing states were documented under the internal names **X-Mode** (low-drag, straight-line configuration) and **Z-Mode** (high-downforce, cornering configuration). Ahead of the season, the FIA renamed these to **Straight Mode** and **Corner Mode** respectively, alongside renaming "Manual Override Mode" to [Overtake Mode](/glossary/overtake-mode) — part of a deliberate push to make 2026's new systems easier for fans to follow without changing any of the underlying technical function.

**Where it sits in the regulations:** the wing geometry and the flap-angle ranges permitted in each mode are governed by the Technical Regulations covering bodywork and aerodynamic devices. The zones where Straight Mode may be activated — track sections meeting a minimum straight-line duration, similar in spirit to how DRS zones were designated — are a Sporting Regulations matter, set out for each circuit rather than fixed globally.

**Relationship to the aero testing rules:** Active Aero's wing hardware is designed and validated within each team's [Aerodynamic Testing Restrictions](/glossary/aerodynamic-testing-restrictions) allocation — the same wind tunnel and CFD budget that governs every other aerodynamic component on the car, meaning a team's championship position indirectly shapes how much it can refine its Active Aero system race to race.""",
                },
                "es": {
                    "term": "Active Aero",
                    "short_definition": "Los estados de alerón activados por el piloto de Active Aero fueron presentados por la FIA bajo los nombres de trabajo X-Mode y Z-Mode, renombrados a Straight Mode y Corner Mode antes de la temporada 2026 como parte de una simplificación de terminología pensada para los fans.",
                    "body_markdown": """Cuando la FIA publicó por primera vez el detalle técnico detrás del reglamento aerodinámico de 2026, los dos estados de alerón quedaron documentados bajo los nombres internos **X-Mode** (configuración de poca resistencia, para rectas) y **Z-Mode** (configuración de mucha carga aerodinámica, para curvas). Antes de la temporada, la FIA los renombró a **Straight Mode** y **Corner Mode** respectivamente, junto con renombrar "Manual Override Mode" a [Overtake Mode](/glossary/overtake-mode) — parte de un esfuerzo deliberado para que los sistemas nuevos de 2026 sean más fáciles de seguir para los fans, sin cambiar ninguna función técnica de fondo.

**Dónde se ubica en el reglamento:** la geometría del alerón y los rangos de ángulo de flap permitidos en cada modo están regulados por el Reglamento Técnico que cubre la carrocería y los dispositivos aerodinámicos. Las zonas donde se puede activar Straight Mode — tramos de pista que cumplen una duración mínima en recta, en un espíritu parecido a cómo se designaban las zonas de DRS — son un tema del Reglamento Deportivo, definido para cada circuito en vez de ser fijo de forma global.

**Relación con las reglas de testeo aerodinámico:** el hardware de los alerones de Active Aero se diseña y valida dentro de la asignación de [Restricciones de Testeo Aerodinámico](/glossary/aerodynamic-testing-restrictions) de cada equipo — el mismo presupuesto de túnel de viento y CFD que rige cualquier otro componente aerodinámico del auto, lo que significa que la posición en el campeonato de un equipo determina indirectamente cuánto puede refinar su sistema de Active Aero carrera a carrera.""",
                },
            },
        },
    },
    {
        "slug": "aerodynamic-testing-restrictions",
        "category": "technical",
        "related_terms": ["cost-cap", "ground-effect"],
        "sources": [
            {"name": "RacingNews365 — F1 2026 Wind Tunnel & CFD Allocation", "url": "https://racingnews365.com/f1-2026-teams-wind-tunnel-time"},
            {"name": "The Race — The aero restrictions each F1 team will face in 2026", "url": "https://www.the-race.com/formula-1/the-aero-restrictions-each-f1-team-will-face-in-2026/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Aerodynamic Testing Restrictions (ATR)",
                    "short_definition": "ATR is F1's rule that punishes success with less wind tunnel and computer-simulation time — finish higher in the championship, and you get fewer hours to develop next season's car; finish lower, and you get more.",
                    "body_markdown": """Think of it like a video game handicap system: the better you did last time, the less practice time you get before the next round, so the field stays close instead of the leader running away every season. F1 does the same thing with aerodynamic development — how much time a team is allowed to spend testing wings and floors in a wind tunnel, and how many computer simulations (CFD) it can run, is set directly by where that team finished in the previous constructors' championship.

The team that finishes first gets the smallest allowance on the grid. The team that finishes last gets the biggest. It resets twice a year, so a team that's struggling in January can already be earning more testing time for the second half of the season. It's the same underlying idea as the [cost cap](/glossary/cost-cap) — stop the richest, most successful teams from simply out-spending and out-testing everyone else into a permanent lead.""",
                },
                "es": {
                    "term": "Restricciones de Testeo Aerodinámico (ATR)",
                    "short_definition": "ATR es la regla de F1 que castiga el éxito con menos tiempo de túnel de viento y simulación por computadora — terminas más arriba en el campeonato, y tienes menos horas para desarrollar el auto de la próxima temporada; terminas más abajo, y tienes más.",
                    "body_markdown": """Piénsalo como un sistema de hándicap de videojuego: cuanto mejor le fue a un equipo la vez pasada, menos tiempo de práctica tiene antes de la próxima ronda, así la parrilla se mantiene pareja en vez de que el líder se escape cada temporada. La F1 hace lo mismo con el desarrollo aerodinámico — cuánto tiempo puede gastar un equipo probando alerones y pisos en un túnel de viento, y cuántas simulaciones por computadora (CFD) puede correr, lo define directamente en qué puesto terminó ese equipo en el campeonato de constructores anterior.

El equipo que termina primero recibe la asignación más chica de toda la parrilla. El que termina último recibe la más grande. Se reinicia dos veces al año, así que un equipo que la está pasando mal en enero ya puede estar ganando más tiempo de testeo para la segunda mitad de la temporada. Es la misma idea de fondo que el [tope de gastos](/glossary/cost-cap) — evitar que los equipos más ricos y exitosos simplemente gasten y prueben más que todos los demás hasta tener una ventaja permanente.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Aerodynamic Testing Restrictions (ATR)",
                    "short_definition": "ATR sets each team's wind tunnel run count and CFD simulation allowance on a sliding scale tied to constructors' championship position: a baseline of 320 runs / 2,000 simulations at 7th, adjusted ±5% per position, from 70% for 1st up to 115% for 10th, reset twice yearly.",
                    "body_markdown": """**The baseline and the scale:** the 7th-placed constructor gets 100% of the baseline allocation — 320 wind tunnel runs and 2,000 CFD simulations per Aerodynamic Testing Period (ATP). Every position above or below 7th shifts that allowance by 5 percentage points: the champion gets 70% (the floor), and the last-placed team gets 115% (the ceiling).

**What it looks like in practice (2026 H1):** McLaren, as 2025 constructors' champion, is capped at 70% — 224 wind tunnel runs and 1,400 CFD simulations. Alpine, finishing last in 2025, gets 115% — 368 runs and 2,300 simulations. That's a gap of 144 runs and 900 simulations between the top and bottom of the grid for the exact same six-month window.

**Reset schedule:** allocations run in two Aerodynamic Testing Periods per year — 1 January to 30 June, and 1 July to 31 December — each one recalculated from the constructors' standings at that reset point, not fixed for the whole season. A team that starts the year poorly can already be climbing into a larger allocation by July.

**Why it targets wind tunnel + CFD specifically, not just money:** the [cost cap](/glossary/cost-cap) limits total spending, but a team could still out-develop rivals by simply running more physical and virtual aero tests within that budget. ATR closes that loophole by capping the *volume* of aero testing directly, on a scale that punishes success — the two systems work together rather than one replacing the other.""",
                },
                "es": {
                    "term": "Restricciones de Testeo Aerodinámico (ATR)",
                    "short_definition": "ATR fija la cantidad de corridas de túnel de viento y simulaciones de CFD de cada equipo en una escala móvil atada a la posición en el campeonato de constructores: una base de 320 corridas / 2.000 simulaciones en el 7° puesto, ajustada ±5% por posición, desde 70% para el 1° hasta 115% para el 10°, reiniciada dos veces al año.",
                    "body_markdown": """**La base y la escala:** el constructor que termina 7° recibe el 100% de la asignación base — 320 corridas de túnel de viento y 2.000 simulaciones de CFD por Período de Testeo Aerodinámico (ATP). Cada posición arriba o abajo del 7° mueve esa asignación 5 puntos porcentuales: el campeón recibe 70% (el piso), y el último de la tabla recibe 115% (el techo).

**Cómo se ve en la práctica (2026, primera mitad):** McLaren, como campeón de constructores 2025, está topeado en 70% — 224 corridas de túnel de viento y 1.400 simulaciones de CFD. Alpine, que terminó último en 2025, recibe 115% — 368 corridas y 2.300 simulaciones. Es una diferencia de 144 corridas y 900 simulaciones entre el primero y el último de la parrilla para la misma ventana de seis meses.

**Calendario de reinicio:** las asignaciones corren en dos Períodos de Testeo Aerodinámico por año — del 1 de enero al 30 de junio, y del 1 de julio al 31 de diciembre — cada uno recalculado según la tabla de constructores en ese punto de reinicio, no fijo para toda la temporada. Un equipo que arranca mal el año ya puede estar subiendo hacia una asignación más grande para julio.

**Por qué apunta al túnel de viento y al CFD específicamente, y no solo a la plata:** el [tope de gastos](/glossary/cost-cap) limita el gasto total, pero un equipo todavía podría desarrollar más que sus rivales simplemente corriendo más pruebas aerodinámicas físicas y virtuales dentro de ese presupuesto. ATR cierra ese hueco topeando directamente el *volumen* de testeo aerodinámico, en una escala que castiga el éxito — los dos sistemas trabajan juntos en vez de que uno reemplace al otro.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Aerodynamic Testing Restrictions (ATR)",
                    "short_definition": "ATR is defined in the FIA's Formula 1 Sporting Regulations (Appendix, Aerodynamic Testing Restrictions), in force in some form since 2021 and carried into the 2026 regulation set, governing wind tunnel and CFD resource allocation per constructor per Aerodynamic Testing Period.",
                    "body_markdown": """ATR isn't new to 2026 — the FIA introduced the sliding-scale wind tunnel and CFD allowance system in 2021, alongside the first cost cap, as a linked pair of measures to close the competitive gap in the sport. The 2026 regulation set carries the same mechanism forward, with allocation numbers recalibrated for the new car's aerodynamic testing needs.

**Structure in the regulations:** the FIA defines an Aerodynamic Testing Period (ATP) as a fixed six-month window, and sets the baseline allocation (320 wind tunnel runs, 2,000 CFD simulations) for the constructor that finished 7th in the reference championship standings, with the sliding 5%-per-position scale defined in the same appendix.

**Enforcement:** teams report wind tunnel and CFD usage to the FIA, which audits testing logs against the regulated allocation — a team exceeding its permitted runs or simulations within an ATP faces the same type of sporting sanction framework used for cost cap breaches, since both systems are administered as part of the FIA's broader Financial and Aerodynamic Regulations oversight.""",
                },
                "es": {
                    "term": "Restricciones de Testeo Aerodinámico (ATR)",
                    "short_definition": "ATR está definido en el Reglamento Deportivo de Fórmula 1 de la FIA (Anexo de Restricciones de Testeo Aerodinámico), vigente de alguna forma desde 2021 y continuado en el reglamento de 2026, que regula la asignación de recursos de túnel de viento y CFD por constructor y por Período de Testeo Aerodinámico.",
                    "body_markdown": """ATR no es nuevo de 2026 — la FIA introdujo el sistema de escala móvil de túnel de viento y CFD en 2021, junto con el primer tope de gastos, como un par de medidas conectadas para achicar la brecha competitiva del deporte. El reglamento de 2026 continúa el mismo mecanismo, con los números de asignación recalibrados para las necesidades de testeo aerodinámico del auto nuevo.

**Estructura en el reglamento:** la FIA define un Período de Testeo Aerodinámico (ATP) como una ventana fija de seis meses, y fija la asignación base (320 corridas de túnel de viento, 2.000 simulaciones de CFD) para el constructor que terminó 7° en la tabla de referencia del campeonato, con la escala móvil de 5% por posición definida en el mismo anexo.

**Cumplimiento:** los equipos reportan el uso de túnel de viento y CFD a la FIA, que audita los registros de testeo contra la asignación reglamentada — un equipo que excede sus corridas o simulaciones permitidas dentro de un ATP enfrenta el mismo tipo de marco de sanción deportiva que se usa para las infracciones del tope de gastos, ya que los dos sistemas se administran como parte de la supervisión más amplia de la FIA sobre Reglamentos Financieros y Aerodinámicos.""",
                },
            },
        },
    },
    {
        "slug": "advanced-sustainable-fuel",
        "category": "technical",
        "related_terms": ["power-unit"],
        "sources": [
            {"name": "Formula1.com — 2026 REGULATIONS EXPLAINED: All you need to know about F1's Advanced Sustainable Fuels", "url": "https://www.formula1.com/en/latest/article/2026-regulations-explained-all-you-need-to-know-about-f1s-advanced.4h53Szn4Z3VsD6rGcR3LtU"},
            {"name": "FIA — F1's New Era: Everything you need to know about how the FIA is making Formula 1 more competitive, more sustainable and safer in 2026", "url": "https://www.fia.com/news/f1s-new-era-everything-you-need-know-about-how-fia-making-formula-1-more-competitive-more"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Advanced Sustainable Fuel",
                    "short_definition": "Starting in 2026, every F1 car runs on fuel that's 100% sustainable — made from things like captured carbon, municipal waste, or non-food plants instead of crude oil — while still working exactly like normal fuel in the engine.",
                    "body_markdown": """It's called a "drop-in" fuel for a reason: chemically, it's built to behave just like the fossil fuel it replaces, so it works in an engine without any special modifications — the [power unit](/glossary/power-unit) doesn't know the difference. What's different is where the carbon in the fuel comes from. Instead of pumping crude oil out of the ground, F1's 2026 fuel is made from sources like carbon captured directly from the air or from industrial emissions, household waste, or plants that aren't used for food.

The pitch from F1 and the FIA isn't just "look how green our race cars are" — it's that this fuel works in ordinary road cars too, which is the real point: proving a fuel like this can scale up beyond a grid of 20 race cars into something that actually matters for the billions of combustion-engine cars already on the road that aren't going anywhere soon.""",
                },
                "es": {
                    "term": "Combustible Sostenible Avanzado",
                    "short_definition": "Desde 2026, todos los autos de F1 corren con un combustible 100% sostenible — hecho de cosas como carbono capturado, residuos urbanos, o plantas no alimentarias en vez de petróleo crudo — mientras funciona exactamente igual que el combustible normal dentro del motor.",
                    "body_markdown": """Se lo llama combustible "drop-in" por una razón: químicamente está hecho para comportarse igual que el combustible fósil que reemplaza, así que funciona en un motor sin ninguna modificación especial — la [unidad de potencia](/glossary/power-unit) no nota la diferencia. Lo que cambia es de dónde viene el carbono del combustible. En vez de sacar petróleo crudo de la tierra, el combustible de F1 2026 se hace con fuentes como carbono capturado directamente del aire o de emisiones industriales, residuos domésticos, o plantas que no se usan para alimentación.

La apuesta de F1 y la FIA no es solo mostrar qué verdes son sus autos de carrera — es que este combustible también funciona en autos de calle comunes, que es el punto real: demostrar que un combustible así se puede escalar más allá de una parrilla de 20 autos de carrera hacia algo que realmente importe para los miles de millones de autos con motor de combustión que ya están en la calle y no van a desaparecer pronto.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Advanced Sustainable Fuel",
                    "short_definition": "F1's 2026 fuel mandate requires 100% of race fuel to be derived from Advanced Sustainable Components (ASCs) — non-food biomass, renewable non-biological feedstock, or municipal waste — meeting a minimum 65% greenhouse-gas-savings threshold under the EU Renewable Energy Directive, while remaining a chemical drop-in for existing combustion engines.",
                    "body_markdown": """**Sourcing requirement:** the fuel must be made entirely from Advanced Sustainable Components — the FIA's regulated category covering non-food biomass, renewable feedstock of non-biological origin (including direct-air or industrial carbon capture), and municipal waste. Conventional crude-oil-derived components are excluded entirely, not just reduced.

**Emissions threshold, not just sourcing:** it's not enough for the feedstock to be non-fossil — the finished fuel must independently deliver at least a 65% greenhouse gas emissions saving compared to a fossil-fuel baseline, measured against the EU Renewable Energy Directive's methodology, the same standard used to certify sustainable fuels for road transport.

**Why "drop-in" matters technically:** the fuel is engineered to match the combustion characteristics (octane, energy density, burn behavior) of the fuel it replaces closely enough that it requires no [power unit](/glossary/power-unit) hardware changes to run — the point isn't to create a fuel that only works in a bespoke F1 engine, it's to prove a fuel that could be dropped into any existing combustion engine, race or road car, without modification.

**Combined with the power unit's electrification:** the fuel mandate runs alongside 2026's roughly 50/50 split between internal-combustion and electric power in the [power unit](/glossary/power-unit) — the two changes together are F1's answer to sustainability pressure without abandoning the combustion engine that defines the sport.""",
                },
                "es": {
                    "term": "Combustible Sostenible Avanzado",
                    "short_definition": "El mandato de combustible de F1 2026 exige que el 100% del combustible de carrera venga de Componentes Sostenibles Avanzados (ASCs) — biomasa no alimentaria, materia prima renovable de origen no biológico, o residuos urbanos — cumpliendo un umbral mínimo de 65% de ahorro de gases de efecto invernadero bajo la Directiva de Energías Renovables de la UE, siendo a la vez un reemplazo químico directo (\"drop-in\") para motores de combustión existentes.",
                    "body_markdown": """**Requisito de origen:** el combustible tiene que estar hecho completamente de Componentes Sostenibles Avanzados — la categoría regulada por la FIA que cubre biomasa no alimentaria, materia prima renovable de origen no biológico (incluyendo captura de carbono directa del aire o industrial), y residuos urbanos. Los componentes convencionales derivados de petróleo crudo quedan excluidos por completo, no solo reducidos.

**Umbral de emisiones, no solo de origen:** no alcanza con que la materia prima sea no fósil — el combustible terminado tiene que entregar de forma independiente al menos un 65% de ahorro de emisiones de gases de efecto invernadero comparado con una base fósil, medido con la metodología de la Directiva de Energías Renovables de la UE, el mismo estándar que se usa para certificar combustibles sostenibles para transporte por carretera.

**Por qué importa técnicamente ser "drop-in":** el combustible está diseñado para igualar las características de combustión (octanaje, densidad energética, comportamiento de quemado) del combustible que reemplaza lo suficientemente cerca como para no necesitar cambios de hardware en la [unidad de potencia](/glossary/power-unit) — el objetivo no es crear un combustible que solo funcione en un motor de F1 a medida, es demostrar un combustible que se pueda usar en cualquier motor de combustión existente, de carrera o de calle, sin modificaciones.

**Combinado con la electrificación de la unidad de potencia:** el mandato de combustible corre junto con la división de aproximadamente 50/50 entre combustión interna y potencia eléctrica en la [unidad de potencia](/glossary/power-unit) de 2026 — los dos cambios juntos son la respuesta de F1 a la presión de sostenibilidad sin abandonar el motor de combustión que define al deporte.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Advanced Sustainable Fuel",
                    "short_definition": "The 100% Advanced Sustainable Fuel mandate is set out in the FIA's Formula 1 Technical Regulations covering the power unit and fuel, developed jointly with F1's fuel suppliers ahead of the 2026 season as part of the sport's broader net-zero-by-2030 commitment.",
                    "body_markdown": """The fuel regulation sits within the same Technical Regulations chapter that governs the [power unit](/glossary/power-unit)'s internal-combustion component, since the fuel's chemistry and the engine's combustion characteristics have to be developed and homologated together. The FIA worked with F1's fuel suppliers over several seasons — using a 10% sustainable-fuel blend as an intermediate step in the years before 2026 — before mandating the full 100% Advanced Sustainable Fuel standard.

**Certification pathway:** rather than the FIA independently defining a novel sustainability standard, the regulations anchor the fuel's emissions-saving requirement to the EU's Renewable Energy Directive methodology — an existing, externally audited framework — which lets F1 claim its sustainability figures are verifiable against a standard already used to certify road-fuel sustainability claims, not a marketing figure specific to the sport.

**Framing within F1's sustainability strategy:** the FIA and Formula One Group have publicly tied the fuel mandate to the sport's stated goal of net-zero carbon by 2030, positioning 2026's fuel change — alongside the [power unit](/glossary/power-unit)'s increased electrification — as the two central technical regulations doing that work, rather than offset-based claims alone.""",
                },
                "es": {
                    "term": "Combustible Sostenible Avanzado",
                    "short_definition": "El mandato de Combustible Sostenible Avanzado al 100% está establecido en el Reglamento Técnico de Fórmula 1 de la FIA que cubre la unidad de potencia y el combustible, desarrollado junto con los proveedores de combustible de F1 antes de la temporada 2026 como parte del compromiso más amplio del deporte de ser neto cero para 2030.",
                    "body_markdown": """El reglamento de combustible está dentro del mismo capítulo del Reglamento Técnico que rige el componente de combustión interna de la [unidad de potencia](/glossary/power-unit), ya que la química del combustible y las características de combustión del motor se tienen que desarrollar y homologar juntas. La FIA trabajó con los proveedores de combustible de F1 durante varias temporadas — usando una mezcla de 10% de combustible sostenible como paso intermedio en los años previos a 2026 — antes de exigir el estándar completo de Combustible Sostenible Avanzado al 100%.

**Camino de certificación:** en vez de que la FIA defina de forma independiente un estándar de sostenibilidad nuevo, el reglamento ancla el requisito de ahorro de emisiones del combustible a la metodología de la Directiva de Energías Renovables de la UE — un marco ya existente y auditado externamente — lo que le permite a F1 decir que sus cifras de sostenibilidad son verificables contra un estándar que ya se usa para certificar afirmaciones de sostenibilidad de combustibles de calle, no una cifra de marketing propia del deporte.

**Encuadre dentro de la estrategia de sostenibilidad de F1:** la FIA y Formula One Group ataron públicamente el mandato de combustible al objetivo declarado del deporte de ser neto cero en carbono para 2030, posicionando el cambio de combustible de 2026 — junto con la mayor electrificación de la [unidad de potencia](/glossary/power-unit) — como los dos reglamentos técnicos centrales que hacen ese trabajo, en vez de depender solo de afirmaciones basadas en compensaciones (offsets).""",
                },
            },
        },
    },
]


def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    for term_def in TERMS:
        slug = term_def["slug"]
        category = term_def["category"]
        related_terms = term_def["related_terms"]
        sources = term_def["sources"]
        translation_group_id = str(uuid.uuid4())

        for depth, locales in term_def["layers"].items():
            for locale, content in locales.items():
                row = {
                    "translation_group_id": translation_group_id,
                    "locale": locale,
                    "slug": slug,
                    "term": content["term"],
                    "category": category,
                    "depth": depth,
                    "short_definition": content["short_definition"],
                    "body_markdown": content["body_markdown"],
                    "related_terms": related_terms,
                    "sources": sources,
                    "status": "draft",
                }
                result = sb.table("glossary_terms").upsert(
                    row, on_conflict="locale,slug,depth"
                ).execute()
                print(f"OK  {locale}/{slug}/{depth}")


if __name__ == "__main__":
    main()
