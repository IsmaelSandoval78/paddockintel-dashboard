#!/usr/bin/env python3
"""Fourth glossary batch (category: technical) -- ground-effect, overtake-mode,
drs, porpoising, power-unit. Same layered format validated by the undercut
pilot. EN+ES only. Seeds as 'draft'."""

import os
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "ground-effect",
        "category": "technical",
        "related_terms": ["dirty-air", "porpoising"],
        "sources": [
            {"name": "Aston Martin F1 — The Road to 2026: F1's new era and regulations explained", "url": "https://www.astonmartinf1.com/en-GB/news/feature/the-road-to-2026-f1s-new-era-and-regulations-explained"},
            {"name": "PlanetF1 — F1 2026 uncovered: how 'Active Aero' will shake up the sport", "url": "https://www.planetf1.com/features/f1-2026-uncovered-the-introduction-of-active-aerodynamics"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Ground Effect",
                    "short_definition": "Ground effect is a way of generating downforce by shaping the underside of the car to suck it toward the track, instead of relying only on wings pushing down from above — powerful, but 2026's rules deliberately dial it back.",
                    "body_markdown": """Think of a vacuum cleaner nozzle held close to the floor: the closer it gets, the harder it sucks. Ground effect works the same way — tunnels shaped into the floor of the car speed up the air flowing underneath, which drops the air pressure there and effectively sucks the car down onto the track.

It's a genuinely efficient way to make downforce — more grip for less drag than wings alone provide. F1 brought it back for the 2022 cars specifically to try to fix [dirty air](/glossary/dirty-air), since ground-effect downforce was expected to be less disrupted by following another car than wing-generated downforce.

The catch, discovered the hard way in 2022, is that this "vacuum" effect is extremely sensitive to exactly how close the floor sits to the track — get it wrong and the airflow can suddenly stall and reattach in a rapid, uncontrollable cycle, a problem known as [porpoising](/glossary/porpoising). The 2026 regulations respond by scaling ground effect back — shorter tunnels, a flatter floor — trading away some of its raw efficiency for a car that's more stable and easier to follow closely.""",
                },
                "es": {
                    "term": "Efecto Suelo (Ground Effect)",
                    "short_definition": "El efecto suelo es una forma de generar carga aerodinámica dándole forma a la parte de abajo del auto para succionarlo hacia la pista, en vez de depender solo de alerones empujando desde arriba — muy potente, pero el reglamento 2026 lo reduce a propósito.",
                    "body_markdown": """Pensá en la boquilla de una aspiradora sostenida cerca del piso: cuanto más cerca está, más fuerte succiona. El efecto suelo funciona igual — túneles con forma en el piso del auto aceleran el aire que pasa por debajo, lo que baja la presión ahí y en la práctica succiona al auto hacia la pista.

Es una forma genuinamente eficiente de generar carga aerodinámica — más agarre por menos resistencia al aire que lo que dan los alerones solos. La F1 lo trajo de vuelta para los autos de 2022 específicamente para intentar arreglar el [aire sucio](/glossary/dirty-air), porque se esperaba que la carga aerodinámica por efecto suelo se viera menos afectada al seguir a otro auto que la carga generada por alerones.

El problema, descubierto de la peor manera en 2022, es que ese efecto de "aspiradora" es extremadamente sensible a exactamente qué tan cerca está el piso de la pista — si se calcula mal, el flujo de aire puede desprenderse y volver a pegarse de golpe en un ciclo rápido e incontrolable, un problema conocido como [porpoising](/glossary/porpoising). El reglamento 2026 responde reduciendo el efecto suelo — túneles más cortos, piso más plano — cambiando algo de su eficiencia bruta por un auto más estable y más fácil de seguir de cerca.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Ground Effect",
                    "short_definition": "Ground effect generates downforce via venturi tunnels shaped into the floor that accelerate underfloor airflow and lower pressure beneath the car; it's more efficient (higher downforce-to-drag ratio) than wing-generated downforce but highly ride-height-sensitive, which the 2026 regulations address by shortening the tunnels and flattening more of the floor.",
                    "body_markdown": """**How it generates downforce:** venturi-shaped tunnels under the floor narrow the airflow path, which — by basic fluid dynamics — speeds the air up and drops its pressure. Lower pressure under the car relative to atmospheric pressure above effectively pulls the car toward the track surface. Because this downforce comes from managing airflow rather than physically blocking it (as a wing does), it produces less aerodynamic drag for a given amount of downforce than wings alone — a genuine efficiency advantage.

**Why F1 brought it back for 2022:** wing-generated downforce (dominant through the 2010s) sheds a highly disrupted wake, which is a major contributor to [dirty air](/glossary/dirty-air). Ground-effect downforce was modeled to be less sensitive to a following car's wake, theoretically letting cars run closer through corners — a partial success in practice, but data through 2025 showed the improvement was smaller and less durable than hoped as teams optimized every other part of the car.

**The instability tradeoff:** ground-effect downforce scales non-linearly with ride height — get the floor too close to the ground and the underfloor airflow can stall abruptly, killing downforce and letting the car's ride height pop back up, which restarts the cycle. This oscillation is [porpoising](/glossary/porpoising), and it's a direct structural consequence of how aggressively a given floor design exploits ground effect.

**2026 response:** shorter venturi tunnels and a larger proportion of genuinely flat floor reduce both the peak downforce ground effect alone can produce and its sensitivity to ride-height changes — a deliberate trade of raw aerodynamic efficiency for predictability, both in porpoising resistance and in how much the car's balance degrades when following another car closely.""",
                },
                "es": {
                    "term": "Efecto Suelo (Ground Effect)",
                    "short_definition": "El efecto suelo genera carga aerodinámica mediante túneles venturi con forma en el piso que aceleran el flujo de aire bajo el auto y bajan la presión debajo de él; es más eficiente (mejor relación carga/resistencia) que la carga generada por alerones pero muy sensible a la altura al piso, algo que el reglamento 2026 corrige acortando los túneles y aplanando más el piso.",
                    "body_markdown": """**Cómo genera carga aerodinámica:** túneles con forma venturi bajo el piso angostan el paso del aire, lo que — por dinámica de fluidos básica — acelera el aire y baja su presión. La presión más baja debajo del auto respecto a la presión atmosférica de arriba efectivamente tira del auto hacia la superficie de la pista. Como esta carga aerodinámica viene de manejar el flujo de aire en vez de bloquearlo físicamente (como hace un alerón), produce menos resistencia aerodinámica para una misma cantidad de carga que los alerones solos — una ventaja de eficiencia real.

**Por qué la F1 lo trajo de vuelta para 2022:** la carga generada por alerones (dominante durante los 2010s) deja una estela muy perturbada, un contribuyente importante al [aire sucio](/glossary/dirty-air). Se modeló que la carga por efecto suelo sería menos sensible a la estela de un auto que sigue, en teoría permitiendo seguirse más de cerca en las curvas — un éxito parcial en la práctica, pero los datos hasta 2025 mostraron que la mejora fue más chica y menos duradera de lo esperado, a medida que los equipos optimizaban cada otra parte del auto.

**El costo de inestabilidad:** la carga por efecto suelo escala de forma no lineal con la altura al piso — si el piso queda demasiado cerca del suelo, el flujo de aire bajo el auto puede desprenderse de golpe, matando la carga aerodinámica y dejando que la altura al piso vuelva a subir, lo que reinicia el ciclo. Esta oscilación es el [porpoising](/glossary/porpoising), y es una consecuencia estructural directa de qué tan agresivamente explota el efecto suelo un diseño de piso determinado.

**Respuesta 2026:** túneles venturi más cortos y una proporción mayor de piso genuinamente plano reducen tanto la carga aerodinámica máxima que puede producir el efecto suelo solo como su sensibilidad a los cambios de altura al piso — un cambio deliberado de eficiencia aerodinámica bruta por previsibilidad, tanto en resistencia al porpoising como en cuánto se degrada el balance del auto al seguir de cerca a otro.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Ground Effect",
                    "short_definition": "Ground-effect underfloor design is regulated directly in the FIA's Technical Regulations, which for 2026 mandate a partially flat floor with shortened venturi tunnels — a specific, measurable rollback from the 2022-2025 regulation set, aimed explicitly at wake reduction rather than banning ground effect outright.",
                    "body_markdown": """The FIA doesn't regulate ground effect as a concept — it regulates the exact floor geometry every constructor must build to, which determines how much ground effect that floor can actually produce. The 2022 Technical Regulations specified venturi tunnel dimensions and floor-edge rules that reintroduced heavy ground-effect reliance across the grid for the first time since it was banned in the early 1980s for the previous generation of ground-effect cars.

**The 2026 rollback:** rather than removing ground effect, the Technical Regulations mandate a floor that's flat across a larger proportion of its area, with venturi tunnels reduced in length compared to the 2022-2025 specification. This is a precise, dimensioned regulatory change, not a general instruction — every team's floor must conform to the same reduced-tunnel geometry.

**Why it's framed as a wake-reduction measure specifically:** the FIA's own stated rationale, based on CFD and wind-tunnel research shared with the teams during development of the 2026 rules, ties the floor change directly to improving how closely cars can follow each other — the same regulatory goal that also drives the wing simplification and [Overtake Mode](/glossary/overtake-mode) systems introduced the same season, rather than being an isolated aerodynamic tweak.""",
                },
                "es": {
                    "term": "Efecto Suelo (Ground Effect)",
                    "short_definition": "El diseño del piso por efecto suelo está regulado directamente en el Reglamento Técnico de la FIA, que para 2026 exige un piso parcialmente plano con túneles venturi acortados — un retroceso específico y medible respecto al reglamento 2022-2025, apuntado explícitamente a reducir la estela y no a prohibir el efecto suelo por completo.",
                    "body_markdown": """La FIA no regula el efecto suelo como concepto — regula la geometría exacta del piso que cada constructor debe construir, que determina cuánto efecto suelo puede producir realmente ese piso. El Reglamento Técnico de 2022 especificó dimensiones de túneles venturi y reglas de borde de piso que reintrodujeron una fuerte dependencia del efecto suelo en toda la parrilla por primera vez desde que se prohibió a principios de los 80 para la generación anterior de autos de efecto suelo.

**El retroceso de 2026:** en vez de eliminar el efecto suelo, el Reglamento Técnico exige un piso plano en una proporción mayor de su área, con túneles venturi reducidos en longitud respecto a la especificación de 2022-2025. Es un cambio regulatorio preciso y dimensionado, no una instrucción general — el piso de cada equipo debe cumplir la misma geometría de túnel reducido.

**Por qué se plantea específicamente como una medida de reducción de estela:** el propio fundamento declarado por la FIA, basado en investigación de CFD y túnel de viento compartida con los equipos durante el desarrollo del reglamento 2026, conecta el cambio de piso directamente con mejorar qué tan de cerca pueden seguirse los autos — el mismo objetivo regulatorio que también impulsa la simplificación de alerones y los sistemas de [Overtake Mode](/glossary/overtake-mode) introducidos la misma temporada, en vez de ser un ajuste aerodinámico aislado.""",
                },
            },
        },
    },
    {
        "slug": "overtake-mode",
        "category": "technical",
        "related_terms": ["drs", "ground-effect"],
        "sources": [
            {"name": "Motorsport.com — How F1's new active aero will work in 2026 as DRS is dropped", "url": "https://www.motorsport.com/f1/news/how-f1s-new-active-aero-will-work-in-2026/10620106/"},
            {"name": "RaceFans.net — Forget the 'Manual Override Mode': F1 renames its new 2026 technologies", "url": "https://www.racefans.net/2025/12/17/forget-the-manual-override-mode-f1-renames-its-new-2026-technologies/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode is 2026's replacement for DRS — instead of opening a wing flap to cut drag, a chasing driver within one second of the car ahead gets a temporary boost of extra electric power to help them complete a pass.",
                    "body_markdown": """It's like a boost pad in a racing video game that only lights up when you're right on someone's bumper: get close enough to the car in front — within one second, at a defined point on track, exactly like the old DRS rule — and you're allowed to draw extra power from the car's battery and electric motor for a short window, giving a genuine speed advantage to help you complete the move.

The big difference from [DRS](/glossary/drs) is *what's* being adjusted. DRS opened a flap on the rear wing to physically cut aerodynamic drag. Overtake Mode doesn't touch the wing at all — it's a power boost from the electrified half of the engine. Separately, F1's 2026 cars also automatically switch their wing angles between a high-downforce cornering setup and a low-drag straight-line setup on every lap, for every car — that automatic aero adjustment happens regardless of whether anyone's chasing anyone, and Overtake Mode is the extra layer on top, reserved specifically for a driver close enough to attack.""",
                },
                "es": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode es el reemplazo de 2026 para el DRS — en vez de abrir un flap del alerón para reducir resistencia, un piloto que persigue a menos de un segundo del auto de adelante recibe un impulso temporal de potencia eléctrica extra para ayudarlo a completar el sobrepaso.",
                    "body_markdown": """Es como un power-up en un videojuego de carreras que solo se activa cuando estás pegado al paragolpes de alguien: acercate lo suficiente al auto de adelante — dentro de un segundo, en un punto definido de la pista, exactamente como la vieja regla del DRS — y podés usar potencia extra de la batería y el motor eléctrico del auto durante una ventana corta, dando una ventaja de velocidad real para ayudarte a completar la maniobra.

La gran diferencia con el [DRS](/glossary/drs) es *qué* se está ajustando. El DRS abría un flap en el alerón trasero para reducir físicamente la resistencia aerodinámica. Overtake Mode no toca el alerón para nada — es un impulso de potencia de la mitad electrificada del motor. Por separado, los autos de F1 de 2026 también cambian automáticamente el ángulo de sus alerones entre una puesta a punto de mucha carga para curvas y otra de poca resistencia para rectas, en cada vuelta, para cada auto — ese ajuste aerodinámico automático pasa sin importar si alguien persigue a alguien, y Overtake Mode es la capa extra encima, reservada específicamente para un piloto lo suficientemente cerca como para atacar.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode is a proximity-gated MGU-K power boost (renamed from 'Manual Override Mode') available to a driver within one second of the car ahead at the detection point — distinct from the automatic, always-on active-aero switching between Straight Mode (low-drag) and Corner Mode (high-downforce) that every car uses every lap.",
                    "body_markdown": """2026's aero and power rules introduce two separate systems that are easy to conflate:

**Straight Mode / Corner Mode (formerly X-Mode/Z-Mode):** every car automatically switches its front and rear wing angles between a low-drag configuration on straights and a high-downforce configuration for corners, every lap, for every driver, regardless of whether they're racing anyone. This isn't a driver-triggered advantage — it's baseline aerodynamic behavior built into the regulations for all cars.

**Overtake Mode (formerly Manual Override Mode):** this is the actual mechanism replacing DRS's overtaking-assist role. When a chasing car is within one second of the car ahead at a defined detection point — the same proximity-gate concept DRS used — the driver can draw additional power from the electrified half of the [power unit](/glossary/power-unit) (the significantly upgraded MGU-K) for a limited window, adding genuine straight-line speed on top of the passive Straight Mode aero state.

**Why a power boost instead of a drag-reducing flap:** with wing elements already simplified and drag reduced across the board by the 2026 regulations, there was less drag left for a DRS-style flap to meaningfully cut. Shifting the overtaking assist to the power unit — which received a major electric-power increase for 2026 anyway — gave the FIA a fresh, tunable lever to replace DRS's function without depending on the wings doing double duty.""",
                },
                "es": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode es un impulso de potencia de la MGU-K condicionado por proximidad (renombrado de 'Manual Override Mode') disponible para un piloto a menos de un segundo del auto de adelante en el punto de detección — distinto del cambio automático y siempre activo de aero entre Straight Mode (poca resistencia) y Corner Mode (mucha carga) que usa cada auto en cada vuelta.",
                    "body_markdown": """Las reglas de aero y potencia de 2026 introducen dos sistemas separados que es fácil confundir:

**Straight Mode / Corner Mode (antes X-Mode/Z-Mode):** cada auto cambia automáticamente el ángulo de sus alerones delantero y trasero entre una configuración de poca resistencia en las rectas y una de mucha carga aerodinámica para las curvas, en cada vuelta, para cada piloto, sin importar si está corriendo contra alguien. No es una ventaja que activa el piloto — es comportamiento aerodinámico base incorporado en el reglamento para todos los autos.

**Overtake Mode (antes Manual Override Mode):** este es el mecanismo real que reemplaza el rol de asistencia para adelantar que tenía el DRS. Cuando un auto que persigue está a menos de un segundo del auto de adelante en un punto de detección definido — el mismo concepto de umbral de proximidad que usaba el DRS — el piloto puede usar potencia adicional de la mitad electrificada de la [unidad de potencia](/glossary/power-unit) (la MGU-K, significativamente mejorada) durante una ventana limitada, sumando velocidad real en recta encima del estado aerodinámico pasivo de Straight Mode.

**Por qué un impulso de potencia en vez de un flap que reduce resistencia:** con los elementos de los alerones ya simplificados y la resistencia reducida en general por el reglamento 2026, quedaba menos resistencia para que un flap estilo DRS recortara de forma significativa. Trasladar la asistencia para adelantar a la unidad de potencia — que de todos modos recibió un aumento grande de potencia eléctrica para 2026 — le dio a la FIA una palanca nueva y ajustable para reemplazar la función del DRS sin depender de que los alerones cumplan una doble función.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode is defined in the FIA's 2026 Technical and Sporting Regulations as the renamed successor to what FIA documentation initially called 'Manual Override Mode,' governed by the same one-second proximity-gate concept the Sporting Regulations previously used for DRS activation.",
                    "body_markdown": """When the FIA published the technical detail behind the 2026 power and aero rules, the overtaking-assist power boost was initially documented under the working name "Manual Override Mode," alongside the "X-Mode" and "Z-Mode" labels for the automatic aero states. In a terminology update ahead of the season, the FIA renamed these to fan-facing names — Manual Override Mode became **Overtake Mode**, X-Mode became **Straight Mode**, and Z-Mode became **Corner Mode** — without changing the underlying technical function of any of them.

