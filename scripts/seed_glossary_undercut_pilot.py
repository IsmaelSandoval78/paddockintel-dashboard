#!/usr/bin/env python3
"""Pilot for the new layered glossary format (eli5/technical/fia depths).
Seeds as status='draft' -- review at /glossary/undercut before flipping to
'published' (UPDATE glossary_terms SET status='published', published_at=now()
WHERE slug='undercut'). EN+ES only per the language-rollout decision.

Depends on migration 20260902191345_glossary_terms_depth_layers.sql being
applied first (adds the `depth` column + unique(locale, slug, depth))."""

import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

SLUG = "undercut"
CATEGORY = "strategy"
RELATED_TERMS = ["overcut", "parc-ferme"]
SOURCES = [
    {"name": "Motorsport.com — F1 strategy explained: undercut, overcut, DRS trains", "url": "https://www.motorsport.com/f1/news/f1-strategy-explained-whats-an-undercut-overcut-a-drs-train-and-more/10500434/"},
    {"name": "F1 Chronicle — How the undercut works in Formula 1", "url": "https://f1chronicle.com/how-the-undercut-works-in-formula-1/"},
    {"name": "FIA — 2026 Formula 1 Sporting Regulations, Section B (Article B1.6.2, pit release)", "url": "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_05_-_2026-02-27.pdf"},
]

