#!/usr/bin/env python3
"""Extends the 6 legacy economics glossary terms (cost-cap, concorde-agreement,
anti-dilution-fee, prize-money, hosting-fee, title-sponsorship) with eli5 and
fia depth layers, matching the analogy-first pattern used for the 17-term
expansion. Existing 'technical' rows (en/es/pt) are untouched.

EN+ES only, per the language-rollout decision -- PT keeps its single
'technical' layer as-is, same as it already does for legacy terms; no PT rows
added here. Reuses each term's existing translation_group_id so eli5/technical/
fia rows for the same term stay linked as one story.

Seeds as 'draft', same review-before-publish pattern as the 17-term rollout --
flip to 'published' per term after review."""

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TERMS = [
    {
        "slug": "cost-cap",
        "group_id": "31615316-430f-4b09-bf01-269651201491",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "anti-dilution-fee", "title-sponsorship"],
        "sources": [
            {"name": "FIA — Cost Cap Administration", "url": "https://www.fia.com/events/fia-formula-one-world-championship/season-2025/cost-cap-administration"},
            {"name": "Autosport — All to know about the F1 cost cap", "url": "https://www.autosport.com/f1/news/f1-cost-cap-all-to-know/10379447/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Cost Cap",
                    "short_definition": "F1's cost cap is a rule that every team can only spend up to a fixed amount each year building and developing their race car — meant to stop the richest teams from simply outspending everyone else.",
                    "body_markdown": """Imagine a cooking competition where every chef gets the exact same grocery budget for the dish they're judged on — same amount for ingredients, no exceptions. A chef with a wealthy sponsor can't just buy better truffles than everyone else; the dish itself has to be won on skill within that shared budget.

That's the cost cap. It caps what a team can spend specifically on car performance — the aerodynamics, the parts, most of the engineering staff — at the same dollar figure for every team, rich or poor. Before this rule, the best-funded teams could simply out-develop everyone else by spending three or four times as much. Now, a small team and a giant one work from the same performance budget, so the gap between them has to come from smarter engineering, not deeper pockets.

It doesn't cap *everything* though — a team's chef can still have an unlimited personal salary and an unlimited marketing budget, just like a real restaurant. The cap only touches what goes into making the car itself faster.""",
                },
                "es": {
                    "term": "Tope de Gastos (Cost Cap)",
                    "short_definition": "El tope de gastos de F1 es una regla que limita a cada equipo a gastar hasta una cifra fija por año en construir y desarrollar su auto de carrera — pensada para que los equipos más ricos no puedan simplemente gastar más que el resto.",
                    "body_markdown": """Imaginate una competencia de cocina donde cada chef recibe exactamente el mismo presupuesto de compras para el plato que se juzga — la misma plata para ingredientes, sin excepciones. Un chef con un sponsor adinerado no puede comprar trufas mejores que los demás; el plato en sí tiene que ganarse por habilidad dentro de ese presupuesto compartido.

Eso es el tope de gastos. Limita lo que un equipo puede gastar específicamente en rendimiento del auto — la aerodinámica, las piezas, la mayoría del personal de ingeniería — a la misma cifra en dólares para cada equipo, rico o pobre. Antes de esta regla, los equipos con más presupuesto podían simplemente desarrollar tres o cuatro veces más que el resto. Ahora, un equipo chico y uno gigante trabajan desde el mismo presupuesto de rendimiento, así que la diferencia entre ellos tiene que venir de ingeniería más inteligente, no de bolsillos más profundos.

Igual no cubre *todo* — el chef de un equipo puede tener un salario personal ilimitado y un presupuesto de marketing ilimitado, como en un restaurante real. El tope solo toca lo que entra en hacer más rápido al auto en sí.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Cost Cap",
                    "short_definition": "The cost cap isn't part of F1's Sporting or Technical Regulations — it lives in its own rulebook, the FIA Formula 1 Financial Regulations, enforced through two separate bodies: the Cost Cap Administration, which audits team accounts, and the independent Cost Cap Adjudication Panel, which judges any breach referred to it.",
                    "body_markdown": """**A separate rulebook entirely:** the cost cap is governed by the FIA Formula 1 Financial Regulations (Section D of the F1 regulatory framework) — a distinct document from the Sporting and Technical Regulations that cover on-track competition, amended and supplemented by the FIA World Motor Sport Council as needed.

**Two-body enforcement, not one:** the Cost Cap Administration is the investigative arm — it audits every team's annual accounts, requests documentation, and identifies possible breaches. But it doesn't act as judge and jury. When it finds a suspected breach, it refers the case to the **Cost Cap Adjudication Panel** — a separate, independent tribunal of 12 judges elected by the FIA General Assembly from candidates nominated by national sporting authorities, groups of F1 teams, or power unit manufacturers.

**Why the separation matters:** splitting investigation from judgment is a deliberate structural safeguard — the same body that audits a team's books isn't the one deciding whether a breach occurred and what penalty follows. The Adjudication Panel specifically handles the most serious cases, including any alleged Major Overspend Breach, giving accused teams a hearing before an independent panel rather than a ruling from the auditor itself.""",
                },
                "es": {
                    "term": "Tope de Gastos (Cost Cap)",
                    "short_definition": "El tope de gastos no forma parte del Reglamento Deportivo ni del Técnico de F1 — vive en su propio reglamento, las Regulaciones Financieras de F1 de la FIA, fiscalizado por dos organismos separados: la Cost Cap Administration, que audita las cuentas de los equipos, y el Cost Cap Adjudication Panel independiente, que juzga cualquier incumplimiento que se le derive.",
                    "body_markdown": """**Un reglamento completamente aparte:** el tope de gastos se rige por las Regulaciones Financieras de F1 de la FIA (Sección D del marco regulatorio de F1) — un documento distinto del Reglamento Deportivo y Técnico que cubren la competencia en pista, modificado y complementado por el World Motor Sport Council de la FIA según haga falta.

**Fiscalización de dos organismos, no uno solo:** la Cost Cap Administration es el brazo investigativo — audita las cuentas anuales de cada equipo, pide documentación, e identifica posibles incumplimientos. Pero no actúa como juez y parte. Cuando encuentra un incumplimiento sospechoso, deriva el caso al **Cost Cap Adjudication Panel** — un tribunal separado e independiente de 12 jueces elegidos por la Asamblea General de la FIA entre candidatos nominados por autoridades deportivas nacionales, grupos de equipos de F1, o fabricantes de unidades de potencia.

**Por qué importa esa separación:** dividir la investigación del juicio es una salvaguarda estructural deliberada — el mismo organismo que audita los libros de un equipo no es el que decide si hubo un incumplimiento y qué sanción corresponde. El Adjudication Panel maneja específicamente los casos más serios, incluyendo cualquier presunto incumplimiento mayor, dándoles a los equipos acusados una audiencia ante un panel independiente en vez de un fallo del propio auditor.""",
                },
            },
        },
    },
    {
        "slug": "concorde-agreement",
        "group_id": "cc44efe4-d936-4b78-85da-d2534f691b8f",
        "category": "regulations",
        "related_terms": ["cost-cap", "anti-dilution-fee", "prize-money"],
        "sources": [
            {"name": "Formula1.com — What the new Concorde Agreement means for F1", "url": "https://www.formula1.com/en/latest/article/analysis-what-the-new-concorde-agreement-means-for-formula-1.1Z97Z6vRwfDTHVhGbSS510"},
            {"name": "FIA — FIA, Formula 1 Group and all 11 race teams officially sign the ninth Concorde Agreement", "url": "https://api.fia.com/news/fia-formula-1-group-and-all-11-race-teams-officially-sign-ninth-concorde-agreement-securing"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Concorde Agreement",
                    "short_definition": "The Concorde Agreement is F1's master contract between the FIA, the commercial rights holder, and every team — the private rulebook that decides how the business of F1 actually runs, kept confidential and renewed every few years.",
                    "body_markdown": """Think of it like a partnership agreement between business partners who are also, in some ways, rivals — it spells out how profits get split, what each partner is obligated to show up and do, and how disagreements get resolved, all agreed privately before any of them get down to actually competing.

Every team on the grid has to sign it to race. It's not published anywhere fans can read it — unlike the Sporting or Technical Regulations, which are public documents, the Concorde Agreement's commercial terms stay confidential between the people who signed it. What leaks out publicly (like the cost cap figure) is what the parties choose to share, not the full document.

It also doesn't last forever — like a lease, it has an expiry date, and every few years the same partners have to sit down and agree on a new one, or the whole arrangement is up for renegotiation. The current one runs through 2030.""",
                },
                "es": {
                    "term": "Acuerdo de la Concordia (Concorde Agreement)",
                    "short_definition": "El Concorde Agreement es el contrato maestro de F1 entre la FIA, el titular de los derechos comerciales, y cada equipo — el reglamento privado que decide cómo funciona realmente el negocio de F1, confidencial y renovado cada varios años.",
                    "body_markdown": """Pensalo como un acuerdo de sociedad entre socios comerciales que también son, en cierto modo, rivales — detalla cómo se reparten las ganancias, qué está obligado a hacer cada socio, y cómo se resuelven los desacuerdos, todo acordado en privado antes de que se pongan a competir de verdad.

Cada equipo de la parrilla tiene que firmarlo para poder correr. No está publicado en ningún lado donde los hinchas puedan leerlo — a diferencia del Reglamento Deportivo o Técnico, que son documentos públicos, los términos comerciales del Concorde Agreement siguen confidenciales entre quienes lo firmaron. Lo que se filtra públicamente (como la cifra del tope de gastos) es lo que las partes eligen compartir, no el documento completo.

Tampoco dura para siempre — como un contrato de alquiler, tiene fecha de vencimiento, y cada varios años los mismos socios tienen que sentarse a acordar uno nuevo, o todo el arreglo queda abierto a renegociación. El actual corre hasta 2030.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Concorde Agreement",
                    "short_definition": "The FIA signs the Concorde Agreement as F1's regulatory authority — the body that sets and enforces the Sporting and Technical Regulations — while a separate party, the Commercial Rights Holder (currently the F1 Group), controls the business side; the Concorde Agreement is the contract that formally defines and separates those two roles.",
                    "body_markdown": """**Two very different signatories, two very different jobs:** the FIA's role under the Concorde Agreement is regulatory — it develops and enforces the rules that govern the sport's fairness and safety, the same authority it exercises across the FIA's other world championships. The Commercial Rights Holder's role is entirely different: managing broadcast deals, hosting-fee negotiations, sponsorship, and the sport's overall commercial operation. The Concorde Agreement is the document that formally establishes and separates these two roles, rather than letting either party's authority bleed into the other's territory.

**Why that split matters in practice:** it means the FIA can change a technical or sporting rule through its own governance process (the World Motor Sport Council) without that decision being a commercial negotiation, and conversely, commercial terms like prize money or hosting fees are settled without needing FIA regulatory sign-off — each party has a defined lane.

**The current cycle:** the ninth Concorde Agreement was formally signed by the FIA, the F1 Group, and all eleven competing teams, securing the sport's governance and commercial framework through 2030 — each renewal is a moment where this division of authority between FIA and the commercial side gets explicitly reconfirmed by every party at once.""",
                },
                "es": {
                    "term": "Acuerdo de la Concordia (Concorde Agreement)",
                    "short_definition": "La FIA firma el Concorde Agreement como autoridad regulatoria de F1 — el organismo que fija y hace cumplir el Reglamento Deportivo y Técnico — mientras que una parte separada, el Titular de los Derechos Comerciales (hoy el F1 Group), controla el lado del negocio; el Concorde Agreement es el contrato que define y separa formalmente esos dos roles.",
                    "body_markdown": """**Dos firmantes muy distintos, dos trabajos muy distintos:** el rol de la FIA bajo el Concorde Agreement es regulatorio — desarrolla y hace cumplir las reglas que rigen la equidad y la seguridad del deporte, la misma autoridad que ejerce en los demás campeonatos mundiales de la FIA. El rol del Titular de los Derechos Comerciales es completamente distinto: manejar los acuerdos de transmisión, las negociaciones de cuota de sede, el patrocinio, y la operación comercial general del deporte. El Concorde Agreement es el documento que establece y separa formalmente estos dos roles, en vez de dejar que la autoridad de una parte se meta en el territorio de la otra.

**Por qué importa esa división en la práctica:** significa que la FIA puede cambiar una regla técnica o deportiva a través de su propio proceso de gobernanza (el World Motor Sport Council) sin que esa decisión sea una negociación comercial, y a la inversa, términos comerciales como el premio en dinero o las cuotas de sede se resuelven sin necesitar el visto bueno regulatorio de la FIA — cada parte tiene un carril definido.

**El ciclo actual:** el noveno Concorde Agreement fue firmado formalmente por la FIA, el F1 Group, y los once equipos competidores, asegurando el marco de gobernanza y comercial del deporte hasta 2030 — cada renovación es un momento donde esta división de autoridad entre la FIA y el lado comercial se reconfirma explícitamente entre todas las partes a la vez.""",
                },
            },
        },
    },
    {
        "slug": "anti-dilution-fee",
        "group_id": "ed28c6cd-b89e-44a7-a3c9-e57ee8c0e9c6",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "cost-cap"],
        "sources": [
            {"name": "Autosport — The Cadillac calculus F1 has made", "url": "https://www.autosport.com/f1/news/the-cadillac-calculus-f1-has-made-that-weighs-up-450m-today-vs-billions-tomorrow/10795676/"},
            {"name": "FIA — FIA officially launches an application process for prospective Formula 1 teams", "url": "https://www.fia.com/news/fia-officially-launches-application-process-prospective-formula-1-teams"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Anti-Dilution Fee",
                    "short_definition": "The anti-dilution fee is the buy-in a new team pays the existing teams to join F1's grid — compensation for shrinking everyone else's slice of the shared prize money.",
                    "body_markdown": """Picture ten friends splitting a pizza evenly. If an eleventh friend wants a slice, the fair thing isn't for everyone to just silently accept a smaller piece — it's for the newcomer to chip in enough money that the original ten don't come out behind.

That's the anti-dilution fee. F1's prize money pool gets split among the teams by championship position — add an eleventh team, and that same pool splits eleven ways instead of ten, shrinking everyone's cut even if nothing about their own performance changed. The fee is the newcomer's payment to the ten existing teams to make up for that.

It's not cheap: when Cadillac joined for 2026, it paid $450 million, split among the ten teams already there — well above the $200 million minimum the rules originally set, reflecting just how much more valuable an F1 grid slot has become.""",
                },
                "es": {
                    "term": "Cuota Anti-Dilución (Anti-Dilution Fee)",
                    "short_definition": "La cuota anti-dilución es el pago de entrada que hace un equipo nuevo a los equipos existentes para sumarse a la parrilla de F1 — compensación por achicar la porción de cada uno en el premio en dinero compartido.",
                    "body_markdown": """Imaginate diez amigos repartiendo una pizza en partes iguales. Si un onceavo amigo quiere una porción, lo justo no es que todos acepten en silencio una porción más chica — es que el recién llegado ponga suficiente plata para que los diez originales no salgan perdiendo.

Eso es la cuota anti-dilución. El fondo de premio en dinero de F1 se reparte entre los equipos según su posición en el campeonato — agregá un onceavo equipo, y ese mismo fondo se reparte entre once en vez de diez, achicando la porción de todos aunque nada de su propio rendimiento haya cambiado. La cuota es el pago del recién llegado a los diez equipos existentes para compensar eso.

No es barato: cuando Cadillac se sumó para 2026, pagó $450 millones, repartidos entre los diez equipos que ya estaban — bastante por encima del mínimo de $200 millones que fijaba originalmente la regla, reflejando cuánto más valioso se volvió un lugar en la parrilla de F1.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Anti-Dilution Fee",
                    "short_definition": "Before a prospective team can even discuss the anti-dilution fee, it must clear a completely separate FIA gate: a formal Expressions of Interest and selection process that vets technical, financial, and sustainability credentials — clearing the FIA's process doesn't waive the fee, and paying the fee doesn't substitute for FIA approval.",
                    "body_markdown": """**Two gates, not one:** joining the F1 grid requires clearing both an FIA regulatory approval process and a separate commercial payment — and they're sequential, not interchangeable. A team can't simply pay its way past FIA's vetting, and passing FIA's vetting doesn't excuse it from paying the incumbents.

**The FIA's gate — Expressions of Interest:** a prospective entrant registers formal interest with the FIA, signs a non-disclosure agreement, and pays a non-refundable $20,000 administration fee to begin the process. The FIA then conducts genuine due diligence — assessing the applicant's technical capability, its ability to raise and sustain competitive funding over time, its team experience, and (for recent applications) how it plans to meet the sport's net-zero CO2 sustainability commitments.

**The commercial gate — anti-dilution fee:** entirely separate from FIA's approval, this is a Concorde Agreement commercial term paid directly to the ten incumbent teams, not to the FIA. Cadillac's own path illustrates the sequence: it registered interest alongside several other applicants, and the FIA confirmed it had met the selection criteria before the commercial anti-dilution figure was even finalized with the incumbent teams.""",
                },
                "es": {
                    "term": "Cuota Anti-Dilución (Anti-Dilution Fee)",
                    "short_definition": "Antes de que un equipo candidato pueda siquiera discutir la cuota anti-dilución, tiene que pasar un filtro completamente separado de la FIA: un proceso formal de expresión de interés y selección que evalúa credenciales técnicas, financieras y de sostenibilidad — pasar el proceso de la FIA no exime de la cuota, y pagar la cuota no reemplaza la aprobación de la FIA.",
                    "body_markdown": """**Dos filtros, no uno:** sumarse a la parrilla de F1 requiere pasar tanto un proceso de aprobación regulatoria de la FIA como un pago comercial separado — y son secuenciales, no intercambiables. Un equipo no puede simplemente pagar para saltarse la evaluación de la FIA, y pasar la evaluación de la FIA no lo exime de pagarles a los equipos existentes.

**El filtro de la FIA — Expresión de Interés:** un candidato registra interés formal ante la FIA, firma un acuerdo de confidencialidad, y paga una cuota administrativa no reembolsable de $20.000 para arrancar el proceso. La FIA después hace una evaluación genuina — analiza la capacidad técnica del candidato, su capacidad de conseguir y sostener financiamiento competitivo en el tiempo, la experiencia de su equipo, y (en solicitudes recientes) cómo planea cumplir los compromisos de sostenibilidad de cero emisiones netas de CO2 del deporte.

**El filtro comercial — cuota anti-dilución:** completamente separado de la aprobación de la FIA, este es un término comercial del Concorde Agreement que se paga directamente a los diez equipos existentes, no a la FIA. El propio camino de Cadillac ilustra la secuencia: registró interés junto con varios otros candidatos, y la FIA confirmó que había cumplido los criterios de selección antes de que la cifra comercial anti-dilución siquiera se terminara de definir con los equipos existentes.""",
                },
            },
        },
    },
    {
        "slug": "prize-money",
        "group_id": "9fd03d52-f511-48a8-a971-86e6a87867fb",
        "category": "revenue",
        "related_terms": ["concorde-agreement", "cost-cap", "hosting-fee"],
        "sources": [
            {"name": "Motor Sport Magazine — F1 prize money: how much do teams and drivers really make?", "url": "https://www.motorsportmagazine.com/articles/single-seaters/f1/f1-prize-money-how-much-do-gp-teams-and-drivers-really-make/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Prize Money",
                    "short_definition": "F1 pays teams based on where they finish in the season-long standings, not race by race — like a fantasy sports league that pays out once at the end of the season based on final rank, not a bonus every single week.",
                    "body_markdown": """If you've ever played in a fantasy sports league, you know the real payout comes at the end of the season based on final standing — not a little check every week you happen to win. F1's prize money works the same way.

A team can win a Grand Prix on Sunday and that specific win doesn't trigger a payment tied to it. What actually determines the money is the Constructors' Championship table at the very end of the year — finish 2nd instead of 3rd, and that's worth real money, whether or not either position included an actual race win.

The pool is enormous — reported around $1.6 billion a year — split mostly by final position, with a bit extra for teams that have been around the longest, and a historic bonus specifically for Ferrari, the only team that's competed in every F1 season since 1950.""",
                },
                "es": {
                    "term": "Premio en Dinero (Prize Money)",
                    "short_definition": "F1 paga a los equipos según dónde terminan en la clasificación de toda la temporada, no carrera por carrera — como una liga de fantasy que paga una sola vez al final de la temporada según la posición final, no un bono cada semana.",
                    "body_markdown": """Si alguna vez jugaste en una liga de fantasy deportivo, sabés que el pago de verdad llega al final de la temporada según la posición final — no un chequecito cada semana que ganás. El premio en dinero de F1 funciona igual.

Un equipo puede ganar un Gran Premio el domingo y esa victoria puntual no dispara un pago ligado a ella. Lo que realmente determina la plata es la tabla del Campeonato de Constructores al final del año — terminar 2do en vez de 3ro vale plata real, hayan tenido o no una victoria de carrera en el medio.

El fondo es enorme — reportado en unos $1.600 millones al año — repartido mayormente por posición final, con algo extra para los equipos con más trayectoria, y un bono histórico específico para Ferrari, el único equipo que compitió en cada temporada de F1 desde 1950.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Prize Money",
                    "short_definition": "Prize money isn't an FIA regulation at all — it's a commercial term set entirely within the Concorde Agreement between the Commercial Rights Holder and the teams. The FIA's only real connection to it is administering the Constructors' Championship classification that the payout formula is keyed to.",
                    "body_markdown": """**A common misconception worth correcting:** because F1 races under FIA sanction, it's easy to assume the FIA sets or distributes the prize money. It doesn't. The payout formula, the pool size, and the distribution schedule are commercial terms negotiated confidentially within the Concorde Agreement between the sport's Commercial Rights Holder and the ten (now eleven) teams — the FIA isn't party to setting that formula.

**Where the FIA's role actually sits:** the FIA's involvement is upstream of the money, not in it. Through the Sporting Regulations, the FIA governs how races are run, how results are classified, how points are awarded, and how the Constructors' Championship standings are certified at each round and at season's end. Prize money is then paid out against *that* certified classification — so the FIA's real function is guaranteeing the standings the payout depends on are legitimate, not deciding who gets paid what.

**Why the split holds up in practice:** it means a dispute over a race result (a penalty, a disqualification) is resolved through FIA stewarding and appeals processes under the Sporting Regulations, while a dispute over how much a given championship position is actually worth in dollars is a commercial matter under the Concorde Agreement — two different rulebooks, two different processes, for two genuinely different questions.""",
                },
                "es": {
                    "term": "Premio en Dinero (Prize Money)",
                    "short_definition": "El premio en dinero no es en absoluto una regulación de la FIA — es un término comercial fijado enteramente dentro del Concorde Agreement entre el Titular de los Derechos Comerciales y los equipos. La única conexión real de la FIA con esto es administrar la clasificación del Campeonato de Constructores a la que está ligada la fórmula de pago.",
                    "body_markdown": """**Una confusión común que vale la pena corregir:** como F1 corre bajo sanción de la FIA, es fácil asumir que la FIA fija o reparte el premio en dinero. No es así. La fórmula de pago, el tamaño del fondo, y el cronograma de distribución son términos comerciales negociados de forma confidencial dentro del Concorde Agreement entre el Titular de los Derechos Comerciales del deporte y los diez (ahora once) equipos — la FIA no es parte de fijar esa fórmula.

**Dónde está realmente el rol de la FIA:** la participación de la FIA está río arriba de la plata, no adentro de ella. A través del Reglamento Deportivo, la FIA rige cómo se corren las carreras, cómo se clasifican los resultados, cómo se otorgan los puntos, y cómo se certifica la clasificación del Campeonato de Constructores en cada fecha y al final de la temporada. El premio en dinero se paga después contra *esa* clasificación certificada — así que la función real de la FIA es garantizar que la clasificación de la que depende el pago sea legítima, no decidir quién cobra qué.

**Por qué esa división funciona en la práctica:** significa que una disputa sobre un resultado de carrera (una penalización, una descalificación) se resuelve mediante los procesos de comisarios y apelaciones de la FIA bajo el Reglamento Deportivo, mientras que una disputa sobre cuánto vale en dólares una posición de campeonato determinada es un asunto comercial bajo el Concorde Agreement — dos reglamentos distintos, dos procesos distintos, para dos preguntas genuinamente diferentes.""",
                },
            },
        },
    },
    {
        "slug": "hosting-fee",
        "group_id": "e837a0cf-7e59-426b-b3dd-ca6f22dfddbe",
        "category": "revenue",
        "related_terms": ["prize-money", "concorde-agreement"],
        "sources": [
            {"name": "RacingNews365 — How much each circuit on the calendar pays F1", "url": "https://racingnews365.com/how-much-each-circuit-on-the-calendar-pays-to-formula-1"},
            {"name": "Motorsport.com — FIA Grade 1 circuits: what they are and why they can host F1 races", "url": "https://www.motorsport.com/f1/news/fia-grade-1-what-it-means-and-why-its-the-minimum-to-host-an-f1-race/10772878/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Hosting Fee",
                    "short_definition": "The hosting fee is what a circuit pays F1 every year just for the right to have a race there — like renting a wedding venue, you pay the fixed rental whether 50 guests show up or 500.",
                    "body_markdown": """Book a venue for a wedding and you pay the rental fee whether the party is packed or half-empty, whether it rains or shines — the venue gets paid for hosting, full stop, separate from how the actual event turns out.

That's exactly how F1's hosting fee works. A circuit pays Formula One Management a fixed amount, typically somewhere between $15 million and $55 million a year, purely for the right to put a Grand Prix on the calendar. It doesn't matter if the race is a classic or a dud, if the grandstands sell out or sit empty — the fee is owed either way.

It's why hosting fees vary so wildly: some races (state-backed events with tourism budgets behind them, rather than needing ticket sales to cover costs) can afford the high end of that range, while historic races with strong brand value on their own can sometimes negotiate paying less.""",
                },
                "es": {
                    "term": "Cuota de Sede (Hosting Fee)",
                    "short_definition": "La cuota de sede es lo que un circuito le paga a F1 cada año solo por el derecho de tener una carrera ahí — como alquilar un salón de fiestas, pagás el alquiler fijo aunque vengan 50 invitados o 500.",
                    "body_markdown": """Reservá un salón para un casamiento y pagás el alquiler tanto si la fiesta está a full como si está medio vacía, llueva o brille el sol — al salón le pagan por dar el lugar, punto, separado de cómo termine saliendo el evento en sí.

Así funciona exactamente la cuota de sede de F1. Un circuito le paga a Formula One Management una cantidad fija, típicamente entre $15 y $55 millones al año, puramente por el derecho de poner un Gran Premio en el calendario. No importa si la carrera es un clásico o un embole, si las tribunas se agotan o quedan vacías — la cuota se debe de todos modos.

Por eso las cuotas de sede varían tanto: algunas carreras (eventos respaldados por el estado con presupuestos de turismo detrás, en vez de necesitar la venta de entradas para cubrir costos) pueden pagar el extremo alto de ese rango, mientras que carreras históricas con fuerte valor de marca propio a veces pueden negociar pagar menos.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Hosting Fee",
                    "short_definition": "The hosting fee itself is a commercial contract between a circuit and Formula One Management, not an FIA regulation — but no circuit can host a round of the World Championship at all without first clearing a separate FIA requirement: a Grade 1 circuit license, the top tier of a seven-level FIA safety and design classification system.",
                    "body_markdown": """**The commercial fee and the safety license are two entirely separate gates.** Negotiating and paying a hosting fee is a matter between a circuit (or its promoter) and Formula One Management — the FIA has no role in setting or approving that number. But before any of that commercial negotiation even matters, the circuit has to physically qualify to host F1 at all.

**FIA Grade 1 licensing:** F1 requires a circuit to hold FIA Grade 1 certification, the top of a seven-tier grading system covering everything from small club circuits up to the venues capable of hosting the fastest, most powerful cars in motorsport. Grade 1 circuits must meet strict physical requirements — a length between roughly 3.5km and 7km, and barrier, runoff, and medical-facility standards specifically calibrated for cars far more powerful than what a lower grade needs to handle.

**The homologation process:** to earn Grade 1 status, a circuit undergoes FIA safety simulations, a design review by the FIA's Circuits Commission, and an inspection process carried out during and after construction by an assigned FIA inspector, before certification is formally granted.

**Why the sequencing matters:** a circuit's promoter could theoretically be willing to pay any hosting fee Formula One Management asks — but without Grade 1 certification, no fee negotiation is even relevant, since the FIA simply won't sanction a World Championship round there. Grade 1 is the non-negotiable regulatory floor underneath a purely commercial deal.""",
                },
                "es": {
                    "term": "Cuota de Sede (Hosting Fee)",
                    "short_definition": "La cuota de sede en sí es un contrato comercial entre un circuito y Formula One Management, no una regulación de la FIA — pero ningún circuito puede albergar una fecha del Campeonato del Mundo sin antes cumplir un requisito separado de la FIA: la licencia Grado 1, el nivel más alto de un sistema de clasificación de seguridad y diseño de la FIA de siete niveles.",
                    "body_markdown": """**La cuota comercial y la licencia de seguridad son dos filtros completamente separados.** Negociar y pagar una cuota de sede es un asunto entre un circuito (o su promotor) y Formula One Management — la FIA no tiene ningún rol en fijar o aprobar esa cifra. Pero antes de que esa negociación comercial siquiera importe, el circuito tiene que calificar físicamente para albergar F1.

**Licencia FIA Grado 1:** F1 exige que un circuito tenga la certificación FIA Grado 1, la cima de un sistema de clasificación de siete niveles que va desde pequeños circuitos de club hasta sedes capaces de albergar los autos más rápidos y potentes del automovilismo. Los circuitos Grado 1 deben cumplir requisitos físicos estrictos — una longitud de entre aproximadamente 3,5km y 7km, y estándares de barreras, zonas de escape e instalaciones médicas específicamente calibrados para autos mucho más potentes de lo que necesita manejar un grado inferior.

**El proceso de homologación:** para ganar el estatus Grado 1, un circuito pasa por simulaciones de seguridad de la FIA, una revisión de diseño de la Comisión de Circuitos de la FIA, y un proceso de inspección llevado a cabo durante y después de la construcción por un inspector asignado de la FIA, antes de que se otorgue formalmente la certificación.

**Por qué importa ese orden:** el promotor de un circuito podría en teoría estar dispuesto a pagar cualquier cuota de sede que pida Formula One Management — pero sin la certificación Grado 1, ninguna negociación de cuota es siquiera relevante, porque la FIA directamente no va a sancionar una fecha del Campeonato del Mundo ahí. Grado 1 es el piso regulatorio no negociable debajo de un acuerdo puramente comercial.""",
                },
            },
        },
    },
    {
        "slug": "title-sponsorship",
        "group_id": "9ee3c5c8-9151-4e1d-b7d0-35b2eda5efd0",
        "category": "sponsorship",
        "related_terms": ["cost-cap"],
        "sources": [
            {"name": "Wikipedia — Formula One sponsorship liveries", "url": "https://en.wikipedia.org/wiki/Formula_One_sponsorship_liveries"},
            {"name": "RaceFans.net — F1 Commission agrees changes to rules on car liveries and driver numbers for 2026", "url": "https://www.racefans.net/2025/11/14/f1-commission-agrees-changes-to-rules-on-car-liveries-and-driver-numbers-for-2026/"},
        ],
        "layers": {
            "eli5": {
                "en": {
                    "term": "Title Sponsorship",
                    "short_definition": "A title sponsor pays for its name to become part of a team's identity — the F1 equivalent of a company buying the naming rights to a stadium, except here it's buying naming rights to the whole team.",
                    "body_markdown": """You've seen naming-rights deals in other sports — a bank or an airline pays to put its name on a stadium, and suddenly that's just what people call the building. F1's title sponsorship works the same way, except the "building" is an entire race team.

"Oracle Red Bull Racing" isn't Red Bull's official legal team name for fun — Oracle paid for that name to be part of how the team is announced, broadcast, and branded everywhere it appears. In exchange, the sponsor's name and logo become inseparable from the team's public identity for as long as the deal runs.

These deals are big money — top teams can pull in over $100 million a year from a single title sponsor — and unlike almost everything else in F1's economics, there's no rulebook capping how large that number can get.""",
                },
                "es": {
                    "term": "Patrocinio Título (Title Sponsorship)",
                    "short_definition": "Un patrocinador título paga para que su nombre se vuelva parte de la identidad de un equipo — el equivalente en F1 de que una empresa compre los derechos de nombre de un estadio, solo que acá compra los derechos de nombre de todo el equipo.",
                    "body_markdown": """Ya viste acuerdos de naming rights en otros deportes — un banco o una aerolínea paga para poner su nombre en un estadio, y de repente así le dice todo el mundo al edificio. El patrocinio título de F1 funciona igual, solo que el "edificio" es un equipo de carrera entero.

"Oracle Red Bull Racing" no es el nombre legal oficial del equipo de Red Bull por gusto — Oracle pagó para que ese nombre sea parte de cómo se anuncia, transmite y marca al equipo en todos lados donde aparece. A cambio, el nombre y el logo del patrocinador se vuelven inseparables de la identidad pública del equipo mientras dure el acuerdo.

Son acuerdos de plata grande — los equipos top pueden llevarse más de $100 millones al año de un solo patrocinador título — y a diferencia de casi todo lo demás en la economía de F1, no hay ningún reglamento que le ponga un techo a esa cifra.""",
                },
            },
            "fia": {
                "en": {
                    "term": "Title Sponsorship",
                    "short_definition": "The FIA places zero limit on how much a title sponsor can pay — but it tightly regulates what can actually be advertised on the car at all, banning political and religious messaging outright and enforcing a hard tobacco-sponsorship ban since 2006, right down to policing liveries that come close to evoking a banned sponsor visually.",
                    "body_markdown": """**No cap on value, real limits on content:** unlike the cost cap or the anti-dilution fee, the FIA doesn't regulate title sponsorship deal size at all — that's purely commercial, negotiated between team and sponsor. What the FIA does control is *what's allowed to be advertised* on the car and team in the first place, regardless of how much money is on the table.

**What's flatly prohibited:** advertising that is political or religious in nature, or that's judged prejudicial to the interests of the FIA, is banned outright — a sponsor's money doesn't buy an exception.

**The tobacco precedent:** F1's most consequential advertising ban is tobacco sponsorship, phased out by the end of the 2006 season as regulatory pressure built — most directly the EU's Tobacco Advertising Directive, which imposed a comprehensive ban across member states from 2005. Tobacco brands had been some of F1's biggest sponsors for decades before this.

**Enforcement doesn't stop at literal branding:** the FIA has gone after liveries that evoke a banned sponsor even without using its name. Ferrari's white barcode-style stripes, used from 2007 to 2010, closely resembled a Marlboro pack design when viewed in motion or at low resolution — after complaints from anti-tobacco groups, the FIA ruled it constituted subliminal advertising and ordered its removal in 2010, years after the direct branding itself had already been banned.""",
                },
                "es": {
                    "term": "Patrocinio Título (Title Sponsorship)",
                    "short_definition": "La FIA no pone ningún límite a cuánto puede pagar un patrocinador título — pero sí regula estrictamente qué se puede publicitar en el auto en primer lugar, prohibiendo directamente los mensajes políticos y religiosos, y aplicando una prohibición dura al patrocinio de tabaco desde 2006, hasta el punto de vigilar liveries que se acercan a evocar visualmente a un patrocinador prohibido.",
                    "body_markdown": """**Sin techo al valor, límites reales al contenido:** a diferencia del tope de gastos o la cuota anti-dilución, la FIA no regula para nada el tamaño de un acuerdo de patrocinio título — eso es puramente comercial, negociado entre equipo y patrocinador. Lo que sí controla la FIA es *qué se puede publicitar* en el auto y el equipo en primer lugar, sin importar cuánta plata haya en juego.

**Qué está directamente prohibido:** la publicidad de naturaleza política o religiosa, o que se considere perjudicial para los intereses de la FIA, está prohibida directamente — la plata de un patrocinador no compra una excepción.

**El precedente del tabaco:** la prohibición publicitaria más relevante de F1 es la del patrocinio de tabaco, eliminada gradualmente hacia el final de la temporada 2006 a medida que crecía la presión regulatoria — principalmente la Directiva de Publicidad de Tabaco de la UE, que impuso una prohibición integral en los países miembros desde 2005. Las marcas de tabaco habían sido algunos de los patrocinadores más grandes de F1 durante décadas antes de esto.

**La fiscalización no se detiene en el branding literal:** la FIA persiguió liveries que evocaban a un patrocinador prohibido incluso sin usar su nombre. Las franjas blancas estilo código de barras de Ferrari, usadas de 2007 a 2010, se parecían mucho al diseño de un paquete de Marlboro cuando se veían en movimiento o en baja resolución — tras denuncias de grupos antitabaco, la FIA determinó que constituía publicidad subliminal y ordenó su eliminación en 2010, años después de que la publicidad directa ya estuviera prohibida.""",
                },
            },
        },
    },
]


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    inserted = 0
    for entry in TERMS:
        for depth, by_locale in entry["layers"].items():
            for locale in ("en", "es"):
                content = by_locale[locale]
                row = {
                    "translation_group_id": entry["group_id"],
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
    print(f"Seeded {inserted} rows ({len(TERMS)} terms x 2 new depths x 2 locales), status=draft")


if __name__ == "__main__":
    main()