**Regulatory mechanism carried over from DRS:** the Sporting Regulations define Overtake Mode's activation condition using the same proximity-gate structure as the old DRS rule — a car must be within a defined time gap (historically one second) of the car ahead at a designated detection point to be permitted to draw the extra power in the following zone. The FIA reused this mechanism deliberately, since it had already proven effective at DRS's core job: giving a genuinely close pursuer a tool to close the final gap, without handing the same advantage to a car that isn't really in overtaking range.

**Where it sits in the rules:** the power delivery itself (how much extra output, for how long) is governed by the Technical Regulations covering the [power unit](/glossary/power-unit)'s electrical systems, while the *when it may be used* condition is a Sporting Regulations matter — the same split that applied to DRS's wing-flap mechanics (Technical) versus its one-second activation rule (Sporting).""",
                },
                "es": {
                    "term": "Overtake Mode",
                    "short_definition": "Overtake Mode está definido en el Reglamento Técnico y Deportivo 2026 de la FIA como el sucesor renombrado de lo que la documentación de la FIA llamó inicialmente 'Manual Override Mode', regido por el mismo concepto de umbral de proximidad de un segundo que el Reglamento Deportivo usaba antes para la activación del DRS.",
                    "body_markdown": """Cuando la FIA publicó el detalle técnico detrás de las reglas de potencia y aero de 2026, el impulso de potencia de asistencia para adelantar se documentó inicialmente bajo el nombre de trabajo "Manual Override Mode", junto con las etiquetas "X-Mode" y "Z-Mode" para los estados aerodinámicos automáticos. En una actualización de terminología antes de la temporada, la FIA les puso nombres más orientados al hincha — Manual Override Mode pasó a ser **Overtake Mode**, X-Mode pasó a ser **Straight Mode**, y Z-Mode pasó a ser **Corner Mode** — sin cambiar la función técnica de fondo de ninguno de los tres.

