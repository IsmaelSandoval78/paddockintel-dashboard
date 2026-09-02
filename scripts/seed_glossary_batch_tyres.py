#!/usr/bin/env python3
"""Fifth and final glossary batch (category: tyres) -- tyre-compounds,
tyre-blankets. Same layered format validated by the undercut pilot. EN+ES
only. Seeds as 'draft'.

Note on tyre-blankets: the original roadmap candidate list assumed a "tyre
blanket ban" for 2026 -- verified false during research. The ban was aimed
at 2024, then repeatedly postponed; as of 2026 blankets remain legal under
Article C10.8.4, and the actual 2026 change closes loopholes on *other*
tyre-heating/cooling tricks. Content below reflects the verified reality,
not the assumption."""

import os
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "tyre-compounds",
        "category": "tyres",
        "related_terms": ["undercut", "overcut"],
        "sources": [
            {"name": "Autosport — F1 tyres explained: what are the Pirelli compounds and 2024 rules", "url": "https://www.autosport.com/f1/news/f1-tyres-what-are-the-compounds-and-what-do-they-mean/10344284/"},
            {"name": "Formula1.com — Pirelli confirm 2026 tyre compounds as F1 gets set for a new era of regulations", "url": "https://www.formula1.com/en/latest/article/pirelli-confirm-2026-tyre-compounds-as-f1-gets-set-for-a-new-era-of.6la0zKVsCYwWk9AAISz4Yw"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Tyre Compounds",
                    "short_definition": "F1's dry-weather tyres come in three color-coded compounds each race weekend — Soft (red), Medium (yellow), Hard (white) — trading grip for durability, plus wet-weather Intermediate (green) and Full Wet (blue) tyres for rain.",
                    "body_markdown": """It's the same tradeoff as choosing running shoes: softer, grippier rubber accelerates faster and corners better, like a spiked track shoe — but it wears out quickly. Harder rubber lasts much longer, more like a durable trail shoe, but never grips quite as well as the soft option fresh out of the box.

Pirelli, F1's sole tyre supplier, brings five dry compounds ranging from hardest (C1) to softest (C5), but only picks three for any given race weekend — always labeled Soft, Medium, and Hard regardless of which of the five underlying compounds they actually are. That's a genuinely confusing wrinkle for new fans: a "Medium" at one track and a "Medium" at another aren't the same rubber compound at all — the labels are relative to what's available *that weekend*, not a fixed recipe.

When it rains, a separate pair of tyres takes over: green-banded Intermediates for a damp but not soaked track, and blue-banded Full Wets, with deep tread grooves to channel standing water, for genuinely heavy rain.""",
                },
                "es": {
                    "term": "Compuestos de Neumático (Tyre Compounds)",
                    "short_definition": "Los neumáticos secos de F1 vienen en tres compuestos con código de color cada fin de semana de carrera — Blando (rojo), Medio (amarillo), Duro (blanco) — que cambian agarre por durabilidad, más los neumáticos de lluvia Intermedio (verde) y Extremo Mojado (azul).",
                    "body_markdown": """Es el mismo dilema que elegir zapatillas para correr: la goma más blanda y con más agarre acelera más rápido y toma mejor las curvas, como una zapatilla de clavos de pista — pero se gasta rápido. La goma más dura dura mucho más, más parecida a una zapatilla de trekking resistente, pero nunca agarra tan bien como la blanda recién estrenada.

Pirelli, el proveedor único de neumáticos de F1, trae cinco compuestos secos que van del más duro (C1) al más blando (C5), pero solo elige tres para cada fin de semana de carrera puntual — siempre etiquetados como Blando, Medio y Duro sin importar cuál de los cinco compuestos de base sean en realidad. Es un detalle genuinamente confuso para los fans nuevos: un "Medio" en un circuito y un "Medio" en otro no son para nada el mismo compuesto de goma — las etiquetas son relativas a lo que está disponible *ese fin de semana*, no una receta fija.

Cuando llueve, entra un par de neumáticos separado: los de banda verde Intermedios para una pista húmeda pero no empapada, y los de banda azul Extremo Mojado, con ranuras de dibujo profundas para canalizar el agua acumulada, para lluvia genuinamente fuerte.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Tyre Compounds",
                    "short_definition": "Pirelli's dry range spans five compounds (C1 hardest to C5 softest); three are selected per event and relabeled Soft/Medium/Hard regardless of their underlying C-number, so the same C3 compound might be the softest option available at one circuit and the hardest at another.",
                    "body_markdown": """**Why relative labeling exists:** track surfaces, temperatures, and layouts vary enormously — a compound that's comfortably durable at a smooth, low-energy circuit might degrade dangerously fast at an abrasive, high-load one. Rather than forcing every circuit to use the same absolute compound numbers, Pirelli selects the three C-compounds best suited to each event's specific demands, then labels them Soft/Medium/Hard purely by their relative order that weekend. A "Hard" at a compound-punishing track like Silverstone could be a softer C-number than a "Soft" at a gentler circuit like Monaco.

**The degradation/grip tradeoff:** softer compounds (higher C-number) generate more mechanical grip through greater rubber deformation, but that same deformation generates more heat and wears the tread faster — the core physical tradeoff underlying every [undercut](/glossary/undercut) and [overcut](/glossary/overcut) strategy call.

**Race requirement:** every dry Grand Prix requires each driver to use at least two of the three available dry compounds across the race, forcing at least one strategic decision about when to switch and to which compound — teams that could simply run the softest tyre the whole way would remove the entire strategic layer these rules are designed to preserve.""",
                },
                "es": {
                    "term": "Compuestos de Neumático (Tyre Compounds)",
                    "short_definition": "La gama seca de Pirelli abarca cinco compuestos (C1 el más duro a C5 el más blando); se seleccionan tres por evento y se reetiquetan como Blando/Medio/Duro sin importar su número C de base, así que el mismo compuesto C3 puede ser la opción más blanda disponible en un circuito y la más dura en otro.",
                    "body_markdown": """**Por qué existe el etiquetado relativo:** las superficies, temperaturas y trazados de pista varían enormemente — un compuesto que es cómodamente durable en un circuito suave y de baja exigencia podría degradarse peligrosamente rápido en uno abrasivo y de mucha carga. En vez de forzar a cada circuito a usar los mismos números de compuesto absolutos, Pirelli selecciona los tres compuestos C más adecuados para las exigencias específicas de cada evento, y después los etiqueta Blando/Medio/Duro puramente por su orden relativo ese fin de semana. Un "Duro" en un circuito exigente para los compuestos como Silverstone podría ser un número C más blando que un "Blando" en un circuito más suave como Mónaco.

**El dilema degradación/agarre:** los compuestos más blandos (número C más alto) generan más agarre mecánico por mayor deformación de la goma, pero esa misma deformación genera más calor y desgasta el dibujo más rápido — el dilema físico de fondo detrás de cada decisión estratégica de [undercut](/glossary/undercut) y [overcut](/glossary/overcut).

**Requisito de carrera:** todo Gran Premio en seco exige que cada piloto use al menos dos de los tres compuestos secos disponibles durante la carrera, forzando al menos una decisión estratégica sobre cuándo cambiar y a qué compuesto — equipos que pudieran simplemente correr con el compuesto más blando todo el tiempo eliminarían por completo la capa estratégica que estas reglas están diseñadas para preservar.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Tyre Compounds",
                    "short_definition": "Pirelli operates as F1's regulated sole tyre supplier under an FIA/Formula One Management agreement, with the mandatory two-compound-per-dry-race rule set out in the Sporting Regulations and each event's specific compound selection communicated to teams well ahead of the race weekend.",
                    "body_markdown": """**Sole-supplier structure:** F1 tyres aren't a competitive category between manufacturers — Pirelli supplies every team under a single commercial and technical agreement, a deliberate regulatory choice to remove tyre performance as a variable teams compete on independently, keeping the competitive focus on car design and driver performance instead.

**Compound selection process:** for each event, Pirelli proposes and the FIA approves which three of the five dry compounds (C1-C5) will be available, based on data from prior seasons at that circuit, simulation work, and (where relevant) a pre-season test session — this selection is finalized and published well before the race weekend, not decided on the day.

**The mandatory-use rule:** the requirement to use at least two different dry compounds during a dry race is written directly into the Sporting Regulations, with an exception only for races declared wet, where the mandatory-compound requirement is suspended and intermediate/full-wet tyres can be used without the two-compound obligation applying.""",
                },
                "es": {
                    "term": "Compuestos de Neumático (Tyre Compounds)",
                    "short_definition": "Pirelli opera como proveedor único regulado de neumáticos de F1 bajo un acuerdo con la FIA/Formula One Management, con la regla de dos compuestos obligatorios por carrera en seco fijada en el Reglamento Deportivo y la selección específica de compuestos de cada evento comunicada a los equipos con bastante anticipación al fin de semana de carrera.",
                    "body_markdown": """**Estructura de proveedor único:** los neumáticos de F1 no son una categoría competitiva entre fabricantes — Pirelli abastece a cada equipo bajo un único acuerdo comercial y técnico, una decisión regulatoria deliberada para eliminar el rendimiento del neumático como una variable en la que los equipos compitan de forma independiente, manteniendo el foco competitivo en el diseño del auto y el rendimiento del piloto.

**Proceso de selección de compuestos:** para cada evento, Pirelli propone y la FIA aprueba cuáles de los cinco compuestos secos (C1-C5) van a estar disponibles, basándose en datos de temporadas anteriores en ese circuito, trabajo de simulación y, cuando corresponde, una sesión de test de pretemporada — esta selección se finaliza y publica bastante antes del fin de semana de carrera, no se decide el día de la carrera.

**La regla de uso obligatorio:** el requisito de usar al menos dos compuestos secos distintos durante una carrera en seco está escrito directamente en el Reglamento Deportivo, con una excepción solo para carreras declaradas mojadas, donde el requisito de compuesto obligatorio se suspende y se pueden usar neumáticos intermedios o extremo mojado sin que aplique la obligación de dos compuestos.""",
                },
            },
        },
    },
    {
        "slug": "tyre-blankets",
        "category": "tyres",
        "related_terms": ["tyre-compounds"],
        "sources": [
            {"name": "The Race — F1 tightens 2026 rules to close off tyre cooling tricks", "url": "https://www.the-race.com/formula-1/f1-adjusts-2026-rules-to-close-off-tyre-cooling-tricks/"},
            {"name": "ESPN — F1 agrees to postpone tyre blanket ban, allow engine equalisation", "url": "https://www.espn.com/f1/story/_/id/38087468/f1-agrees-postpone-tyre-blanket-ban-allow-engine-equalisation"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Tyre Blankets",
                    "short_definition": "Tyre blankets are electric heating wraps that pre-warm a tyre before it's fitted to the car, so a driver has usable grip from the very first corner instead of having to warm cold rubber up on track. Despite years of talk about banning them, they're still legal in F1 for 2026.",
                    "body_markdown": """A cold F1 tyre is a genuinely dangerous thing — with almost no grip until it reaches its working temperature, a driver pushing hard on cold rubber right out of the pits risks losing the car entirely. Tyre blankets solve that by heating the tyre electrically to close to racing temperature *before* it ever touches the track, so a driver gets real grip from the first lap of a stint rather than gambling their way through a cold, slippery one.

Here's the twist most fans don't know: F1 has talked about banning tyre blankets for years, on cost and sustainability grounds — and if you've heard "F1 is banning tyre blankets," you're remembering a real, repeatedly-discussed plan. But it kept getting postponed after drivers and Pirelli raised safety concerns about racing on genuinely cold tyres, and as of the 2026 season, tyre blankets are still fully legal. What actually changed for 2026 isn't a ban on blankets — it's new rules closing off *other* creative ways teams had found to warm or cool tyres and brakes outside the officially permitted blanket.""",
                },
                "es": {
                    "term": "Mantas Térmicas (Tyre Blankets)",
                    "short_definition": "Las mantas térmicas son envoltorios de calefacción eléctrica que precalientan un neumático antes de ponerlo en el auto, así el piloto tiene agarre útil desde la primera curva en vez de tener que calentar goma fría en pista. Pese a años de rumores sobre prohibirlas, siguen siendo legales en F1 para 2026.",
                    "body_markdown": """Un neumático frío de F1 es algo genuinamente peligroso — con casi nada de agarre hasta que llega a su temperatura de trabajo, un piloto que fuerza sobre goma fría apenas sale de boxes arriesga perder el auto por completo. Las mantas térmicas resuelven eso calentando el neumático eléctricamente hasta cerca de la temperatura de carrera *antes* de que toque la pista, así el piloto tiene agarre real desde la primera vuelta de un stint en vez de jugársela en una vuelta fría y resbaladiza.

Acá está el giro que la mayoría de los fans no conoce: la F1 viene hablando de prohibir las mantas térmicas desde hace años, por motivos de costo y sostenibilidad — y si escuchaste que "la F1 va a prohibir las mantas térmicas", te acordás de un plan real, discutido varias veces. Pero se fue posponiendo después de que pilotos y Pirelli plantearan preocupaciones de seguridad por correr con neumáticos genuinamente fríos, y en la temporada 2026, las mantas térmicas siguen siendo completamente legales. Lo que realmente cambió para 2026 no es una prohibición de las mantas — son reglas nuevas que cierran *otras* formas creativas que los equipos habían encontrado para calentar o enfriar neumáticos y frenos por fuera de la manta oficialmente permitida.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Tyre Blankets",
                    "short_definition": "A full ban on tyre blankets was planned for 2024, then repeatedly postponed after driver and Pirelli safety concerns over cold-tyre grip and pressure swings exceeding 12psi from cold to hot; blankets remain legal for 2026, with the actual regulatory change closing loopholes on non-blanket heating/cooling tricks instead.",
                    "body_markdown": """**Why a ban was ever proposed:** removing tyre blankets was originally tied to F1's broader push on cost and sustainability — blankets require significant electrical power at every race, and eliminating pre-heating would also push Pirelli toward developing [compounds](/glossary/tyre-compounds) that work safely across a wider temperature range, arguably improving racing in cooler or changeable conditions where teams currently lean heavily on blanket-assisted warm-up.

**Why it kept getting postponed:** a genuinely cold tyre has dramatically less grip and a pressure swing that can exceed 12psi between cold and racing temperature — drivers, including reigning champions, raised direct safety concerns about warming tyres purely through on-track driving with cars this powerful, and Pirelli's own compound development for a no-blanket world wasn't judged ready in time for the originally planned 2024 introduction. Each postponement pushed the target further out rather than resolving the underlying concern.

**What actually changed for 2026:** rather than banning blankets, the FIA tightened the regulations around everything *else* teams might use to manage tyre or brake temperature. Blankets that meet the design specification remain the only permitted heating device — any other system, device, or procedure (besides simply driving the car) intended to heat or maintain hub or brake temperature above ambient is now explicitly prohibited, closing off cooling and heating tricks teams had found around the edges of the existing rules.""",
                },
                "es": {
                    "term": "Mantas Térmicas (Tyre Blankets)",
                    "short_definition": "Se planeó una prohibición total de las mantas térmicas para 2024, después pospuesta varias veces por preocupaciones de seguridad de pilotos y Pirelli sobre el agarre con neumáticos fríos y cambios de presión de más de 12psi entre frío y caliente; las mantas siguen siendo legales para 2026, y el cambio regulatorio real cierra trucos de calentamiento/enfriamiento por fuera de la manta.",
                    "body_markdown": """**Por qué se propuso alguna vez una prohibición:** eliminar las mantas térmicas estuvo originalmente ligado al impulso más amplio de la F1 en costos y sostenibilidad — las mantas requieren energía eléctrica significativa en cada carrera, y eliminar el precalentamiento también empujaría a Pirelli a desarrollar [compuestos](/glossary/tyre-compounds) que funcionen de forma segura en un rango de temperatura más amplio, mejorando potencialmente las carreras en condiciones más frías o cambiantes donde hoy los equipos dependen mucho del calentamiento asistido por manta.

**Por qué se fue posponiendo:** un neumático genuinamente frío tiene dramáticamente menos agarre y un cambio de presión que puede superar los 12psi entre frío y temperatura de carrera — pilotos, incluidos campeones vigentes, plantearon preocupaciones de seguridad directas sobre calentar neumáticos solo manejando en pista con autos de esta potencia, y el propio desarrollo de compuestos de Pirelli para un mundo sin mantas no se consideró listo a tiempo para la introducción originalmente planeada en 2024. Cada postergación empujó el objetivo más lejos en vez de resolver la preocupación de fondo.

**Qué cambió realmente para 2026:** en vez de prohibir las mantas, la FIA endureció el reglamento sobre todo lo *demás* que los equipos pudieran usar para manejar la temperatura de neumáticos o frenos. Las mantas que cumplen la especificación de diseño siguen siendo el único dispositivo de calentamiento permitido — cualquier otro sistema, dispositivo o procedimiento (además de simplemente manejar el auto) destinado a calentar o mantener la temperatura de los cubos o los frenos por encima de la ambiente ahora está explícitamente prohibido, cerrando trucos de enfriamiento y calentamiento que los equipos habían encontrado en los bordes del reglamento existente.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Tyre Blankets",
                    "short_definition": "Tyre blankets meeting the design specification in Article C10.8.4 remain the sole permitted heating device under the 2026 Technical Regulations, which added a new prohibition on any other heating or temperature-maintaining device or procedure, plus a separate amendment (Article 3.17.1) requiring suspension fairings to be internally sealed against airflow tricks.",
                    "body_markdown": """**What Article C10.8.4 actually permits:** the regulations don't ban tyre heating outright — they narrowly define the one device allowed to do it. A tyre blanket that conforms to the article's design prescriptions is legal; the regulations then close off everything else by explicitly prohibiting any other device, system, or procedure — aside from the simple act of driving the car — whose purpose or effect is to heat hubs or brakes above ambient temperature, or to maintain their temperature once warm.

**Why the rule targets hubs and brakes, not just tyres directly:** teams had reportedly found ways to indirectly manage tyre temperature by controlling the temperature of adjacent components like wheel hubs and brakes, effectively working around a blanket-only rule without technically heating the tyre itself. Regulating hub and brake temperature closes that indirect route.

**The related suspension fairing amendment:** Article 3.17.1 was separately amended to require suspension fairings to be internally sealed against airflow, closing off a different loophole where internal airflow through suspension components could be used to influence temperature in ways the regulations hadn't previously addressed.

**Status going forward:** as of the 2026 regulations, an outright tyre blanket ban is not in force — the FIA's approach has shifted from removing the permitted heating device to tightly regulating everything adjacent to it. Whether a full ban returns in a future regulation cycle remains an open question the sport has revisited multiple times without resolving.""",
                },
                "es": {
                    "term": "Mantas Térmicas (Tyre Blankets)",
                    "short_definition": "Las mantas térmicas que cumplen la especificación de diseño del Artículo C10.8.4 siguen siendo el único dispositivo de calentamiento permitido bajo el Reglamento Técnico 2026, que agregó una prohibición nueva sobre cualquier otro dispositivo o procedimiento de calentamiento o mantenimiento de temperatura, más una enmienda separada (Artículo 3.17.1) que exige que los carenados de suspensión estén sellados internamente contra trucos de flujo de aire.",
                    "body_markdown": """**Qué permite realmente el Artículo C10.8.4:** el reglamento no prohíbe el calentamiento de neumáticos de forma directa — define de forma acotada el único dispositivo permitido para hacerlo. Una manta térmica que cumple las especificaciones de diseño del artículo es legal; el reglamento después cierra todo lo demás prohibiendo explícitamente cualquier otro dispositivo, sistema o procedimiento — aparte del simple acto de manejar el auto — cuyo propósito o efecto sea calentar cubos o frenos por encima de la temperatura ambiente, o mantener su temperatura una vez calientes.

**Por qué la regla apunta a cubos y frenos, no solo a los neumáticos directamente:** se reportó que los equipos habían encontrado formas de manejar indirectamente la temperatura del neumático controlando la temperatura de componentes adyacentes como los cubos de rueda y los frenos, esquivando en la práctica una regla de "solo manta" sin calentar técnicamente el neumático en sí. Regular la temperatura de cubos y frenos cierra esa vía indirecta.

**La enmienda relacionada de carenados de suspensión:** el Artículo 3.17.1 se enmendó por separado para exigir que los carenados de suspensión estén sellados internamente contra el flujo de aire, cerrando un resquicio distinto donde el flujo de aire interno a través de componentes de suspensión podía usarse para influir en la temperatura de formas que el reglamento no había atendido antes.

**Estado hacia adelante:** con el reglamento 2026, una prohibición total de mantas térmicas no está vigente — el enfoque de la FIA pasó de eliminar el dispositivo de calentamiento permitido a regular estrictamente todo lo que lo rodea. Si una prohibición completa vuelve en un futuro ciclo de reglamento sigue siendo una pregunta abierta que el deporte revisó varias veces sin resolver.""",
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
