#!/usr/bin/env python3
"""One-time seed for the F1 economics glossary. Run once after applying the
glossary_terms migration. Content is hand-written from real, cited sources
(FIA, Formula1.com, Autosport, Motor Sport Magazine, RacingNews365) — no
invented figures. Where a fact was already published in our own digest
(vol-01/vol-02), that's cited as the source instead of re-deriving it."""

import os
import uuid
from datetime import date, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent.parent.parent / ".env.local" if False else ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

TODAY = date.today().isoformat()

TERMS = [
    {
        "slug": "cost-cap",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "anti-dilution-fee", "title-sponsorship"],
        "sources": [
            {"name": "FIA — Cost Cap Administration", "url": "https://www.fia.com/events/fia-formula-one-world-championship/season-2025/cost-cap-administration"},
            {"name": "Formula1.com — The 2021 F1 cost cap explained", "url": "https://www.formula1.com/en/latest/article/the-2021-f1-cost-cap-explained-what-has-changed-and-why.5O1Te8udKLmkUl4PyVZtUJ"},
        ],
        "en": {
            "term": "Cost Cap",
            "short_definition": "F1's cost cap is a hard annual spending limit on car performance — $215 million for 2026 — designed to stop the richest teams from simply outspending the field. It covers car design, development, and race operations, but excludes driver salaries, marketing, and each team's three highest-paid staff, so it caps performance spending specifically, not total team revenue.",
            "body_markdown": """The FIA introduced Financial Regulations for the 2021 season after unanimous agreement between the FIA, Formula One Management, and every competitor. Before the cap, the highest-spending teams could outdevelop smaller budgets by a factor of three or four — the regulation exists to force convergence in performance instead of just convergence in rulebook interpretation.

**What counts toward the cap:** aerodynamic development, car design, most staff salaries, race operations, testing.

**What doesn't:** driver salaries, marketing and hospitality spend, the three highest-paid non-driver staff at each team (typically the team principal and senior technical directors), and — critically — sponsorship revenue itself. A team can sign a $100M title sponsor without that money touching the cap; the cap governs *spending*, not *income*.

**Enforcement:** the FIA's Cost Cap Administration audits every team's accounts annually. A breach under 5% of the cap is a "minor" overspend (fines, restricted aero testing time). Anything above that is a "material" breach, which can carry championship point deductions or, in the most extreme case, exclusion.

The cap has risen from its original 2021 figure as F1's own cost base (freight, travel, energy) has inflated — $215M is the number for 2026, reviewed and adjusted by the FIA on a defined schedule rather than negotiated ad hoc.""",
        },
        "es": {
            "term": "Tope de Gastos (Cost Cap)",
            "short_definition": "El tope de gastos de F1 es un límite anual duro al gasto en rendimiento del auto — $215 millones para 2026 — pensado para que los equipos más ricos no puedan simplemente gastar más que el resto. Cubre diseño, desarrollo y operaciones de carrera, pero excluye salarios de pilotos, marketing y a los tres empleados mejor pagados de cada equipo — limita el gasto en rendimiento, no el ingreso total del equipo.",
            "body_markdown": """La FIA introdujo las Regulaciones Financieras para la temporada 2021, tras acuerdo unánime entre la FIA, Formula One Management y todos los competidores. Antes del tope, los equipos con más presupuesto podían desarrollar tres o cuatro veces más rápido que los de presupuesto chico — la regla existe para forzar convergencia en rendimiento, no solo en interpretación del reglamento.

**Qué cuenta dentro del tope:** desarrollo aerodinámico, diseño del auto, la mayoría de los salarios de personal, operaciones de carrera, testing.

**Qué no cuenta:** salarios de pilotos, gasto en marketing y hospitalidad, los tres empleados no-piloto mejor pagados de cada equipo (típicamente el jefe de equipo y directores técnicos senior), y — clave — el ingreso por patrocinio en sí. Un equipo puede firmar un patrocinador título de $100M sin que ese dinero toque el tope; el tope regula el *gasto*, no el *ingreso*.

**Cumplimiento:** la Cost Cap Administration de la FIA audita las cuentas de cada equipo anualmente. Un exceso menor al 5% del tope es un "overspend menor" (multas, tiempo restringido de testing aerodinámico). Por encima de eso es un incumplimiento "material", que puede implicar descuento de puntos o, en el caso más extremo, exclusión del campeonato.

El tope subió desde su cifra original de 2021 a medida que la base de costos propia de F1 (flete, viajes, energía) se infló — $215M es la cifra para 2026, revisada y ajustada por la FIA en un cronograma definido, no negociada caso por caso.""",
        },
        "pt": {
            "term": "Teto de Gastos (Cost Cap)",
            "short_definition": "O teto de gastos da F1 é um limite anual rígido para o gasto em desempenho do carro — US$ 215 milhões para 2026 — criado para impedir que as equipes mais ricas simplesmente gastem mais que o resto. Cobre design, desenvolvimento e operações de corrida, mas exclui salários de pilotos, marketing e os três funcionários mais bem pagos de cada equipe — limita o gasto em desempenho, não a receita total da equipe.",
            "body_markdown": """A FIA introduziu os Regulamentos Financeiros para a temporada de 2021, após acordo unânime entre FIA, Formula One Management e todos os competidores. Antes do teto, as equipes com mais orçamento podiam desenvolver três ou quatro vezes mais rápido que as de orçamento menor — a regra existe para forçar convergência em desempenho, não só na interpretação do regulamento.

**O que conta dentro do teto:** desenvolvimento aerodinâmico, design do carro, a maioria dos salários da equipe, operações de corrida, testes.

**O que não conta:** salários de pilotos, gastos com marketing e hospitalidade, os três funcionários não-pilotos mais bem pagos de cada equipe (normalmente o chefe de equipe e diretores técnicos seniores) e — fundamental — a receita de patrocínio em si. Uma equipe pode fechar um patrocinador master de US$ 100M sem que esse dinheiro entre no teto; o teto regula o *gasto*, não a *receita*.

**Fiscalização:** a Cost Cap Administration da FIA audita as contas de cada equipe anualmente. Um excesso abaixo de 5% do teto é um "overspend menor" (multas, tempo restrito de teste aerodinâmico). Acima disso é uma infração "material", que pode significar dedução de pontos ou, no caso mais extremo, exclusão do campeonato.

O teto subiu desde o valor original de 2021 conforme a própria base de custos da F1 (frete, viagens, energia) se inflacionou — US$ 215M é o número para 2026, revisado e ajustado pela FIA em um cronograma definido, não negociado caso a caso.""",
        },
    },
    {
        "slug": "concorde-agreement",
        "category": "regulations",
        "related_terms": ["cost-cap", "anti-dilution-fee", "prize-money"],
        "sources": [
            {"name": "Formula1.com — What the new Concorde Agreement means for F1", "url": "https://www.formula1.com/en/latest/article/analysis-what-the-new-concorde-agreement-means-for-formula-1.1Z97Z6vRwfDTHVhGbSS510"},
            {"name": "Motorsport.com — What is the F1 Concorde Agreement?", "url": "https://www.motorsport.com/f1/news/what-is-the-f1-concorde-agreement-all-to-know-about-the-contract/10703778/"},
        ],
        "en": {
            "term": "Concorde Agreement",
            "short_definition": "The Concorde Agreement is the private contract between the FIA, Formula One Management, and every competing team that defines how F1 is actually run: how TV and commercial revenue is split, each team's obligation to enter every race, and the entry terms for new constructors. The cost cap and entry fee both live inside it. The current agreement covers the 2026–2030 period.",
            "body_markdown": """First signed in 1981 to end a governance war between the FIA's predecessor (FISA) and the Formula One Constructors' Association, the Concorde Agreement is F1's constitution — it's named for the FIA's former Paris offices on Place de la Concorde, where it was first negotiated.

It's not public. Unlike the FIA's Sporting and Technical Regulations, the Concorde Agreement's exact commercial terms are confidential between the signatories — most of what's publicly known comes from leaks, team disclosures, or figures the FIA chooses to publish (like the cost cap number).

What it actually locks in:
- **Revenue share** — how F1's TV, hosting-fee, and sponsorship income splits between the commercial rights holder and the ten (now eleven) teams.
- **Participation obligation** — a signed team cannot simply skip a race on the calendar.
- **Entry terms for new teams** — the anti-dilution fee mechanism that new constructors like Cadillac had to pay is a Concorde Agreement term, not a separate FIA rule.
- **Governance structure** — voting rights on regulation changes between FIA, FOM, and teams.

Every Concorde Agreement has an expiry, which is why "will the next one get signed" periodically becomes real financial uncertainty for teams making multi-year investment decisions — the current cycle runs 2026–2030.""",
        },
        "es": {
            "term": "Acuerdo de la Concordia (Concorde Agreement)",
            "short_definition": "El Concorde Agreement es el contrato privado entre la FIA, Formula One Management y cada equipo competidor que define cómo se maneja realmente F1: cómo se reparte el ingreso comercial y de TV, la obligación de cada equipo de correr todas las carreras, y los términos de entrada para nuevos constructores. El tope de gastos y la cuota de entrada viven adentro de este acuerdo. El acuerdo actual cubre el período 2026–2030.",
            "body_markdown": """Firmado por primera vez en 1981 para terminar una guerra de gobernanza entre el predecesor de la FIA (FISA) y la Formula One Constructors' Association, el Concorde Agreement es la constitución de F1 — se llama así por las antiguas oficinas de la FIA en París, en la Place de la Concorde, donde se negoció por primera vez.

No es público. A diferencia de los Reglamentos Deportivo y Técnico de la FIA, los términos comerciales exactos del Concorde Agreement son confidenciales entre las partes firmantes — la mayoría de lo que se sabe públicamente viene de filtraciones, declaraciones de equipos, o cifras que la FIA decide publicar (como el número del tope de gastos).

Qué fija en concreto:
- **Reparto de ingresos** — cómo se divide el ingreso de TV, cuotas de sede y patrocinio de F1 entre el titular de los derechos comerciales y los diez (ahora once) equipos.
- **Obligación de participación** — un equipo firmante no puede simplemente saltarse una carrera del calendario.
- **Términos de entrada para nuevos equipos** — el mecanismo de la cuota anti-dilución que tuvo que pagar un constructor nuevo como Cadillac es un término del Concorde Agreement, no una regla separada de la FIA.
- **Estructura de gobernanza** — derechos de voto sobre cambios de reglamento entre FIA, FOM y equipos.

Cada Concorde Agreement tiene una fecha de vencimiento, por eso "si se va a firmar el próximo" se vuelve periódicamente una incertidumbre financiera real para equipos que están tomando decisiones de inversión a varios años — el ciclo actual corre 2026–2030.""",
        },
        "pt": {
            "term": "Acordo da Concórdia (Concorde Agreement)",
            "short_definition": "O Concorde Agreement é o contrato privado entre a FIA, a Formula One Management e todas as equipes competidoras que define como a F1 realmente funciona: como a receita de TV e comercial é dividida, a obrigação de cada equipe de disputar todas as corridas, e os termos de entrada para novas construtoras. O teto de gastos e a taxa de entrada existem dentro dele. O acordo atual cobre o período de 2026 a 2030.",
            "body_markdown": """Assinado pela primeira vez em 1981 para encerrar uma guerra de governança entre o antecessor da FIA (FISA) e a Formula One Constructors' Association, o Concorde Agreement é a constituição da F1 — o nome vem dos antigos escritórios da FIA em Paris, na Place de la Concorde, onde foi negociado pela primeira vez.

Não é público. Ao contrário dos Regulamentos Esportivo e Técnico da FIA, os termos comerciais exatos do Concorde Agreement são confidenciais entre as partes signatárias — a maior parte do que se sabe publicamente vem de vazamentos, declarações de equipes, ou números que a FIA decide publicar (como o valor do teto de gastos).

O que ele realmente define:
- **Divisão de receita** — como a receita de TV, taxas de sede e patrocínio da F1 é dividida entre o detentor dos direitos comerciais e as dez (agora onze) equipes.
- **Obrigação de participação** — uma equipe signatária não pode simplesmente pular uma corrida do calendário.
- **Termos de entrada para novas equipes** — o mecanismo da taxa antidiluição que uma nova construtora como a Cadillac teve que pagar é um termo do Concorde Agreement, não uma regra separada da FIA.
- **Estrutura de governança** — direitos de voto sobre mudanças de regulamento entre FIA, FOM e equipes.

Todo Concorde Agreement tem uma data de expiração, por isso "se o próximo vai ser assinado" periodicamente vira uma incerteza financeira real para equipes tomando decisões de investimento de vários anos — o ciclo atual vai de 2026 a 2030.""",
        },
    },
    {
        "slug": "anti-dilution-fee",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "cost-cap"],
        "sources": [
            {"name": "Autosport — The Cadillac calculus F1 has made", "url": "https://www.autosport.com/f1/news/the-cadillac-calculus-f1-has-made-that-weighs-up-450m-today-vs-billions-tomorrow/10795676/"},
        ],
        "en": {
            "term": "Anti-Dilution Fee",
            "short_definition": "The anti-dilution fee is what a new team pays the existing grid to join F1 — compensation for shrinking everyone else's slice of the shared prize-money pool. The 2021 Concorde Agreement set the floor at $200 million; Cadillac paid $450 million, split among the ten incumbent teams, to secure its 2026 entry.",
            "body_markdown": """Every team on the grid earns a share of F1's prize money based on constructors' championship position. Add an eleventh team and that same pool gets split eleven ways instead of ten — every existing team's cut shrinks, even if their on-track performance doesn't change at all.

The anti-dilution fee exists to compensate for exactly that. It's not a fine, not a licensing fee to the FIA, and it doesn't go to Formula One Management — it's paid directly to the ten existing teams, split according to a formula the Concorde Agreement defines.

The number itself is negotiated, not fixed by regulation. The 2021 Concorde Agreement set a $200 million floor. When Cadillac (backed by General Motors) pursued entry for 2026, the existing teams initially pushed for figures as high as $600 million before a $450 million figure was agreed ahead of the 2025 Australian Grand Prix — more than double the original floor, reflecting how much F1's commercial value has grown since 2021.

This is a different mechanism from the cost cap: the cost cap limits ongoing annual spending, while the anti-dilution fee is a one-time payment to enter at all.""",
        },
        "es": {
            "term": "Cuota Anti-Dilución (Anti-Dilution Fee)",
            "short_definition": "La cuota anti-dilución es lo que paga un equipo nuevo a la parrilla existente para entrar a F1 — compensación por achicar la porción de cada uno en el fondo compartido de premios. El Concorde Agreement de 2021 fijó el piso en $200 millones; Cadillac pagó $450 millones, repartidos entre los diez equipos existentes, para asegurar su entrada en 2026.",
            "body_markdown": """Cada equipo de la parrilla gana una parte del premio de F1 según su posición en el campeonato de constructores. Agregar un onceavo equipo hace que ese mismo fondo se reparta entre once en vez de diez — la porción de cada equipo existente se achica, aunque su rendimiento en pista no cambie en nada.

La cuota anti-dilución existe para compensar exactamente eso. No es una multa, no es una cuota de licencia a la FIA, y no va a Formula One Management — se paga directamente a los diez equipos existentes, repartida según una fórmula que define el Concorde Agreement.

El número en sí se negocia, no lo fija un reglamento. El Concorde Agreement de 2021 fijó un piso de $200 millones. Cuando Cadillac (respaldado por General Motors) buscó entrar para 2026, los equipos existentes inicialmente pidieron cifras de hasta $600 millones antes de que se acordara la cifra de $450 millones previo al Gran Premio de Australia de 2025 — más del doble del piso original, lo que refleja cuánto creció el valor comercial de F1 desde 2021.

Este es un mecanismo distinto al tope de gastos: el tope de gastos limita el gasto anual continuo, mientras que la cuota anti-dilución es un pago único para poder entrar.""",
        },
        "pt": {
            "term": "Taxa Antidiluição (Anti-Dilution Fee)",
            "short_definition": "A taxa antidiluição é o que uma equipe nova paga ao grid existente para entrar na F1 — compensação por diminuir a fatia de todo mundo no fundo compartilhado de premiação. O Concorde Agreement de 2021 fixou o piso em US$ 200 milhões; a Cadillac pagou US$ 450 milhões, divididos entre as dez equipes existentes, para garantir sua entrada em 2026.",
            "body_markdown": """Cada equipe do grid ganha uma parte da premiação da F1 com base na posição no campeonato de construtores. Adicionar uma décima primeira equipe faz com que esse mesmo fundo seja dividido em onze partes em vez de dez — a fatia de cada equipe existente diminui, mesmo que o desempenho em pista delas não mude em nada.

A taxa antidiluição existe para compensar exatamente isso. Não é uma multa, não é uma taxa de licenciamento para a FIA, e não vai para a Formula One Management — é paga diretamente às dez equipes existentes, dividida segundo uma fórmula definida pelo Concorde Agreement.

O valor em si é negociado, não fixado por regulamento. O Concorde Agreement de 2021 fixou um piso de US$ 200 milhões. Quando a Cadillac (apoiada pela General Motors) buscou entrada para 2026, as equipes existentes inicialmente pediram valores de até US$ 600 milhões antes de se chegar a um acordo de US$ 450 milhões antes do GP da Austrália de 2025 — mais do dobro do piso original, refletindo o quanto o valor comercial da F1 cresceu desde 2021.

Esse é um mecanismo diferente do teto de gastos: o teto de gastos limita o gasto anual contínuo, enquanto a taxa antidiluição é um pagamento único para poder entrar.""",
        },
    },
    {
        "slug": "prize-money",
        "category": "revenue",
        "related_terms": ["concorde-agreement", "cost-cap", "hosting-fee"],
        "sources": [
            {"name": "Motor Sport Magazine — F1 prize money: how much do teams and drivers really make?", "url": "https://www.motorsportmagazine.com/articles/single-seaters/f1/f1-prize-money-how-much-do-gp-teams-and-drivers-really-make/"},
        ],
        "en": {
            "term": "Prize Money",
            "short_definition": "F1 distributes roughly $1.6 billion a year to the teams — about 45% of its total operating income — almost entirely based on constructors' championship position, not individual race results. Unlike most sports, there's no separate payout for winning a Grand Prix; the entire season's points table determines each team's cut once, at year-end.",
            "body_markdown": """This is one of the more counter-intuitive parts of F1's economics: a driver who wins a race on Sunday doesn't trigger any prize-money payment tied to that specific result. The Constructors' Championship table at the end of the season is what determines the payout — win or lose any single Grand Prix, what actually moves the money is where a team's combined car finishes in the standings by December.

The pool itself — reported around $1.6 billion annually — is split roughly along these lines:
- The large majority is distributed by final constructors' championship position, with the champion earning the biggest share and each subsequent position earning progressively less.
- A separate, smaller pool rewards "long-standing" competitors — teams with a long history in the sport get an additional cut independent of where they finished that year.
- Ferrari specifically receives an additional historic/heritage payment, a legacy term dating back decades in F1's commercial agreements, tied to its status as the only team to have competed in every F1 season since 1950.

Because the payout is proportional and season-long rather than race-by-race, a team's financial year can look completely different from its headline results — finishing 2nd instead of 3rd in the standings is worth real money even if neither position produced a single race win.""",
        },
        "es": {
            "term": "Premio en Dinero (Prize Money)",
            "short_definition": "F1 distribuye cerca de $1.600 millones al año entre los equipos — alrededor del 45% de su ingreso operativo total — casi enteramente basado en la posición en el campeonato de constructores, no en resultados de carreras individuales. A diferencia de la mayoría de los deportes, no hay un pago separado por ganar un Gran Premio; la tabla de puntos de toda la temporada determina la parte de cada equipo una sola vez, a fin de año.",
            "body_markdown": """Esta es una de las partes más contraintuitivas de la economía de F1: un piloto que gana una carrera el domingo no dispara ningún pago de premio ligado a ese resultado específico. La tabla del Campeonato de Constructores al final de la temporada es lo que determina el pago — ganar o perder cualquier Gran Premio individual no mueve la plata; lo que la mueve es dónde termina el auto combinado de un equipo en la clasificación para diciembre.

El fondo en sí — reportado en unos $1.600 millones anuales — se reparte más o menos así:
- La gran mayoría se distribuye por posición final en el campeonato de constructores, con el campeón ganando la mayor parte y cada posición siguiente ganando progresivamente menos.
- Un fondo separado y más chico premia a competidores "de larga trayectoria" — equipos con mucha historia en el deporte reciben una parte adicional independiente de dónde terminaron ese año.
- Ferrari en particular recibe un pago histórico/de legado adicional, un término heredado de décadas en los acuerdos comerciales de F1, ligado a su estatus como el único equipo que compitió en cada temporada de F1 desde 1950.

Como el pago es proporcional y de toda la temporada en vez de carrera por carrera, el año financiero de un equipo puede verse completamente distinto a sus resultados destacados — terminar 2do en vez de 3ro en la clasificación vale plata real, aunque ninguna de las dos posiciones haya producido una sola victoria de carrera.""",
        },
        "pt": {
            "term": "Premiação (Prize Money)",
            "short_definition": "A F1 distribui cerca de US$ 1,6 bilhão por ano entre as equipes — cerca de 45% de sua receita operacional total — quase inteiramente com base na posição no campeonato de construtores, não em resultados de corridas individuais. Diferente da maioria dos esportes, não existe um pagamento separado por vencer um Grande Prêmio; a tabela de pontos da temporada inteira determina a fatia de cada equipe uma única vez, no fim do ano.",
            "body_markdown": """Essa é uma das partes mais contraintuitivas da economia da F1: um piloto que vence uma corrida no domingo não gera nenhum pagamento de premiação ligado a esse resultado específico. A tabela do Campeonato de Construtores no fim da temporada é o que determina o pagamento — vencer ou perder qualquer Grande Prêmio isolado não move o dinheiro; o que move é onde o carro combinado de uma equipe termina na classificação até dezembro.

O fundo em si — reportado em cerca de US$ 1,6 bilhão por ano — é dividido mais ou menos assim:
- A grande maioria é distribuída pela posição final no campeonato de construtores, com o campeão ganhando a maior fatia e cada posição seguinte ganhando progressivamente menos.
- Um fundo separado e menor premia competidores "de longa data" — equipes com longa história no esporte recebem uma fatia adicional independente de onde terminaram naquele ano.
- A Ferrari especificamente recebe um pagamento histórico/de legado adicional, um termo herdado de décadas nos acordos comerciais da F1, ligado ao seu status de única equipe a competir em todas as temporadas da F1 desde 1950.

Como o pagamento é proporcional e vale para a temporada inteira em vez de corrida por corrida, o ano financeiro de uma equipe pode parecer completamente diferente dos seus resultados de destaque — terminar em 2º em vez de 3º na classificação vale dinheiro real, mesmo que nenhuma das duas posições tenha rendido uma única vitória de corrida.""",
        },
    },
    {
        "slug": "hosting-fee",
        "category": "revenue",
        "related_terms": ["prize-money", "concorde-agreement"],
        "sources": [
            {"name": "RacingNews365 — How much each circuit on the calendar pays F1", "url": "https://racingnews365.com/how-much-each-circuit-on-the-calendar-pays-to-formula-1"},
        ],
        "en": {
            "term": "Hosting Fee",
            "short_definition": "The hosting fee is what a circuit or race promoter pays Formula One Management every year for the right to put a Grand Prix on the calendar — typically $15–55 million annually, owed regardless of attendance, weather, or how good the race actually was. It's F1's most predictable revenue stream and made up roughly 29% of the sport's total revenue in 2024.",
            "body_markdown": """Unlike ticket sales or trackside sponsorship — both of which are the promoter's problem, not F1's — the hosting fee is a fixed, contractually guaranteed payment owed to Formula One Management regardless of how the weekend actually goes. A rained-out, poorly attended race still generates the same hosting-fee revenue as a sold-out classic.

Fees vary enormously by circuit and are negotiated individually, not set by a shared formula:
- Long-established European races (Monaco is a well-known example) can pay comparatively little given F1's dependence on the sport's traditional markets for legitimacy.
- Newer races underwritten by state or tourism budgets rather than ticket revenue (several Middle Eastern rounds) sit at the high end of the range, sometimes above $50 million a year.

At the sport level, race promotion fees made up roughly 29% of F1's total revenue in a recent full season — over $1 billion flowing to the commercial rights holder across the calendar annually. That makes the calendar itself, and which circuits are willing to pay top-of-range fees, a direct lever on F1's overall profitability, separate from how competitive the racing is.""",
        },
        "es": {
            "term": "Cuota de Sede (Hosting Fee)",
            "short_definition": "La cuota de sede es lo que un circuito o promotor de carrera le paga a Formula One Management cada año por el derecho de tener un Gran Premio en el calendario — típicamente $15-55 millones anuales, se debe sin importar la asistencia, el clima, o qué tan buena haya sido la carrera. Es el flujo de ingreso más predecible de F1 y representó cerca del 29% del ingreso total del deporte en 2024.",
            "body_markdown": """A diferencia de la venta de entradas o el patrocinio en el circuito — ambos problema del promotor, no de F1 — la cuota de sede es un pago fijo y garantizado por contrato que se le debe a Formula One Management sin importar cómo salga el fin de semana. Una carrera lluviosa y con poca asistencia genera el mismo ingreso por cuota de sede que un clásico a estadio lleno.

Las cuotas varían enormemente según el circuito y se negocian individualmente, no según una fórmula compartida:
- Carreras europeas de larga trayectoria (Mónaco es un ejemplo conocido) pueden pagar comparativamente poco, dado que F1 depende de sus mercados tradicionales para tener legitimidad.
- Carreras más nuevas financiadas por presupuestos estatales o de turismo en vez de venta de entradas (varias fechas de Medio Oriente) están en el extremo alto del rango, a veces por encima de $50 millones al año.

A nivel del deporte, las cuotas de promoción de carreras representaron cerca del 29% del ingreso total de F1 en una temporada completa reciente — más de $1.000 millones fluyendo hacia el titular de los derechos comerciales a lo largo del calendario cada año. Eso hace que el calendario en sí, y qué circuitos están dispuestos a pagar cuotas en el extremo alto, sea una palanca directa sobre la rentabilidad general de F1, separada de qué tan competitivas sean las carreras.""",
        },
        "pt": {
            "term": "Taxa de Sede (Hosting Fee)",
            "short_definition": "A taxa de sede é o que um circuito ou promotor de corrida paga à Formula One Management todo ano pelo direito de ter um Grande Prêmio no calendário — tipicamente US$ 15-55 milhões anuais, devidos independentemente do público, do clima ou de quão boa tenha sido a corrida. É a receita mais previsível da F1 e representou cerca de 29% da receita total do esporte em 2024.",
            "body_markdown": """Diferente da venda de ingressos ou do patrocínio no autódromo — ambos problema do promotor, não da F1 — a taxa de sede é um pagamento fixo e garantido contratualmente devido à Formula One Management independentemente de como o fim de semana realmente ocorra. Uma corrida chuvosa e com pouco público gera a mesma receita de taxa de sede que um clássico com casa cheia.

As taxas variam enormemente por circuito e são negociadas individualmente, não seguindo uma fórmula compartilhada:
- Corridas europeias tradicionais (Mônaco é um exemplo conhecido) podem pagar comparativamente pouco, dado que a F1 depende de seus mercados tradicionais para ter legitimidade.
- Corridas mais novas financiadas por orçamentos estatais ou de turismo em vez de venda de ingressos (várias etapas do Oriente Médio) ficam na ponta alta da faixa, às vezes acima de US$ 50 milhões por ano.

No nível do esporte, as taxas de promoção de corridas representaram cerca de 29% da receita total da F1 em uma temporada completa recente — mais de US$ 1 bilhão fluindo para o detentor dos direitos comerciais ao longo do calendário anualmente. Isso faz do próprio calendário, e de quais circuitos estão dispostos a pagar taxas na ponta alta, uma alavanca direta sobre a rentabilidade geral da F1, separada de quão competitivas as corridas sejam.""",
        },
    },
    {
        "slug": "title-sponsorship",
        "category": "sponsorship",
        "related_terms": ["cost-cap"],
        "sources": [
            {"name": "PaddockIntel Weekly Digest — Vol. 01 (title-sponsor hierarchy)", "url": "https://paddockintel.com/weekly/vol-01-austria-week-2026"},
        ],
        "en": {
            "term": "Title Sponsorship",
            "short_definition": "A title sponsor pays for naming-rights-level branding on the car and team identity — think 'Oracle Red Bull Racing' — and 2026 deals across the grid range from roughly $25 million a year for a mid-grid team to $110 million for a top team. Critically, this money doesn't count against the cost cap, since the cap governs spending, not income.",
            "body_markdown": """Title sponsorship is F1's largest single revenue line for most teams outside of the prize-money and commercial-rights split — and unlike almost every other cost or revenue category in the sport, it's essentially unregulated in size. There's no cap on how much a title sponsor can pay, only on how much of that money the team is allowed to spend on car performance once it arrives.

That asymmetry is deliberate and has reshaped team revenue strategy since the cost cap arrived in 2021: since performance spending is capped regardless of income, a team's financial upside now comes disproportionately from sponsorship and prize money rather than from simply outspending rivals. A bigger title-sponsor check doesn't buy a faster car directly — it funds the parts of the operation the cap doesn't touch, or it's straightforwardly retained as profit.

Deal sizes vary by team competitiveness, market reach, and grid position, roughly:
- **Top-tier teams**: $80–110M/year
- **Strong midfield**: $20–40M/year
- **Smaller/newer teams**: often starting closer to $25M/year and building from there

Technology and AI companies have become one of the fastest-growing categories of new title and technical-partner deals in recent seasons, treating the sport as a high-visibility demonstration platform in front of the same enterprise buyers who watch the broadcast.""",
        },
        "es": {
            "term": "Patrocinio Título (Title Sponsorship)",
            "short_definition": "Un patrocinador título paga por el naming de marca al nivel más alto sobre el auto y la identidad del equipo — pensá en 'Oracle Red Bull Racing' — y los acuerdos de 2026 en la parrilla van desde unos $25 millones anuales para un equipo de mitad de tabla hasta $110 millones para un equipo top. Clave: este dinero no cuenta contra el tope de gastos, porque el tope regula el gasto, no el ingreso.",
            "body_markdown": """El patrocinio título es la línea de ingreso individual más grande de F1 para la mayoría de los equipos, fuera del reparto de premio en dinero y derechos comerciales — y a diferencia de casi cualquier otra categoría de costo o ingreso en el deporte, es esencialmente no regulado en tamaño. No hay tope a cuánto puede pagar un patrocinador título, solo a cuánto de ese dinero puede gastar el equipo en rendimiento del auto una vez que llega.

Esa asimetría es deliberada y reformó la estrategia de ingresos de los equipos desde que llegó el tope de gastos en 2021: como el gasto en rendimiento está topado sin importar el ingreso, el margen financiero de un equipo ahora viene desproporcionadamente del patrocinio y el premio en dinero, no de simplemente gastar más que los rivales. Un cheque más grande de patrocinador título no compra un auto más rápido directamente — financia las partes de la operación que el tope no toca, o directamente se retiene como ganancia.

El tamaño de los acuerdos varía según competitividad del equipo, alcance de mercado y posición en la parrilla, aproximadamente:
- **Equipos top**: $80-110M/año
- **Mitad de tabla fuerte**: $20-40M/año
- **Equipos más chicos/nuevos**: a menudo empezando más cerca de $25M/año y creciendo desde ahí

Las empresas de tecnología e IA se volvieron una de las categorías de más rápido crecimiento en nuevos acuerdos de título y socio técnico en las últimas temporadas, tratando al deporte como una plataforma de demostración de alta visibilidad frente a los mismos compradores corporativos que ven la transmisión.""",
        },
        "pt": {
            "term": "Patrocínio Master (Title Sponsorship)",
            "short_definition": "Um patrocinador master paga pela marca em nível de naming rights sobre o carro e a identidade da equipe — pense em 'Oracle Red Bull Racing' — e os acordos de 2026 no grid vão de cerca de US$ 25 milhões por ano para uma equipe de meio de tabela até US$ 110 milhões para uma equipe de ponta. Fundamental: esse dinheiro não conta para o teto de gastos, já que o teto regula o gasto, não a receita.",
            "body_markdown": """O patrocínio master é a maior linha de receita individual da F1 para a maioria das equipes, fora da divisão de premiação e direitos comerciais — e, diferente de quase qualquer outra categoria de custo ou receita no esporte, é essencialmente não regulado em tamanho. Não há teto para quanto um patrocinador master pode pagar, apenas para quanto desse dinheiro a equipe pode gastar em desempenho do carro depois que ele chega.

Essa assimetria é deliberada e remodelou a estratégia de receita das equipes desde que o teto de gastos chegou em 2021: como o gasto em desempenho é limitado independentemente da receita, o potencial financeiro de uma equipe agora vem desproporcionalmente de patrocínio e premiação, não de simplesmente gastar mais que os rivais. Um cheque maior de patrocinador master não compra um carro mais rápido diretamente — financia as partes da operação que o teto não alcança, ou é simplesmente retido como lucro.

O tamanho dos acordos varia conforme a competitividade da equipe, alcance de mercado e posição no grid, aproximadamente:
- **Equipes de ponta**: US$ 80-110M/ano
- **Meio de tabela forte**: US$ 20-40M/ano
- **Equipes menores/novas**: geralmente começando perto de US$ 25M/ano e crescendo a partir daí

Empresas de tecnologia e IA se tornaram uma das categorias de crescimento mais rápido em novos acordos de patrocínio master e parceiro técnico nas últimas temporadas, tratando o esporte como uma plataforma de demonstração de alta visibilidade diante dos mesmos compradores corporativos que assistem à transmissão.""",
        },
    },
]


def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    inserted = 0
    for entry in TERMS:
        group_id = str(uuid.uuid4())
        for locale in ("en", "es", "pt"):
            content = entry[locale]
            row = {
                "translation_group_id": group_id,
                "locale": locale,
                "slug": entry["slug"],
                "term": content["term"],
                "category": entry["category"],
                "short_definition": content["short_definition"],
                "body_markdown": content["body_markdown"],
                "related_terms": entry["related_terms"],
                "sources": entry["sources"],
                "status": "published",
                "published_at": TODAY,
            }
            sb.table("glossary_terms").upsert(row, on_conflict="locale,slug").execute()
            inserted += 1
    print(f"Seeded {inserted} rows ({len(TERMS)} terms x 3 locales)")


if __name__ == "__main__":
    main()