**Mecanismo regulatorio heredado del DRS:** el Reglamento Deportivo define la condición de activación de Overtake Mode usando la misma estructura de umbral de proximidad que la vieja regla del DRS — un auto debe estar dentro de una diferencia de tiempo definida (históricamente un segundo) respecto al auto de adelante en un punto de detección designado para poder usar la potencia extra en la zona siguiente. La FIA reutilizó este mecanismo a propósito, porque ya había demostrado ser efectivo en la tarea central del DRS: darle a un perseguidor genuinamente cerca una herramienta para cerrar la diferencia final, sin darle la misma ventaja a un auto que no está realmente al alcance para adelantar.

**Dónde se ubica en el reglamento:** la entrega de potencia en sí (cuánta salida extra, por cuánto tiempo) está regida por el Reglamento Técnico que cubre los sistemas eléctricos de la [unidad de potencia](/glossary/power-unit), mientras que la condición de *cuándo se puede usar* es un asunto del Reglamento Deportivo — la misma división que aplicaba a la mecánica del flap del DRS (Técnico) versus su regla de activación de un segundo (Deportivo).""",
                },
            },
        },
    },
    {
        "slug": "drs",
        "category": "technical",
        "related_terms": ["overtake-mode", "dirty-air"],
        "sources": [
            {"name": "Motorsport.com — What is DRS in Formula 1 and how does it work?", "url": "https://www.motorsport.com/f1/news/what-is-drs-in-f1-how-does-it-work-is-it-automatic/10437677/"},
            {"name": "PlanetF1 — What is DRS in F1, how does it work, and is it being removed?", "url": "https://www.planetf1.com/features/what-is-f1s-drs-and-how-does-it-work"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "DRS was a button-activated flap on the rear wing, used from 2011 through 2025, that opened to cut drag and give a chasing driver a speed boost on straights — retired for 2026 and replaced by Overtake Mode.",
                    "body_markdown": """For fifteen seasons, DRS was F1's answer to a simple problem: cars that were fast enough to overtake often couldn't, because following closely through corners ruined their grip. DRS gave the chasing driver a straight-line speed boost — worth roughly 10-12 km/h — by opening a slot in the rear wing to reduce drag, but only when they were close enough behind (within one second) at specific points on track.