LAYERS = {
    "eli5": {
        "en": {
            "term": "Undercut",
            "short_definition": "The undercut is a pit stop timed to happen before a rival's — a driver pits early, gets fresh tyres, and uses their extra grip to jump ahead once the rival finally stops too.",
            "body_markdown": """Think of it like stealing a base in baseball: you make your move early, while your rival is still committed to their current play. By the time they react, you've already gained the ground you needed.

In F1 terms — imagine two drivers running close together, both on tyres that are past their best. The one behind pits first. For a lap or two, they're running dead last of the pair, still in the pit lane and then rejoining behind. But their tyres are brand new, and new tyres are *fast*. While the driver still out on track is nursing worn-out rubber, the pitted driver rips off one or two very quick laps.

By the time the driver in front finally makes their own pit stop, the gap has swung. The car that pitted first — the "undercutter" — comes out of the pits ahead, without ever actually passing the other car on track.

**A real example:** at the 2019 Singapore Grand Prix, Sebastian Vettel ran third, behind Charles Leclerc and Lewis Hamilton. Vettel's team pitted him first. His fresh-tyre out-lap was so much quicker than the cars ahead were managing on old tyres that when Leclerc and Hamilton finally stopped, Vettel was already through — for what turned out to be the last win of his career.

The catch: it only works if the fresh tyres are genuinely faster right away, and if the pit crew doesn't fumble the stop. Get either wrong, and the driver just loses track position for nothing.""",
        },
        "es": {
            "term": "Undercut",
            "short_definition": "El undercut es una parada en boxes anticipada respecto a un rival: el piloto para antes, pone gomas nuevas, y usa ese agarre extra para meterse adelante cuando el rival finalmente también para.",
            "body_markdown": """Es como robar una base en béisbol: hacés tu jugada temprano, mientras tu rival todavía está comprometido con su jugada actual. Para cuando reacciona, vos ya ganaste el terreno que necesitabas.

En términos de F1: imaginate dos pilotos corriendo cerca, ambos con gomas ya gastadas. El de atrás para primero. Por una vuelta o dos, va última posición del par, todavía en el pit lane y después reincorporándose atrás. Pero sus gomas son nuevas, y las gomas nuevas son *rápidas*. Mientras el piloto que sigue en pista administra gomas gastadas, el que paró mete una o dos vueltas muy rápidas.

Para cuando el piloto de adelante finalmente hace su propia parada, la diferencia ya cambió. El auto que paró primero — el que hizo el "undercut" — sale de boxes adelante, sin haber pasado al otro auto en pista ni una sola vez.

**Un ejemplo real:** en el GP de Singapur 2019, Sebastian Vettel corría tercero, detrás de Charles Leclerc y Lewis Hamilton. Su equipo lo hizo parar primero. Su vuelta de salida con gomas nuevas fue tan rápida comparada con lo que hacían los autos de adelante con gomas viejas que, cuando Leclerc y Hamilton finalmente pararon, Vettel ya los había pasado — en lo que terminó siendo la última victoria de su carrera.

El riesgo: solo funciona si las gomas nuevas son realmente más rápidas de entrada, y si el equipo no falla la parada. Si algo de eso sale mal, el piloto pierde posición en pista sin ganar nada a cambio.""",
        },
    },
    "technical": {
        "en": {
            "term": "Undercut",
            "short_definition": "The undercut is a strategic pit stop taken before a rival's, exploiting the pace differential between fresh and degraded tyres to gain net track position without an on-track pass.",
            "body_markdown": """The undercut works because of tyre degradation curves, not raw pit stop speed. Every tyre compound loses grip over a stint — gradually at first, then sharply once it crosses a wear threshold specific to that compound and track surface. A driver on a fresh set is running near peak pace; a driver on a stint-old set is losing time every lap, often 0.3–1.0s/lap or more depending on the circuit and compound.

**The mechanics of the swing:**
1. Car A (behind) pits. Loses ~20–25 seconds in the pit lane (stationary time + pit lane speed limit transit) but rejoins on a fresh, fast tyre.
2. Car B (ahead) stays out, still on the degrading tyre, for one or more additional laps.
3. Car A's "out-lap" and following laps on fresh rubber are significantly faster than Car B's remaining laps on old rubber — this is the "undercut window," typically most powerful for 1–3 laps immediately after the stop.
4. When Car B eventually pits, the accumulated pace deficit from those laps may exceed the pit-stop time loss itself — meaning Car A can emerge ahead in the pit lane or on the following lap, without ever overtaking on track.

**When it's strongest:** high-degradation tracks (abrasive asphalt, high tyre wear compounds, hot track temperatures) amplify the effect — the faster tyres degrade, the bigger the swing from being on fresher rubber. Tracks where overtaking is genuinely difficult (low-drag, narrow corners) also favor the undercut, since gaining position via pit strategy avoids the risk of a wheel-to-wheel move.

**The counter — overcut:** a team can defend against an undercut by doing the opposite: staying out longer than the pursuing car, banking on track position and clean air outweighing the tyre-age penalty, then pitting later onto tyres that are fresh for the remaining laps. Whether undercut or overcut wins is a live strategic bet made in real time, using live gap data and tyre-model predictions — teams don't know for certain which will work until the pit stops actually happen.""",
        },
        "es": {
            "term": "Undercut",
            "short_definition": "El undercut es una parada en boxes estratégica hecha antes que la de un rival, que explota la diferencia de ritmo entre gomas nuevas y gastadas para ganar posición neta sin pasar en pista.",
            "body_markdown": """El undercut funciona por las curvas de degradación de neumáticos, no por la velocidad de la parada en sí. Cada compuesto de goma pierde agarre durante un stint — al principio de forma gradual, después de forma abrupta al cruzar un umbral de desgaste específico de ese compuesto y esa superficie. Un piloto con gomas nuevas corre cerca de su ritmo máximo; uno con gomas de varias vueltas pierde tiempo cada vuelta, a menudo 0,3–1,0 s/vuelta o más según el circuito y el compuesto.

**La mecánica del cambio:**
1. El Auto A (atrás) para en boxes. Pierde unos 20-25 segundos en el pit lane (tiempo detenido + tránsito al límite de velocidad del pit lane) pero vuelve a pista con goma nueva y rápida.
2. El Auto B (adelante) sigue en pista, todavía con la goma degradándose, una o más vueltas más.
3. La vuelta de salida del Auto A y las siguientes con goma nueva son notablemente más rápidas que las vueltas restantes del Auto B con goma vieja — esta es la "ventana del undercut", típicamente más fuerte durante 1-3 vueltas inmediatamente después de la parada.
4. Cuando el Auto B finalmente para, el déficit de ritmo acumulado en esas vueltas puede superar la propia pérdida de tiempo de la parada — es decir, el Auto A puede salir adelante en el pit lane o en la vuelta siguiente, sin haber pasado nunca en pista.

**Cuándo es más fuerte:** circuitos de alta degradación (asfalto abrasivo, compuestos de mucho desgaste, altas temperaturas de pista) amplifican el efecto — cuanto más rápido se degradan las gomas, mayor el cambio por tener goma más nueva. Circuitos donde adelantar es genuinamente difícil (poca resistencia al aire, curvas angostas) también favorecen el undercut, porque ganar posición por estrategia evita el riesgo de un cruce rueda a rueda.

**La respuesta — overcut:** un equipo puede defenderse de un undercut haciendo lo opuesto: quedarse en pista más tiempo que el auto que lo persigue, apostando a que la posición en pista y el aire limpio pesen más que la penalización de goma vieja, y parando después con gomas frescas para las vueltas restantes. Que gane el undercut o el overcut es una apuesta estratégica que se toma en tiempo real, con datos de diferencia en vivo y modelos predictivos de neumáticos — los equipos no saben con certeza cuál va a funcionar hasta que las paradas realmente suceden.""",
        },
    },
    "fia": {
        "en": {
            "term": "Undercut",
            "short_definition": "The undercut itself isn't a regulated maneuver — the FIA doesn't govern pit strategy — but two rules directly shape how aggressively teams can execute one: the pit lane speed limit and the unsafe release rule.",
            "body_markdown": """There's no FIA rule that mentions "undercut" by name — it's a strategic choice, not a regulated procedure. But the undercut only works within the boundaries of two Sporting Regulations that constrain every pit stop, undercut or not.

**Pit lane speed limit (Article B, Sporting Regulations):** every car is limited to a fixed speed through the pit lane — 80 km/h at most circuits, reduced to 60 km/h at a handful of tighter venues. This limit applies for the *entire* pit lane transit, both entering and exiting. It exists purely for the safety of pit crews working trackside, not to slow strategy down, but it has a real strategic effect: it puts a hard floor under how much time any pit stop costs, meaning the undercut's pace advantage has to come entirely from tyre performance, not from a faster pit lane run. A team cannot claw back time by speeding through the lane — doing so draws a time penalty.

**Unsafe release (Article B1.6.2):** a car must not be released from its pit box in a way that endangers pit-lane personnel or another driver, or that's likely to cause a collision — for example, sending a car out directly into the path of a rival, or with a wheel not properly attached. Because the whole point of an undercut is speed and urgency in the pit box, this rule is the real check on how aggressively a crew can rush a stop: a fast release into unsafe traffic can draw a stop-and-go penalty (in a race) or a grid-position drop (in qualifying), which would erase any gain the undercut was trying to achieve. In effect, the unsafe release rule sets the ceiling on how much risk a team can take with pit-box speed in pursuit of an undercut.""",
        },
        "es": {
            "term": "Undercut",
            "short_definition": "El undercut en sí no es una maniobra regulada — la FIA no regula la estrategia de carrera — pero dos reglas sí condicionan directamente qué tan agresivo puede ser un equipo al ejecutarlo: el límite de velocidad del pit lane y la regla de liberación insegura.",
            "body_markdown": """No existe ninguna regla de la FIA que mencione el "undercut" por nombre — es una decisión estratégica, no un procedimiento regulado. Pero el undercut solo funciona dentro de los límites de dos reglas del Reglamento Deportivo que rigen toda parada en boxes, sea undercut o no.

**Límite de velocidad del pit lane (Artículo B, Reglamento Deportivo):** todo auto está limitado a una velocidad fija dentro del pit lane — 80 km/h en la mayoría de los circuitos, reducido a 60 km/h en un puñado de sedes más angostas. Este límite aplica durante *todo* el tránsito por el pit lane, tanto al entrar como al salir. Existe puramente por la seguridad del personal que trabaja al costado de la pista, no para frenar la estrategia, pero tiene un efecto estratégico real: pone un piso duro a cuánto tiempo cuesta cualquier parada, lo que significa que la ventaja de ritmo del undercut tiene que venir enteramente del rendimiento de la goma, no de una pasada más rápida por el pit lane. Un equipo no puede recuperar tiempo yendo más rápido por el carril — hacerlo genera una penalización de tiempo.

**Liberación insegura (Artículo B1.6.2):** un auto no puede ser liberado de su box de una forma que ponga en riesgo al personal del pit lane o a otro piloto, o que probablemente cause una colisión — por ejemplo, soltar un auto directamente en el camino de un rival, o con una rueda mal colocada. Como todo el sentido de un undercut es velocidad y urgencia en el box, esta regla es el freno real a qué tan agresivo puede ser un equipo al apurar una parada: una liberación rápida hacia tráfico inseguro puede generar una penalización de stop-and-go (en carrera) o una caída de posiciones en la grilla (en clasificación), lo que borraría cualquier ganancia que el undercut buscaba conseguir. En la práctica, la regla de liberación insegura pone el techo a cuánto riesgo puede tomar un equipo con la velocidad en el box en busca de un undercut.""",
        },
    },
}


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    group_id = str(uuid.uuid4())
    inserted = 0
    for depth, by_locale in LAYERS.items():
        for locale in ("en", "es"):
            content = by_locale[locale]
            row = {
                "translation_group_id": group_id,
                "locale": locale,
                "slug": SLUG,
                "depth": depth,
                "term": content["term"],
                "category": CATEGORY,
                "short_definition": content["short_definition"],
                "body_markdown": content["body_markdown"],
                "related_terms": RELATED_TERMS,
                "sources": SOURCES,
                "status": "draft",
                "published_at": None,
            }
            sb.table("glossary_terms").upsert(row, on_conflict="locale,slug,depth").execute()
            inserted += 1
    print(f"Seeded {inserted} rows (1 term x 3 depths x 2 locales), status=draft")


if __name__ == "__main__":
    main()
