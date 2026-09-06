#!/usr/bin/env python3
"""Second glossary batch (category: strategy) -- overcut, team-orders, dirty-air.
Same layered format validated by the undercut pilot. EN+ES only. Seeds as
'draft' -- flip to 'published' per term after review, same pattern as the
pilot (scripts/seed_glossary_undercut_pilot.py)."""

import os
import uuid

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "overcut",
        "category": "strategy",
        "related_terms": ["undercut"],
        "sources": [
            {"name": "Motorsport.com — F1 strategy explained: undercut, overcut, DRS trains", "url": "https://www.motorsport.com/f1/news/f1-strategy-explained-whats-an-undercut-overcut-a-drs-train-and-more/10500434/"},
            {"name": "Motorsport.com — FIA confirms mandatory two-stop strategy for Monaco GP", "url": "https://www.motorsport.com/f1/news/fia-two-pitstop-strategy-monaco-gp/10698674/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Overcut",
                    "short_definition": "The overcut is the mirror image of the undercut: instead of pitting early, a driver stays out longer than a rival, banking on clean air and track position to outweigh the disadvantage of older tyres — then pits later onto tyres that are fresh for the laps that matter.",
                    "body_markdown": """Picture two runners who each need a water stop late in a marathon. If you skip your stop a little longer than your rival, you keep running at full pace while they slow down for theirs. By the time you finally take your own stop, you might already be far enough ahead that even a slightly slower first mile back doesn't cost you the lead.

That's the overcut. Where the [undercut](/glossary/undercut) bets that fresh tyres *right now* are worth more than the pit-stop time lost, the overcut bets the opposite: that staying out in clean air, unaffected by a rival's dirty wake or general traffic, is worth more than the tyre-age penalty — for now.

**Why a team would choose it:** sometimes track position matters more than outright pace. A driver stuck behind a rival often can't overtake even with faster tyres — the [dirty air](/glossary/dirty-air) off the car ahead ruins their own grip. Staying out and controlling the race from the front, then pitting late onto tyres fresh enough for a strong final stint, can beat the alternative of pitting early and getting stuck in traffic on the way back up.

The overcut isn't automatically the "safe" option and the undercut the "risky" one — which works is a bet made in real time based on tyre data, gaps, and track conditions, and either can backfire.""",
                },
                "es": {
                    "term": "Overcut",
                    "short_definition": "El overcut es la imagen espejada del undercut: en vez de parar antes, el piloto se queda en pista más tiempo que un rival, apostando a que el aire limpio y la posición en pista pesan más que la desventaja de gomas más viejas — y para después con gomas frescas para las vueltas que importan.",
                    "body_markdown": """Imaginate dos corredores que necesitan un puesto de hidratación tarde en un maratón. Si te salteás tu parada un poco más que tu rival, seguís corriendo a ritmo completo mientras el otro se frena para la suya. Para cuando finalmente hacés tu propia parada, puede que ya estés lo suficientemente adelante como para que ni una primera milla algo más lenta de vuelta te cueste el liderazgo.

Eso es el overcut. Donde el [undercut](/glossary/undercut) apuesta a que la goma nueva *ahora mismo* vale más que el tiempo perdido en boxes, el overcut apuesta lo contrario: que quedarse en pista con aire limpio, sin la estela sucia de un rival ni tráfico general, vale más que la penalización de goma vieja — por ahora.

**Por qué un equipo lo elige:** a veces la posición en pista importa más que el ritmo puro. Un piloto atascado detrás de un rival muchas veces no puede pasar ni con gomas más rápidas — el [aire sucio](/glossary/dirty-air) del auto de adelante le arruina su propio agarre. Quedarse adelante controlando la carrera, y parar tarde con gomas frescas para un último stint fuerte, puede ganarle a la alternativa de parar temprano y quedar atrapado en tráfico en la vuelta hacia arriba.

El overcut no es automáticamente la opción "segura" ni el undercut la "arriesgada" — cuál funciona es una apuesta que se hace en tiempo real según los datos de neumáticos, las diferencias de tiempo y las condiciones de pista, y cualquiera de los dos puede salir mal.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Overcut",
                    "short_definition": "The overcut extends a stint past a rival's pit stop, trading tyre-age deficit for clean air and track position, then executes a late stop onto tyres fresh enough to defend or attack over the remaining laps.",
                    "body_markdown": """The overcut is strongest exactly where the undercut is weakest, and vice versa — the two are opposite bets on the same underlying variable: tyre degradation versus clean-air value.

**When teams reach for it:**
- **Low-degradation tracks or compounds**, where old tyres don't lose much time relative to new ones — the undercut's pace swing shrinks, so the time lost in the pit lane isn't easily recovered by a rival who stopped early.
- **When the car ahead would otherwise pit into traffic** — coming out behind slower backmarkers can cost more time than staying out saves, so a team delays the stop to find a cleaner gap.
- **When a driver is genuinely faster in clean air than in a rival's wake** — a car struggling with [dirty air](/glossary/dirty-air) gains more from clear track than it loses from tyre age, especially at circuits where following closely is difficult.
- **"Covering" a rival's tyre choice** — staying out an extra lap or two to see what compound a chasing car fits before committing, rather than blindly reacting.

**The mechanics:** the overcutting car banks time by not stopping — no ~20-25 second pit-lane loss yet — while a rival ahead or behind takes that hit. When the overcutting car finally pits, its fresh tyres need to be quick enough, immediately, to either extend the gap it built or close one down before the end of the race. If the out-lap on fresh rubber underperforms, or the remaining laps are too few to use the tyre advantage, the overcut fails and the team has simply lost track position for nothing — the same failure mode the undercut carries in reverse.

**Interaction with mandatory strategy rules:** both overcut and undercut operate inside the constraint that every dry race requires at least two different tyre compounds — a team can delay a stop, but can't skip it. Some events go further: the FIA introduced a mandatory two-stop requirement specifically for the Monaco Grand Prix, which caps how long any car — overcutting or not — can extend a single stint before a second stop becomes compulsory regardless of strategy.""",
                },
                "es": {
                    "term": "Overcut",
                    "short_definition": "El overcut extiende un stint más allá de la parada de un rival, cambiando el déficit de goma vieja por aire limpio y posición en pista, y después ejecuta una parada tardía con gomas lo suficientemente frescas para defender o atacar en las vueltas que quedan.",
                    "body_markdown": """El overcut es más fuerte justo donde el undercut es más débil, y viceversa — los dos son apuestas opuestas sobre la misma variable de fondo: degradación de neumáticos contra el valor del aire limpio.

**Cuándo lo usan los equipos:**
- **Circuitos o compuestos de baja degradación**, donde la goma vieja no pierde mucho tiempo respecto a la nueva — el cambio de ritmo del undercut se achica, así que el tiempo perdido en el pit lane no se recupera fácil contra un rival que paró antes.
- **Cuando el auto de adelante saldría a tráfico** — volver detrás de autos más lentos del fondo puede costar más tiempo del que ahorra quedarse en pista, así que el equipo demora la parada para encontrar un hueco más limpio.
- **Cuando un piloto es genuinamente más rápido en aire limpio que en la estela de un rival** — un auto que sufre con el [aire sucio](/glossary/dirty-air) gana más con pista libre de lo que pierde por goma vieja, sobre todo en circuitos donde seguir de cerca es difícil.
- **"Cubrir" la elección de goma de un rival** — quedarse una vuelta o dos más para ver qué compuesto pone un auto que persigue, en vez de reaccionar a ciegas.

**La mecánica:** el auto que hace el overcut acumula tiempo al no parar — todavía sin la pérdida de ~20-25 segundos del pit lane — mientras un rival adelante o atrás sí la sufre. Cuando el auto que hace overcut finalmente para, sus gomas nuevas tienen que ser rápidas de inmediato, para extender la ventaja que construyó o cerrar una diferencia antes del final de la carrera. Si la vuelta de salida con goma nueva rinde poco, o quedan pocas vueltas para aprovechar la ventaja de la goma, el overcut falla y el equipo simplemente perdió posición en pista sin ganar nada — el mismo modo de falla que tiene el undercut, al revés.

**Interacción con las reglas de estrategia obligatorias:** tanto el overcut como el undercut operan dentro de la restricción de que toda carrera en seco requiere al menos dos compuestos de neumático distintos — un equipo puede demorar una parada, pero no puede saltearla. Algunas fechas van más allá: la FIA introdujo un requisito de dos paradas obligatorias específicamente para el Gran Premio de Mónaco, que limita cuánto puede extender cualquier auto — haga overcut o no — un solo stint antes de que una segunda parada sea obligatoria sin importar la estrategia.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Overcut",
                    "short_definition": "Like the undercut, the overcut isn't a named FIA maneuver — but it operates inside the same mandatory-tyre-compound rule that forces at least one pit stop in every dry race, and can be capped further by event-specific rules like Monaco's mandatory two-stop requirement.",
                    "body_markdown": """The overcut has no dedicated FIA rule — it's a strategic choice made possible, and limited, by two regulations that apply regardless of strategy.

**Mandatory tyre compounds:** in a completely dry Grand Prix, every driver must use at least two different dry-weather compounds across the race distance. This is the hard boundary on the overcut — a team can delay its pit stop as long as tyre condition and track position allow, but it cannot avoid stopping altogether. The rule exists to guarantee a minimum amount of pit strategy and tyre variation in every dry race, rather than to regulate the overcut specifically.

**Event-specific exceptions:** the FIA can and does add stricter requirements for individual events when it judges the standard rule isn't producing good racing. Monaco — a circuit where overtaking is so difficult that races have historically been decided entirely by qualifying and pit strategy — now carries a mandatory two-stop requirement, meaning even the most patient overcut strategy still has to make two stops, not one, regardless of tyre wear.

**Pit lane rules still apply:** exactly as with the undercut, an overcutting car's eventual stop is still bound by the pit lane speed limit and the unsafe-release rule (Article B1.6.2) — staying out longer doesn't remove the safety constraints on how the stop itself is executed once the driver finally comes in.""",
                },
                "es": {
                    "term": "Overcut",
                    "short_definition": "Igual que el undercut, el overcut no es una maniobra con nombre propio en el reglamento de la FIA — pero opera dentro de la misma regla de compuestos obligatorios que fuerza al menos una parada en cada carrera en seco, y puede estar aún más limitado por reglas específicas de una fecha, como el requisito de dos paradas de Mónaco.",
                    "body_markdown": """El overcut no tiene una regla propia de la FIA — es una decisión estratégica posible, y limitada, por dos reglamentos que aplican sin importar la estrategia.

**Compuestos de neumático obligatorios:** en un Gran Premio completamente en seco, cada piloto debe usar al menos dos compuestos secos distintos durante la carrera. Este es el límite duro del overcut — un equipo puede demorar su parada todo lo que el estado de la goma y la posición en pista permitan, pero no puede evitar parar del todo. La regla existe para garantizar un mínimo de estrategia y variación de neumáticos en cada carrera en seco, no para regular el overcut en particular.

**Excepciones específicas por fecha:** la FIA puede agregar, y de hecho agrega, requisitos más estrictos para eventos puntuales cuando considera que la regla estándar no está generando buenas carreras. Mónaco — un circuito donde adelantar es tan difícil que históricamente las carreras se decidieron enteramente por la clasificación y la estrategia de boxes — ahora tiene un requisito de dos paradas obligatorias, así que incluso la estrategia de overcut más paciente igual tiene que hacer dos paradas, no una, sin importar el desgaste de la goma.

**Las reglas del pit lane siguen aplicando:** igual que con el undercut, la parada eventual de un auto que hace overcut sigue sujeta al límite de velocidad del pit lane y a la regla de liberación insegura (Artículo B1.6.2) — quedarse más tiempo en pista no elimina las restricciones de seguridad sobre cómo se ejecuta la parada en sí una vez que el piloto finalmente entra.""",
                },
            },
        },
    },
    {
        "slug": "team-orders",
        "category": "strategy",
        "related_terms": [],
        "sources": [
            {"name": "Motorsport.com — A brief history of F1 team orders controversies", "url": "https://www.motorsport.com/f1/news/not-mclarens-first-radio-rodeo-a-brief-history-of-f1-team-orders-controversies/10637740/"},
            {"name": "Sports Litigation Alert — Controversy Swirls Around Team Orders and Formula 1", "url": "https://sportslitigationalert.com/controversy-swirls-around-team-orders-and-formula-1/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Team Orders",
                    "short_definition": "Team orders are instructions from a team telling one driver to help their teammate — moving aside, holding position, or matching a strategy — even if it costs that driver track position. They're completely legal today, but they weren't always, and they still divide fans.",
                    "body_markdown": """It's the F1 equivalent of a cycling team ordering its strongest rider to slow down and let the team leader take the stage win — the team's overall result matters more than any individual rider's glory on a given day.

In F1, that might mean a driver holding station a lap longer to keep a fresher-tyred teammate out of traffic, or — the version that actually causes controversy — a driver who's running ahead being told to let their faster teammate past, usually because the team believes the other driver has a better shot at winning the race or the championship.

**Why it's controversial:** F1 drivers are nominally teammates competing against everyone *else*, but team orders make explicit that they're also competing against each other, and the team can override that competition whenever it decides the bigger prize (a race win, a championship) is worth more than letting them race it out. Fans who want to see a fair fight on track often see team orders as the team deciding a result should have been earned differently than it actually happened on merit.

**It hasn't always been allowed.** After a blatant, widely booed example at the 2002 Austrian Grand Prix — where Ferrari ordered Rubens Barrichello to let Michael Schumacher past for the win in the closing laps — the FIA banned team orders outright. That ban lasted until 2011, when the FIA concluded it was effectively unenforceable and removed it, while keeping a general power to punish a team if a specific incident is judged to have brought the sport into disrepute.""",
                },
                "es": {
                    "term": "Team Orders (Órdenes de Equipo)",
                    "short_definition": "Las órdenes de equipo son instrucciones de un equipo pidiéndole a un piloto que ayude a su compañero — haciéndose a un lado, manteniendo posición, o igualando una estrategia — aunque eso le cueste posición en pista. Hoy son completamente legales, pero no siempre lo fueron, y todavía dividen a los hinchas.",
                    "body_markdown": """Es el equivalente en F1 a un equipo de ciclismo ordenándole a su corredor más fuerte que se frene para dejarle la victoria de etapa al líder del equipo — el resultado general del equipo importa más que la gloria individual de un corredor en un día particular.

En F1, eso puede significar que un piloto mantenga posición una vuelta más para que su compañero con goma más fresca no quede atrapado en tráfico, o — la versión que realmente genera polémica — que un piloto que va adelante reciba la orden de dejar pasar a su compañero más rápido, generalmente porque el equipo cree que el otro piloto tiene mejores chances de ganar la carrera o el campeonato.

**Por qué es polémico:** los pilotos de F1 son nominalmente compañeros compitiendo contra todos los *demás*, pero las órdenes de equipo dejan explícito que también compiten entre ellos, y el equipo puede anular esa competencia cuando decide que el premio mayor (una victoria de carrera, un campeonato) vale más que dejarlos correr entre sí. Los hinchas que quieren ver una pelea justa en pista muchas veces ven las órdenes de equipo como el equipo decidiendo que un resultado debió ganarse de otra forma a como realmente pasó por mérito propio.

**No siempre estuvieron permitidas.** Después de un ejemplo descarado y muy abucheado en el GP de Austria de 2002 — donde Ferrari le ordenó a Rubens Barrichello dejar pasar a Michael Schumacher por la victoria en las últimas vueltas — la FIA prohibió las órdenes de equipo directamente. Esa prohibición duró hasta 2011, cuando la FIA concluyó que era, en la práctica, imposible de fiscalizar y la eliminó, aunque mantuvo una facultad general para sancionar a un equipo si se considera que un incidente puntual dañó la imagen del deporte.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Team Orders",
                    "short_definition": "Team orders are a legal tool teams use to optimize their combined result — protecting a championship contender, avoiding an unnecessary risk between teammates, or aligning strategy — governed today by a general disrepute clause rather than a specific prohibition.",
                    "body_markdown": """Modern team orders go far beyond the dramatic "let your teammate past" moment — most of them are mundane strategic coordination that fans rarely notice:

**Common, uncontroversial forms:**
- Holding a position for a lap so a teammate on a different tyre strategy doesn't get boxed in
- Splitting strategies deliberately (one driver pits early, one stays out) to "cover" more than one scenario, then having whichever driver is worse off support the other later in the race
- A driver told to save fuel or engine modes to protect a result, potentially costing them pace relative to their teammate

**The controversial form — swap orders:** a team asks a driver running ahead to let a teammate through. Teams justify this by pointing to championship mathematics: if one driver is mathematically closer to winning the title, or has a faster car on that specific strategy, the team's overall points haul is often the same either way — what changes is which driver gets the win. Critics argue this undermines the sporting integrity of the result and the trust fans place in what they're watching being a genuine contest.

**Why teams still use them despite the backlash:** the incentive structure rewards it. The Constructors' Championship — worth far more in prize money than any individual driver's result — only cares about combined points, not which driver scored them. A team that refuses to ever intervene between its drivers can lose a championship to one that will, so the pressure to use team orders in genuinely close title fights hasn't gone away even though the FIA no longer bans the practice.""",
                },
                "es": {
                    "term": "Team Orders (Órdenes de Equipo)",
                    "short_definition": "Las órdenes de equipo son una herramienta legal que usan los equipos para optimizar su resultado combinado — proteger a un candidato al título, evitar un riesgo innecesario entre compañeros, o alinear estrategia — reguladas hoy por una cláusula general de daño a la imagen del deporte, no por una prohibición específica.",
                    "body_markdown": """Las órdenes de equipo modernas van mucho más allá del momento dramático de "dejá pasar a tu compañero" — la mayoría son coordinación estratégica mundana que los hinchas casi ni notan:

**Formas comunes, sin polémica:**
- Mantener posición una vuelta para que un compañero con otra estrategia de neumáticos no quede encerrado
- Dividir estrategias a propósito (un piloto para antes, el otro se queda en pista) para "cubrir" más de un escenario, y que después el piloto que quedó peor parado ayude al otro más adelante en la carrera
- Pedirle a un piloto que ahorre combustible o baje el modo de motor para proteger un resultado, aunque eso le cueste ritmo respecto a su compañero

**La forma polémica — el intercambio de posiciones:** el equipo le pide a un piloto que va adelante que deje pasar a su compañero. Los equipos lo justifican con la matemática del campeonato: si un piloto está matemáticamente más cerca de ganar el título, o tiene un auto más rápido en esa estrategia puntual, la cosecha total de puntos del equipo suele ser la misma de todos modos — lo que cambia es qué piloto se queda con la victoria. Los críticos argumentan que esto socava la integridad deportiva del resultado y la confianza que los hinchas ponen en que lo que están viendo es una competencia genuina.

**Por qué los equipos las siguen usando pese al rechazo:** la estructura de incentivos las premia. El Campeonato de Constructores — que vale mucho más en premio en dinero que el resultado de cualquier piloto individual — solo le importan los puntos combinados, no qué piloto los sumó. Un equipo que se niega a intervenir entre sus pilotos puede perder un campeonato contra uno que sí lo hace, así que la presión para usar órdenes de equipo en peleas de título realmente reñidas no desapareció, aunque la FIA ya no prohíba la práctica.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Team Orders",
                    "short_definition": "Team orders were explicitly banned by FIA Sporting Regulations Article 39.1 from 2002 to 2011, following the 2002 Austrian Grand Prix. The FIA deleted that article in 2011, concluding it was unenforceable, and now relies on a general power to sanction a team if a specific incident is judged to bring the sport into disrepute.",
                    "body_markdown": """**The ban (2002-2011):** the FIA introduced Article 39.1 of the Sporting Regulations directly in response to the 2002 Austrian Grand Prix, where Ferrari ordered Rubens Barrichello to slow and let Michael Schumacher take the win in the final laps — a move so blatant it drew boos from the crowd and public criticism even from FIA figures at the time. The article prohibited "team orders which interfere with a race result."

**Why it was repealed:** the rule proved almost impossible to police in practice. Teams that wanted to favor one driver simply achieved the same result through coded radio messages or unexplained pace drops instead of an explicit swap, which the FIA couldn't reliably distinguish from a driver genuinely struggling. The breaking point was the 2010 German Grand Prix, where Ferrari's radio message to Felipe Massa — "Fernando is faster than you, can you confirm you understood that message" — was so transparently a coded order that Ferrari was fined, but the underlying instruction still couldn't be proven to violate the letter of the rule. At the end of that season, the FIA deleted Article 39.1 rather than continue trying to enforce an unenforceable rule.

**What governs team orders today:** there's no specific article banning them. Instead, the FIA retains its general authority under the International Sporting Code to investigate and penalize any competitor whose actions are judged to bring the sport into disrepute — a much broader, more discretionary standard than a specific team-orders rule, applied case by case rather than as an automatic prohibition.""",
                },
                "es": {
                    "term": "Team Orders (Órdenes de Equipo)",
                    "short_definition": "Las órdenes de equipo estuvieron explícitamente prohibidas por el Artículo 39.1 del Reglamento Deportivo de la FIA entre 2002 y 2011, a raíz del GP de Austria de 2002. La FIA eliminó ese artículo en 2011 al concluir que era imposible de fiscalizar, y hoy se apoya en una facultad general para sancionar a un equipo si se considera que un incidente puntual dañó la imagen del deporte.",
                    "body_markdown": """**La prohibición (2002-2011):** la FIA introdujo el Artículo 39.1 del Reglamento Deportivo directamente en respuesta al GP de Austria de 2002, donde Ferrari le ordenó a Rubens Barrichello frenar y dejar pasar a Michael Schumacher por la victoria en las últimas vueltas — una maniobra tan descarada que generó abucheos del público y críticas públicas hasta de figuras de la propia FIA en ese momento. El artículo prohibía "las órdenes de equipo que interfieran con el resultado de una carrera".

**Por qué se derogó:** la regla resultó casi imposible de fiscalizar en la práctica. Los equipos que querían favorecer a un piloto simplemente lograban el mismo resultado con mensajes de radio en clave o bajones de ritmo sin explicación en vez de un intercambio explícito, algo que la FIA no podía distinguir con certeza de un piloto genuinamente en dificultades. El punto de quiebre fue el GP de Alemania de 2010, donde el mensaje de radio de Ferrari a Felipe Massa — "Fernando es más rápido que vos, ¿podés confirmar que entendiste ese mensaje?" — fue una orden en código tan transparente que Ferrari recibió una multa, pero la instrucción de fondo igual no se pudo probar que violara la letra de la regla. Al final de esa temporada, la FIA eliminó el Artículo 39.1 en vez de seguir intentando hacer cumplir una regla infiscalizable.

**Qué regula las órdenes de equipo hoy:** no hay un artículo específico que las prohíba. En cambio, la FIA conserva su facultad general bajo el Código Deportivo Internacional para investigar y penalizar a cualquier competidor cuyas acciones se considere que dañan la imagen del deporte — un estándar mucho más amplio y discrecional que una regla específica de órdenes de equipo, aplicado caso por caso en vez de como una prohibición automática.""",
                },
            },
        },
    },
    {
        "slug": "dirty-air",
        "category": "strategy",
        "related_terms": [],
        "sources": [
            {"name": "RaceFans.net — Why the FIA believes its 2026 rules will improve F1's 'dirty air' problem", "url": "https://www.racefans.net/2025/11/21/why-the-fia-believes-its-2026-rules-will-significantly-improve-f1s-dirty-air-problem/"},
            {"name": "The Race — Revealed: the data on F1's worsening dirty air problem", "url": "https://www.the-race.com/formula-1/exclusive-new-data-f1-aero-losses-ruining-close-racing/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Dirty Air",
                    "short_definition": "Dirty air is the turbulent, churned-up wake an F1 car leaves behind it — following closely through that wake makes the chasing car's grip worse in corners, which is the single biggest reason overtaking in F1 is hard.",
                    "body_markdown": """Picture riding a bike right behind a truck on the highway. On a straight, flat stretch, the truck actually pulls you along — you get sucked into its wake and can pedal less for the same speed. That pull is the same idea as a **slipstream**: real, useful, and why cars try to stay close on straights.

But the moment that road curves, the same wake turns against you. The air behind the truck isn't smooth anymore — it's churned up and unpredictable, and if you try to lean into a turn while riding through it, you lose your balance. That's **dirty air**: the same turbulent wake, but now it's disrupting the following car's grip exactly where grip matters most, through the corners.

For an F1 car, grip in corners comes largely from air flowing cleanly over the front wing and under the floor. A car running through a rival's dirty air gets messy, low-energy air instead — less downforce, less grip, and a driver who has to back off through corners just to keep the car pointed the right way. That's why a car can be genuinely faster than the one ahead on a clean lap, and still not be able to pass it — the moment it gets close enough to attack, the dirty air takes away the very grip it needs to make the move.""",
                },
                "es": {
                    "term": "Dirty Air (Aire Sucio)",
                    "short_definition": "El aire sucio es la estela turbulenta que deja un auto de F1 detrás — seguir de cerca a través de esa estela empeora el agarre del auto que persigue en las curvas, y es la razón número uno por la que adelantar en F1 es difícil.",
                    "body_markdown": """Imaginate andar en bici justo detrás de un camión en la autopista. En un tramo recto y plano, el camión en realidad te empuja — te succiona en su estela y podés pedalear menos para la misma velocidad. Ese empuje es la misma idea que el **slipstream** (rebufo): real, útil, y por eso los autos tratan de mantenerse cerca en las rectas.

Pero apenas el camino se curva, esa misma estela juega en tu contra. El aire detrás del camión ya no es suave — está revuelto e impredecible, y si tratás de inclinarte en una curva mientras andás por ahí, perdés el equilibrio. Eso es el **aire sucio**: la misma estela turbulenta, pero ahora arruinando el agarre del auto que sigue justo donde más importa el agarre, en las curvas.

En un auto de F1, el agarre en las curvas viene en gran parte del aire fluyendo limpio sobre el alerón delantero y por debajo del piso. Un auto que atraviesa el aire sucio de un rival recibe en cambio aire revuelto y de baja energía — menos carga aerodinámica, menos agarre, y un piloto que tiene que levantar el pie en las curvas solo para mantener el auto apuntando bien. Por eso un auto puede ser genuinamente más rápido que el de adelante en una vuelta limpia, y aun así no poder pasarlo — apenas se acerca lo suficiente para atacar, el aire sucio le quita justo el agarre que necesita para hacer la maniobra.""",
                },
            },
            "technical": {
                "en": {
                    "term": "Dirty Air",
                    "short_definition": "Dirty air is aerodynamic wake turbulence shed by a leading car that reduces a following car's downforce and grip, worsening the closer and lower it follows — the primary technical obstacle to close racing that F1's 2026 regulations specifically target.",
                    "body_markdown": """A car generates downforce by managing airflow precisely — over the front wing, along the floor and diffuser, through the rear wing. That airflow has to arrive relatively clean and undisturbed to do its job. A car following another inherits air that's already been through that process once: slower, more turbulent, and less predictable.

**Where it hurts most:** the front wing suffers first and worst, since it's the first surface hit by the wake. A damaged or reduced front wing airflow throws off the balance of the whole car — typically producing understeer (the car resists turning in) exactly where a driver needs maximum front grip to commit to an overtaking line. The effect compounds the closer a car follows and the longer the following stint continues, since tyres also overheat faster when a car is forced to slide through corners rather than grip cleanly.

**Why it got worse, then better, then worse again:** the 2022 regulations were explicitly designed around "ground-effect" underfloor tunnels partly *because* they were expected to produce a cleaner wake than the previous generation's wing-heavy aero. Data gathered since 2022 showed real but limited improvement — and by 2025, aero losses when following had crept back up as teams optimized every car for peak downforce, incidentally regenerating some of the turbulence the rules tried to design out.

**The 2026 response:** the new Technical Regulations go further — a partially flat floor with shorter venturi tunnels, simplified front and rear wings with fewer elements, and active aerodynamics that let a following car reduce drag on straights. The FIA's own modeling and wind-tunnel data project a meaningfully cleaner wake shape than either the 2022 or pre-2022 generation, specifically engineered to let cars run closer through corners without losing as much front-end grip — closing racing's central problem hasn't been solved outright, but 2026 is a deliberate, data-driven attempt at it rather than an incidental side effect of other changes.""",
                },
                "es": {
                    "term": "Dirty Air (Aire Sucio)",
                    "short_definition": "El aire sucio es la turbulencia aerodinámica que deja un auto que va adelante, reduciendo la carga aerodinámica y el agarre del auto que lo sigue — empeora cuanto más cerca y con más tiempo lo persigue — y es el principal obstáculo técnico para las carreras reñidas que el reglamento 2026 de F1 ataca puntualmente.",
                    "body_markdown": """Un auto genera carga aerodinámica manejando el flujo de aire con precisión — sobre el alerón delantero, a lo largo del piso y el difusor, por el alerón trasero. Ese flujo tiene que llegar relativamente limpio y sin perturbar para cumplir su función. Un auto que sigue a otro hereda aire que ya pasó por ese proceso una vez: más lento, más turbulento y menos predecible.

**Dónde duele más:** el alerón delantero sufre primero y peor, porque es la primera superficie golpeada por la estela. Un flujo de aire dañado o reducido en el alerón delantero desequilibra todo el auto — típicamente genera subviraje (el auto se resiste a girar) justo donde el piloto necesita máximo agarre delantero para comprometerse con una línea de sobrepaso. El efecto se acumula cuanto más cerca sigue un auto y cuanto más dura el stint persiguiendo, porque además las gomas se recalientan más rápido cuando el auto se ve forzado a deslizar en las curvas en vez de agarrar limpio.

**Por qué empeoró, después mejoró, y después empeoró de nuevo:** el reglamento 2022 se diseñó explícitamente en torno a los túneles de "efecto suelo" bajo el piso en parte *porque* se esperaba que produjeran una estela más limpia que la generación anterior, más dependiente de alerones. Los datos recolectados desde 2022 mostraron una mejora real pero limitada — y para 2025, las pérdidas aerodinámicas al seguir a otro auto habían vuelto a subir, a medida que los equipos optimizaban cada auto para carga aerodinámica máxima, regenerando de paso algo de la turbulencia que el reglamento intentaba eliminar.

**La respuesta de 2026:** el nuevo Reglamento Técnico va más lejos — un piso parcialmente plano con túneles venturi más cortos, alerones delanteros y traseros simplificados con menos elementos, y aerodinámica activa que le permite al auto que sigue reducir el arrastre en las rectas. Los propios modelos y datos de túnel de viento de la FIA proyectan una forma de estela notablemente más limpia que la generación de 2022 o la anterior, diseñada específicamente para que los autos puedan seguirse más de cerca en las curvas sin perder tanto agarre en el tren delantero — el problema central de las carreras reñidas no está resuelto del todo, pero 2026 es un intento deliberado y basado en datos, no un efecto secundario incidental de otros cambios.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Dirty Air",
                    "short_definition": "The FIA doesn't regulate dirty air directly — there's no rule against producing wake turbulence — but the 2026 Technical Regulations mandate specific car geometry (floor, wings, active aero) engineered to reduce it, and the Sporting Regulations separately compensate for its effect through DRS's proximity-based activation rule.",
                    "body_markdown": """There's no FIA article that limits how much turbulent wake a car is allowed to produce — dirty air isn't a rule violation, it's a byproduct of aerodynamics the regulations try to engineer around instead of prohibit.

**The Technical Regulations approach — designing the car shape:** the 2026 rules mandate specific geometry choices (a partially flat floor, shortened venturi tunnels, simplified wings, active aero elements) developed using FIA and team CFD/wind-tunnel research aimed at producing a measurably cleaner wake than earlier regulation sets. This is a mandatory design constraint, not a guideline — every constructor's car must conform to the same floor and wing rules, which is precisely how the FIA "regulates" dirty air: not by penalizing it after the fact, but by legislating the car shapes expected to produce less of it in the first place.

**The Sporting Regulations approach — compensating for it directly:** DRS (Drag Reduction System) exists specifically to offset the straight-line speed disadvantage dirty air causes. Its activation is gated by a proximity rule — a following car must be within a defined gap (historically one second) of the car ahead at a designated detection point to be allowed to open its rear wing flap in the following DRS zone. That gap threshold is a direct regulatory acknowledgment that dirty air puts a following car at a quantifiable disadvantage worth compensating for, rather than something the rules simply ignore.""",
                },
                "es": {
                    "term": "Dirty Air (Aire Sucio)",
                    "short_definition": "La FIA no regula el aire sucio de forma directa — no existe una regla contra producir turbulencia de estela — pero el Reglamento Técnico 2026 exige una geometría de auto específica (piso, alerones, aero activa) diseñada para reducirlo, y el Reglamento Deportivo compensa su efecto por otro lado, a través de la regla de activación del DRS basada en la proximidad.",
                    "body_markdown": """No existe un artículo de la FIA que limite cuánta turbulencia de estela puede producir un auto — el aire sucio no es una infracción, es un subproducto de la aerodinámica que el reglamento intenta diseñar para evitar, en vez de prohibir.

**El enfoque del Reglamento Técnico — diseñar la forma del auto:** las reglas de 2026 exigen decisiones de geometría específicas (piso parcialmente plano, túneles venturi acortados, alerones simplificados, elementos de aero activa) desarrolladas con investigación de CFD y túnel de viento de la FIA y los equipos, apuntada a producir una estela medible más limpia que reglamentos anteriores. Esto es una restricción de diseño obligatoria, no una sugerencia — el auto de cada constructor debe cumplir las mismas reglas de piso y alerones, que es precisamente cómo la FIA "regula" el aire sucio: no penalizándolo después del hecho, sino legislando las formas de auto que se espera que produzcan menos desde el principio.

**El enfoque del Reglamento Deportivo — compensarlo directamente:** el DRS (Sistema de Reducción de Resistencia) existe específicamente para compensar la desventaja de velocidad en recta que causa el aire sucio. Su activación está condicionada por una regla de proximidad — un auto que sigue debe estar dentro de una diferencia definida (históricamente un segundo) respecto al auto de adelante en un punto de detección designado para poder abrir el flap del alerón trasero en la zona de DRS siguiente. Ese umbral de diferencia es un reconocimiento regulatorio directo de que el aire sucio pone al auto que sigue en una desventaja cuantificable que vale la pena compensar, en vez de algo que el reglamento simplemente ignora.""",
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