Push a button, the wing flap pops open, drag drops, top speed climbs — and if the driver got close enough before the next corner, they'd complete the pass. It worked well enough to become one of the most recognizable pieces of F1 technology of its era, but it also drew real criticism: on some tracks, DRS made passing so easy it felt automatic rather than earned, and cars nose-to-tail in "DRS trains" sometimes seemed to cancel each other's advantage out entirely.

For 2026, DRS is gone — replaced by [Overtake Mode](/glossary/overtake-mode), a similar proximity-triggered boost, but delivered through extra electric power instead of a wing flap.""",
                },
                "es": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "El DRS fue un flap del alerón trasero activado por botón, usado desde 2011 hasta 2025, que se abría para reducir resistencia y darle un impulso de velocidad en recta a un piloto que perseguía — retirado para 2026 y reemplazado por Overtake Mode.",
                    "body_markdown": """Durante quince temporadas, el DRS fue la respuesta de la F1 a un problema simple: autos que eran lo suficientemente rápidos para adelantar muchas veces no podían, porque seguir de cerca en las curvas les arruinaba el agarre. El DRS le daba al piloto que perseguía un impulso de velocidad en recta — de unos 10-12 km/h — abriendo una ranura en el alerón trasero para reducir la resistencia, pero solo cuando estaba lo suficientemente cerca (a menos de un segundo) en puntos específicos de la pista.

Apretás un botón, el flap del alerón se abre, la resistencia baja, la velocidad máxima sube — y si el piloto se acercaba lo suficiente antes de la próxima curva, completaba el sobrepaso. Funcionó lo suficientemente bien como para volverse una de las piezas de tecnología de F1 más reconocibles de su época, pero también generó críticas reales: en algunos circuitos, el DRS hacía tan fácil adelantar que se sentía automático en vez de merecido, y los autos en fila en "trenes de DRS" a veces parecían anular por completo la ventaja del otro.

Para 2026, el DRS desapareció — reemplazado por [Overtake Mode](/glossary/overtake-mode), un impulso activado por proximidad similar, pero entregado con potencia eléctrica extra en vez de un flap del alerón.""",
                },
            },
            "technical": {
                "en": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "DRS opened a rear-wing flap gap (10-15mm normally, expandable to 65mm from 2014) to cut drag and add roughly 10-12 km/h of top speed for a car within one second of a rival at a designated detection point, active in defined activation zones and disabled by default in corners and under yellow-flag conditions.",
                    "body_markdown": """**Mechanism:** the rear wing's upper element could pivot open, enlarging the gap between wing elements from a normal racing gap of roughly 10-15mm to 50mm at introduction in 2011, later increased to 65mm from 2014 to boost the effect further. Opening this gap let air pass through rather than being deflected downward, cutting the aerodynamic drag the wing produced — and with less drag, the car could reach a higher top speed for the same engine power.

**Activation rules:** DRS was restricted to specific activation zones marked on track (usually straights), and only usable there if the driver's car crossed a detection point earlier in the lap within one second of the car ahead — the exact "proximity gate" concept later carried over to [Overtake Mode](/glossary/overtake-mode). Outside those zones, or without being close enough at the detection point, the system was electronically locked and couldn't be triggered.

**Safety restrictions:** DRS use was automatically disabled during the race's opening laps, during Safety Car or Virtual Safety Car periods, and in wet conditions when Race Control disabled it — the extra straight-line speed and reduced rear-end stability it caused weren't considered safe when track conditions or traffic were already compromised.

**Why it was retired:** by the mid-2020s, the FIA judged that a DRS-free approach to overtaking — reducing the underlying [dirty air](/glossary/dirty-air) problem through 2026's floor and wing regulations rather than compensating for it with a drag-cutting device — would produce racing that depended less on a single push-to-pass tool and more on genuine pace differences.""",
                },
                "es": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "El DRS abría un hueco en el flap del alerón trasero (10-15mm normalmente, ampliable a 65mm desde 2014) para reducir resistencia y sumar unos 10-12 km/h de velocidad máxima a un auto a menos de un segundo de un rival en un punto de detección designado, activo en zonas de activación definidas y desactivado por default en curvas y bajo condiciones de bandera amarilla.",
                    "body_markdown": """**Mecanismo:** el elemento superior del alerón trasero podía pivotar y abrirse, agrandando el hueco entre elementos del alerón de un hueco normal de carrera de unos 10-15mm a 50mm al introducirse en 2011, después aumentado a 65mm desde 2014 para potenciar más el efecto. Abrir ese hueco dejaba pasar el aire en vez de desviarlo hacia abajo, reduciendo la resistencia aerodinámica que producía el alerón — y con menos resistencia, el auto podía alcanzar una velocidad máxima mayor con la misma potencia de motor.

**Reglas de activación:** el DRS estaba restringido a zonas de activación específicas marcadas en la pista (generalmente rectas), y solo se podía usar ahí si el auto del piloto cruzaba un punto de detección antes en la vuelta a menos de un segundo del auto de adelante — el mismo concepto de "umbral de proximidad" que después se trasladó a [Overtake Mode](/glossary/overtake-mode). Fuera de esas zonas, o sin estar lo suficientemente cerca en el punto de detección, el sistema quedaba bloqueado electrónicamente y no se podía activar.

**Restricciones de seguridad:** el uso del DRS se desactivaba automáticamente durante las primeras vueltas de la carrera, durante períodos de Safety Car o Virtual Safety Car, y en condiciones de lluvia cuando Dirección de Carrera lo desactivaba — la velocidad extra en recta y la menor estabilidad del tren trasero que causaba no se consideraban seguras cuando las condiciones de pista o el tráfico ya estaban comprometidos.

**Por qué se retiró:** para mediados de los 2020s, la FIA consideró que un enfoque sin DRS para adelantar — reduciendo el problema de fondo del [aire sucio](/glossary/dirty-air) a través del reglamento de piso y alerones de 2026 en vez de compensarlo con un dispositivo que recorta resistencia — produciría carreras que dependieran menos de una sola herramienta de "apretar un botón para pasar" y más de diferencias de ritmo genuinas.""",
                },
            },
            "fia": {
                "en": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "DRS was introduced into the FIA Sporting and Technical Regulations for 2011, in direct response to overtaking difficulties highlighted by the 2010 season finale, and formally removed from the regulations for 2026, replaced by the Overtake Mode system.",
                    "body_markdown": """**Why it was introduced:** the push for a driver-activated overtaking aid grew directly out of the 2010 championship finale, where Fernando Alonso spent the closing laps stuck behind a slower car (Vitaly Petrov's Renault) unable to pass despite a clear pace advantage, costing him the title. The FIA concluded that overtaking had become too dependent on strategy and pit stops rather than genuine on-track racing, and introduced DRS for 2011 as a regulated technical solution.

**Regulatory structure:** the wing-flap mechanism itself — the permitted gap dimensions, the activation hardware — was governed by the Technical Regulations, while the one-second proximity gate and the defined activation-zone system were Sporting Regulations matters, enforced in real time via timing loops at the detection points on each circuit.

**Formal removal for 2026:** the FIA's 2026 regulatory reset eliminated DRS from both the Technical and Sporting Regulations, replacing its function with [Overtake Mode](/glossary/overtake-mode) — a power-based system governed by an equivalent proximity-gate rule, but delivered through the electrified power unit rather than adjustable rear-wing bodywork. The FIA's stated rationale ties the change to the broader 2026 goal of reducing the underlying aerodynamic disadvantage of following a car closely, rather than relying on a compensating device layered on top of an unsolved wake problem.""",
                },
                "es": {
                    "term": "DRS (Drag Reduction System)",
                    "short_definition": "El DRS se introdujo en el Reglamento Deportivo y Técnico de la FIA para 2011, en respuesta directa a las dificultades para adelantar que dejó en evidencia el cierre de la temporada 2010, y se eliminó formalmente del reglamento para 2026, reemplazado por el sistema Overtake Mode.",
                    "body_markdown": """**Por qué se introdujo:** el impulso para una ayuda de adelantamiento activada por el piloto surgió directamente del cierre del campeonato 2010, donde Fernando Alonso pasó las vueltas finales atascado detrás de un auto más lento (el Renault de Vitaly Petrov) sin poder pasarlo pese a tener una ventaja de ritmo clara, lo que le costó el título. La FIA concluyó que adelantar se había vuelto demasiado dependiente de la estrategia y las paradas en boxes en vez de la carrera genuina en pista, e introdujo el DRS para 2011 como una solución técnica regulada.

**Estructura regulatoria:** el mecanismo del flap del alerón en sí — las dimensiones de hueco permitidas, el hardware de activación — estaba regido por el Reglamento Técnico, mientras que el umbral de proximidad de un segundo y el sistema de zonas de activación definidas eran asuntos del Reglamento Deportivo, fiscalizados en tiempo real mediante bucles de cronometraje en los puntos de detección de cada circuito.

**Eliminación formal para 2026:** el reseteo regulatorio 2026 de la FIA eliminó el DRS tanto del Reglamento Técnico como del Deportivo, reemplazando su función por [Overtake Mode](/glossary/overtake-mode) — un sistema basado en potencia regido por una regla de umbral de proximidad equivalente, pero entregado a través de la unidad de potencia electrificada en vez de carrocería ajustable del alerón trasero. El fundamento declarado por la FIA conecta el cambio con el objetivo más amplio de 2026 de reducir la desventaja aerodinámica de fondo de seguir de cerca a un auto, en vez de depender de un dispositivo compensatorio montado sobre un problema de estela sin resolver.""",
                },
            },
        },
    },
    {
        "slug": "porpoising",
        "category": "technical",
        "related_terms": ["ground-effect"],
        "sources": [
            {"name": "Crash.net — Porpoising F1: What is it? Explaining the bouncing car phenomenon", "url": "https://www.crash.net/f1/news/1009897/1/porpoising-f1-what-it-explaining-bouncing-car-phenomenon"},
            {"name": "Top Gear — What is porpoising? F1's aerodynamic phenomenon explained", "url": "https://www.topgear.com/car-news/formula-one/what-porpoising-f1s-aerodynamic-phenomenon-explained"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Porpoising",
                    "short_definition": "Porpoising is the violent up-and-down bouncing some F1 cars suffered from in 2022, caused by the car's own downforce sucking it down until the airflow underneath suddenly chokes, springing it back up — then doing it again, dozens of times a lap.",
                    "body_markdown": """The name comes from the way a porpoise or dolphin bobs up and down as it swims — and the car does something similar, at a genuinely uncomfortable rate, several times a second.

Here's the loop: [ground effect](/glossary/ground-effect) downforce gets stronger the closer the floor sits to the track, which sucks the car down even harder — but push it too close, and the airflow underneath suddenly can't keep flowing properly and "stalls," instantly killing most of the downforce. With the downforce gone, the car springs back up on its suspension — which puts the floor back in the sweet spot where downforce builds hard again, sucking it back down, and the whole cycle repeats.

For drivers, this wasn't just uncomfortable — several described it causing genuine physical pain, blurred vision, and difficulty even reading their dashboard while it was happening, at the exact moments they needed to be braking and steering precisely.""",
                },
                "es": {
                    "term": "Porpoising",
                    "short_definition": "El porpoising es el rebote violento hacia arriba y abajo que sufrieron algunos autos de F1 en 2022, causado por la propia carga aerodinámica del auto succionándolo hacia abajo hasta que el flujo de aire de golpe se ahoga, empujándolo de vuelta hacia arriba — y repitiéndose, decenas de veces por vuelta.",
                    "body_markdown": """El nombre viene de la forma en que una marsopa o un delfín se mueve hacia arriba y abajo al nadar — y el auto hace algo parecido, a un ritmo genuinamente incómodo, varias veces por segundo.

Así es el ciclo: la carga aerodinámica por [efecto suelo](/glossary/ground-effect) se vuelve más fuerte cuanto más cerca está el piso de la pista, lo que succiona al auto hacia abajo aún más fuerte — pero si se lo empuja demasiado cerca, el flujo de aire de abajo de golpe no puede seguir fluyendo bien y se "desprende", matando instantáneamente la mayor parte de la carga aerodinámica. Sin esa carga, el auto vuelve a subir por la suspensión — lo que devuelve al piso al punto óptimo donde la carga vuelve a acumularse fuerte, succionándolo de nuevo hacia abajo, y todo el ciclo se repite.

Para los pilotos, esto no era solo incómodo — varios describieron que les causaba dolor físico real, visión borrosa, y dificultad hasta para leer el tablero mientras pasaba, justo en los momentos en que necesitaban frenar y girar con precisión.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Porpoising",
                    "short_definition": "Porpoising is a self-sustaining oscillation (roughly 4-6 Hz, typically appearing between 160-180 km/h) caused by ground-effect downforce compressing the suspension until the underfloor airflow stalls, killing downforce and letting ride height spring back up to restart the cycle.",
                    "body_markdown": """**The mechanism, step by step:**
1. As speed increases, [ground-effect](/glossary/ground-effect) downforce increases with it, compressing the tyres and suspension and lowering ride height.
2. A lower ride height makes the venturi tunnels underneath work even more effectively, generating still more downforce — a positive feedback loop.
3. This continues until ride height drops below a critical threshold where the underfloor airflow can no longer stay attached — it stalls, and downforce collapses almost instantly.
4. With downforce suddenly gone, the suspension decompresses and ride height snaps back up.
5. At the higher ride height, the airflow reattaches, downforce builds again, and the whole cycle restarts — repeating at roughly 4-6 Hz, most commonly in the 160-180 km/h speed range where the car sits right at that instability threshold.

**Consequences beyond driver discomfort:** the repeated impact loading on the floor and suspension raised structural concerns, and the vibration measurably degraded a driver's ability to read instruments and brake precisely at the exact high-speed moments where precision matters most.

**FIA intervention, 2022:** rather than waiting for a full regulation rewrite, the FIA imposed an in-season technical directive from the French Grand Prix onward — an accelerometer-based bouncing limit monitored per car, with teams exceeding it required to raise ride height (sacrificing some downforce) until the oscillation stayed within the imposed limit.""",
                },
                "es": {
                    "term": "Porpoising",
                    "short_definition": "El porpoising es una oscilación autosostenida (unos 4-6 Hz, apareciendo típicamente entre 160-180 km/h) causada por la carga aerodinámica por efecto suelo comprimiendo la suspensión hasta que el flujo de aire bajo el piso se desprende, matando la carga y dejando que la altura al piso vuelva a subir de golpe para reiniciar el ciclo.",
                    "body_markdown": """**El mecanismo, paso a paso:**
1. A medida que aumenta la velocidad, la carga aerodinámica por [efecto suelo](/glossary/ground-effect) aumenta con ella, comprimiendo los neumáticos y la suspensión y bajando la altura al piso.
2. Una altura al piso más baja hace que los túneles venturi de abajo funcionen todavía mejor, generando aún más carga aerodinámica — un ciclo de retroalimentación positiva.
3. Esto continúa hasta que la altura al piso baja de un umbral crítico donde el flujo de aire bajo el piso ya no puede mantenerse adherido — se desprende, y la carga aerodinámica colapsa casi al instante.
4. Sin carga aerodinámica de golpe, la suspensión se descomprime y la altura al piso salta hacia arriba.
5. Con la altura al piso más alta, el flujo de aire se vuelve a adherir, la carga se acumula de nuevo, y todo el ciclo reinicia — repitiéndose a unos 4-6 Hz, más comúnmente en el rango de velocidad de 160-180 km/h donde el auto queda justo en ese umbral de inestabilidad.

**Consecuencias más allá de la incomodidad del piloto:** la carga de impacto repetida sobre el piso y la suspensión generó preocupaciones estructurales, y la vibración degradaba de forma medible la capacidad del piloto para leer instrumentos y frenar con precisión justo en los momentos de alta velocidad donde más importa la precisión.

**Intervención de la FIA, 2022:** en vez de esperar a una reescritura completa del reglamento, la FIA impuso una directiva técnica durante la temporada a partir del GP de Francia — un límite de rebote monitoreado por acelerómetro en cada auto, con los equipos que lo superaban obligados a subir la altura al piso (sacrificando algo de carga aerodinámica) hasta que la oscilación se mantuviera dentro del límite impuesto.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Porpoising",
                    "short_definition": "The FIA addressed porpoising in two stages: an in-season 2022 technical directive imposing an accelerometer-monitored bouncing limit under the existing regulations, followed by a structural fix in the 2026 Technical Regulations that reduces ground-effect dependence itself rather than just capping its worst symptom.",
                    "body_markdown": """**Stage one — 2022 in-season directive:** rather than rewriting the Technical Regulations mid-season (a slower, more disruptive process), the FIA used its authority to issue a technical directive imposing a maximum permitted bouncing magnitude, measured via an accelerometer fitted to each car. Teams whose cars exceeded the threshold were required to raise ride height — trading away some [ground-effect](/glossary/ground-effect) downforce — until they complied. This was a monitoring-and-compliance fix layered onto the existing floor regulations, not a redesign of the floor rules themselves.

**Stage two — 2026 structural change:** the deeper fix came with the next full regulation cycle. By reducing venturi tunnel length and increasing the proportion of genuinely flat floor, the 2026 Technical Regulations lower the ceiling on how much ground-effect downforce any legal floor design can generate in the first place — directly shrinking the physical conditions that make the porpoising feedback loop possible, rather than relying on a per-car monitoring limit to catch it after the fact.""",
                },
                "es": {
                    "term": "Porpoising",
                    "short_definition": "La FIA atacó el porpoising en dos etapas: una directiva técnica durante la temporada 2022 que impuso un límite de rebote monitoreado por acelerómetro bajo el reglamento existente, seguida de una corrección estructural en el Reglamento Técnico 2026 que reduce la dependencia del efecto suelo en sí, en vez de solo limitar su peor síntoma.",
                    "body_markdown": """**Etapa uno — directiva durante la temporada 2022:** en vez de reescribir el Reglamento Técnico a mitad de temporada (un proceso más lento y disruptivo), la FIA usó su autoridad para emitir una directiva técnica que impuso una magnitud máxima de rebote permitida, medida mediante un acelerómetro instalado en cada auto. Los equipos cuyos autos superaban el umbral debían subir la altura al piso — sacrificando algo de carga aerodinámica por [efecto suelo](/glossary/ground-effect) — hasta cumplir. Fue una corrección de monitoreo y cumplimiento montada sobre el reglamento de piso existente, no un rediseño de las reglas de piso en sí.

**Etapa dos — cambio estructural 2026:** la corrección más profunda llegó con el próximo ciclo completo de reglamento. Al reducir la longitud de los túneles venturi y aumentar la proporción de piso genuinamente plano, el Reglamento Técnico 2026 baja el techo de cuánta carga aerodinámica por efecto suelo puede generar cualquier diseño de piso legal desde el principio — reduciendo directamente las condiciones físicas que hacen posible el ciclo de retroalimentación del porpoising, en vez de depender de un límite de monitoreo por auto para detectarlo después del hecho.""",
                },
            },
        },
    },
    {
        "slug": "power-unit",
        "category": "technical",
        "related_terms": ["overtake-mode"],
        "sources": [
            {"name": "Motorsport.tech — 2026 F1 Tech Regulations in focus: the Power Unit (50+50=1000)", "url": "https://motorsport.tech/formula-1/2026-f1-tech-regulations-in-focus"},
            {"name": "Formula1.com — Pirelli confirm 2026 tyre compounds as F1 gets set for a new era of regulations", "url": "https://www.formula1.com/en/latest/article/pirelli-confirm-2026-tyre-compounds-as-f1-gets-set-for-a-new-era-of.6la0zKVsCYwWk9AAISz4Yw"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Power Unit",
                    "short_definition": "An F1 power unit is the combined engine and hybrid system that drives the car — for 2026, its electric half becomes roughly as powerful as its combustion half, a much bigger shift than the small electric boost hybrid engines had before.",
                    "body_markdown": """Think of a hybrid road car where the electric motor is mostly a fuel-saving helper, contributing a modest amount next to the gas engine's power. F1's power unit used to work a bit like that too — a strong combustion engine, with a meaningful but clearly secondary electric boost.

For 2026, that balance shifts dramatically: the combustion engine and the electric motor now each contribute roughly half the car's total power, instead of the combustion side clearly dominating. It's less "an engine with an electric assist" and more genuinely two power sources of similar size working together — a real hybrid, not a mild one.

Part of that story is what got removed rather than added: the old system had a second, hugely complex electric component tied to converting exhaust heat into power, and F1 has cut it out entirely for 2026 — simplifying the unit even as its overall electric output roughly triples.""",
                },
                "es": {
                    "term": "Unidad de Potencia (Power Unit)",
                    "short_definition": "Una unidad de potencia de F1 es el conjunto de motor y sistema híbrido que mueve al auto — para 2026, su mitad eléctrica pasa a ser casi tan potente como su mitad de combustión, un cambio mucho más grande que el pequeño impulso eléctrico que tenían antes los motores híbridos.",
                    "body_markdown": """Pensá en un auto de calle híbrido donde el motor eléctrico es sobre todo un ayudante para ahorrar combustible, aportando una cantidad moderada al lado de la potencia del motor a nafta. La unidad de potencia de F1 solía funcionar más o menos así también — un motor de combustión fuerte, con un impulso eléctrico significativo pero claramente secundario.

Para 2026, ese equilibrio cambia drásticamente: el motor de combustión y el motor eléctrico ahora aportan cada uno cerca de la mitad de la potencia total del auto, en vez de que el lado de combustión domine claramente. Es menos "un motor con asistencia eléctrica" y más genuinamente dos fuentes de potencia de tamaño similar trabajando juntas — un híbrido real, no uno leve.

Parte de esa historia es lo que se sacó en vez de agregarse: el sistema viejo tenía un segundo componente eléctrico enormemente complejo ligado a convertir el calor del escape en potencia, y la F1 lo eliminó por completo para 2026 — simplificando la unidad aunque su salida eléctrica total se triplique más o menos.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Power Unit",
                    "short_definition": "The 2026 power unit pairs a roughly 540bhp internal combustion engine with an MGU-K boosted from 120kW to 350kW (roughly 470bhp) for a near-50/50 power split totaling around 1000bhp, while eliminating the MGU-H entirely — a major simplification alongside the electric-power increase.",
                    "body_markdown": """**The split:** the 1.6-litre turbo V6 internal combustion engine (ICE) contributes roughly 540bhp, while the MGU-K (Motor Generator Unit - Kinetic, the electric motor tied to the drivetrain) is boosted to roughly 350kW — around 470bhp — for a combined output near 1000bhp split almost evenly between combustion and electric power, a sharp change from earlier hybrid-era units where the electric contribution was a smaller fraction of the total.

**What's gone — the MGU-H:** the Motor Generator Unit - Heat, which recovered energy from exhaust gas and turbocharger spin, is removed entirely for 2026. It was effective but extremely complex and expensive to develop — removing it simplifies the power unit considerably, even as the MGU-K's much larger output picks up more of the energy-recovery and power-delivery role on its own.

**Why manufacturers cared:** the MGU-H's complexity was widely cited as a barrier to entry — it required deep, expensive expertise that discouraged new manufacturers from joining. Removing it, alongside the shift to a more conventional (if far more powerful) electric motor architecture, was a deliberate design choice tied to attracting new power-unit suppliers to the sport for the 2026 rules cycle.

**Connection to overtaking:** the much larger MGU-K output is also the power source behind [Overtake Mode](/glossary/overtake-mode) — the proximity-gated power boost that replaced DRS. The 2026 power unit wasn't just upgraded for outright performance; its bigger electric motor was specifically sized with that overtaking-assist role in mind.""",
                },
                "es": {
                    "term": "Unidad de Potencia (Power Unit)",
                    "short_definition": "La unidad de potencia 2026 combina un motor de combustión interna de unos 540bhp con una MGU-K potenciada de 120kW a 350kW (unos 470bhp) para un reparto casi 50/50 que totaliza cerca de 1000bhp, mientras elimina por completo la MGU-H — una simplificación grande junto con el aumento de potencia eléctrica.",
                    "body_markdown": """**El reparto:** el motor de combustión interna (ICE) turbo V6 de 1.6 litros aporta unos 540bhp, mientras que la MGU-K (Motor Generator Unit - Kinetic, el motor eléctrico ligado al tren motriz) se potencia a unos 350kW — cerca de 470bhp — para una salida combinada cercana a los 1000bhp repartida casi por igual entre potencia de combustión y eléctrica, un cambio marcado respecto a unidades de la era híbrida anterior donde el aporte eléctrico era una fracción más chica del total.

**Lo que desaparece — la MGU-H:** la Motor Generator Unit - Heat, que recuperaba energía del gas de escape y del giro del turbocompresor, se elimina por completo para 2026. Era efectiva pero extremadamente compleja y cara de desarrollar — quitarla simplifica considerablemente la unidad de potencia, aunque la salida mucho mayor de la MGU-K asuma sola más del rol de recuperación de energía y entrega de potencia.

**Por qué le importaba a los fabricantes:** la complejidad de la MGU-H se citaba ampliamente como una barrera de entrada — requería un conocimiento técnico profundo y caro que desalentaba a fabricantes nuevos de sumarse. Eliminarla, junto con el giro hacia una arquitectura de motor eléctrico más convencional (aunque mucho más potente), fue una decisión de diseño deliberada ligada a atraer nuevos proveedores de unidades de potencia al deporte para el ciclo de reglamento 2026.

**Conexión con adelantar:** la salida mucho mayor de la MGU-K es también la fuente de potencia detrás de [Overtake Mode](/glossary/overtake-mode) — el impulso de potencia condicionado por proximidad que reemplazó al DRS. La unidad de potencia 2026 no se mejoró solo por rendimiento puro; su motor eléctrico más grande se dimensionó específicamente pensando en ese rol de asistencia para adelantar.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Power Unit",
                    "short_definition": "The 2026 power unit specifications are defined in the FIA Technical Regulations, which explicitly state cost reduction and attracting new manufacturers as design goals alongside the roughly 50/50 combustion-electric power split and the removal of the MGU-H.",
                    "body_markdown": """The FIA's regulatory rationale for the 2026 power unit rules goes beyond pure performance targets — the published goals explicitly include reducing development cost and complexity, and making the formula attractive enough to draw new manufacturers into F1 for the new rules cycle.

**Cost and complexity as a stated regulatory goal:** the MGU-H's removal is the clearest expression of this — it was regulated out not because it was ineffective, but because its cost and engineering complexity were judged to outweigh its performance contribution relative to simply enlarging the MGU-K instead. This is a deliberate regulatory trade-off between raw technical sophistication and a healthier, more open manufacturer field.

**New manufacturer entry:** the simplified, less MGU-H-dependent formula was cited as a factor in new manufacturers committing to F1 power unit supply for the 2026 rules cycle — a direct example of technical regulations being shaped with the sport's commercial and competitive health in mind, not just outright lap time.

**Standardized elements:** alongside the bespoke ICE and MGU-K, the regulations also standardize certain electrical and control components across manufacturers, a further cost-control measure — a supplier can't out-develop rivals on parts the regulations require to be common, concentrating competition on the areas the FIA wants manufacturers to differentiate on.""",
                },
                "es": {
                    "term": "Unidad de Potencia (Power Unit)",
                    "short_definition": "Las especificaciones de la unidad de potencia 2026 están definidas en el Reglamento Técnico de la FIA, que declara explícitamente la reducción de costos y la atracción de nuevos fabricantes como objetivos de diseño, junto con el reparto de potencia combustión-eléctrica casi 50/50 y la eliminación de la MGU-H.",
                    "body_markdown": """El fundamento regulatorio de la FIA para las reglas de unidad de potencia 2026 va más allá de objetivos de rendimiento puro — los objetivos publicados incluyen explícitamente reducir el costo y la complejidad de desarrollo, y hacer que la fórmula sea lo suficientemente atractiva como para atraer nuevos fabricantes a la F1 para el nuevo ciclo de reglamento.

**Costo y complejidad como objetivo regulatorio declarado:** la eliminación de la MGU-H es la expresión más clara de esto — se sacó del reglamento no porque fuera inefectiva, sino porque su costo y complejidad de ingeniería se consideraron mayores que su aporte de rendimiento en comparación con simplemente agrandar la MGU-K en su lugar. Es una decisión regulatoria deliberada entre sofisticación técnica bruta y un campo de fabricantes más sano y abierto.

**Entrada de nuevos fabricantes:** la fórmula simplificada, menos dependiente de la MGU-H, se citó como un factor en que nuevos fabricantes se comprometieran a proveer unidades de potencia a la F1 para el ciclo de reglamento 2026 — un ejemplo directo de reglamento técnico moldeado pensando en la salud comercial y competitiva del deporte, no solo en el tiempo de vuelta puro.

**Elementos estandarizados:** junto con el ICE y la MGU-K de diseño propio, el reglamento también estandariza ciertos componentes eléctricos y de control entre fabricantes, una medida más de control de costos — un proveedor no puede desarrollar más que sus rivales en piezas que el reglamento exige que sean comunes, concentrando la competencia en las áreas donde la FIA quiere que los fabricantes se diferencien.""",
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
