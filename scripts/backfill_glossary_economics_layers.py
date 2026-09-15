#!/usr/bin/env python3
"""Backfills the missing eli5 and fia depth layers for the 6 legacy
economics glossary terms (cost-cap, concorde-agreement, anti-dilution-fee,
prize-money, hosting-fee, title-sponsorship), which previously only had
the 'technical' layer. Every fact here is grounded in what's already
published in each term's technical layer -- no new claims introduced,
only reframed at eli5/fia depth. EN+ES+PT, matching the locale coverage
those 6 terms already have. Seeds as 'draft'; publish separately after
visual QA."""

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# slug -> (translation_group_id, category, related_terms, sources)
TERM_META = {
    "cost-cap": {
        "tgid": "31615316-430f-4b09-bf01-269651201491",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "anti-dilution-fee", "title-sponsorship"],
        "sources": [
            {"name": "FIA — Cost Cap Administration", "url": "https://www.fia.com/events/fia-formula-one-world-championship/season-2025/cost-cap-administration"},
            {"name": "Formula1.com — The 2021 F1 cost cap explained", "url": "https://www.formula1.com/en/latest/article/the-2021-f1-cost-cap-explained-what-has-changed-and-why.5O1Te8udKLmkUl4PyVZtUJ"},
        ],
        "terms": {"en": "Cost Cap", "es": "Tope de Gastos (Cost Cap)", "pt": "Teto de Gastos (Cost Cap)"},
    },
    "concorde-agreement": {
        "tgid": "cc44efe4-d936-4b78-85da-d2534f691b8f",
        "category": "regulations",
        "related_terms": ["cost-cap", "anti-dilution-fee", "prize-money"],
        "sources": [
            {"name": "Formula1.com — What the new Concorde Agreement means for F1", "url": "https://www.formula1.com/en/latest/article/analysis-what-the-new-concorde-agreement-means-for-formula-1.1Z97Z6vRwfDTHVhGbSS510"},
            {"name": "Motorsport.com — What is the F1 Concorde Agreement?", "url": "https://www.motorsport.com/f1/news/what-is-the-f1-concorde-agreement-all-to-know-about-the-contract/10703778/"},
        ],
        "terms": {"en": "Concorde Agreement", "es": "Acuerdo de la Concordia (Concorde Agreement)", "pt": "Acordo da Concórdia (Concorde Agreement)"},
    },
    "anti-dilution-fee": {
        "tgid": "ed28c6cd-b89e-44a7-a3c9-e57ee8c0e9c6",
        "category": "regulations",
        "related_terms": ["concorde-agreement", "cost-cap"],
        "sources": [
            {"name": "Autosport — The Cadillac calculus F1 has made", "url": "https://www.autosport.com/f1/news/the-cadillac-calculus-f1-has-made-that-weighs-up-450m-today-vs-billions-tomorrow/10795676/"},
        ],
        "terms": {"en": "Anti-Dilution Fee", "es": "Cuota Anti-Dilución (Anti-Dilution Fee)", "pt": "Taxa Antidiluição (Anti-Dilution Fee)"},
    },
    "prize-money": {
        "tgid": "9fd03d52-f511-48a8-a971-86e6a87867fb",
        "category": "revenue",
        "related_terms": ["concorde-agreement", "cost-cap", "hosting-fee"],
        "sources": [
            {"name": "Motor Sport Magazine — F1 prize money: how much do teams and drivers really make?", "url": "https://www.motorsportmagazine.com/articles/single-seaters/f1/f1-prize-money-how-much-do-gp-teams-and-drivers-really-make/"},
        ],
        "terms": {"en": "Prize Money", "es": "Premio en Dinero (Prize Money)", "pt": "Premiação (Prize Money)"},
    },
    "hosting-fee": {
        "tgid": "e837a0cf-7e59-426b-b3dd-ca6f22dfddbe",
        "category": "revenue",
        "related_terms": ["prize-money", "concorde-agreement"],
        "sources": [
            {"name": "RacingNews365 — How much each circuit on the calendar pays F1", "url": "https://racingnews365.com/how-much-each-circuit-on-the-calendar-pays-to-formula-1"},
        ],
        "terms": {"en": "Hosting Fee", "es": "Cuota de Sede (Hosting Fee)", "pt": "Taxa de Sede (Hosting Fee)"},
    },
    "title-sponsorship": {
        "tgid": "9ee3c5c8-9151-4e1d-b7d0-35b2eda5efd0",
        "category": "sponsorship",
        "related_terms": ["cost-cap"],
        "sources": [
            {"name": "PaddockIntel Weekly Digest — Vol. 01 (title-sponsor hierarchy)", "url": "https://paddockintel.com/weekly/vol-01-austria-week-2026"},
        ],
        "terms": {"en": "Title Sponsorship", "es": "Patrocinio Título (Title Sponsorship)", "pt": "Patrocínio Master (Title Sponsorship)"},
    },
}

# slug -> depth -> locale -> {short_definition, body_markdown}
CONTENT = {
    "cost-cap": {
        "eli5": {
            "en": {
                "short_definition": "The cost cap is F1's allowance system: every team gets the same $215 million ceiling to spend on making their car faster, so a rich team can't just outspend a poor one into always winning.",
                "body_markdown": """Imagine two kids building the same LEGO race car, but one has an unlimited budget for extra parts and the other doesn't — that's F1 before 2021. The cost cap fixes it by handing every team the exact same allowance, $215 million for 2026, to spend on car performance: design, development, race operations. Doesn't matter if a team's owner is a billionaire or the team is barely breaking even — everyone builds within the same number.

It's not a cap on everything a team spends, though. Driver salaries, marketing, and a handful of the most senior staff are carved out on purpose, so teams can still compete hard for star drivers and top engineers without that spending making the car itself any faster. If a team spends over the limit on the parts that DO count, the FIA can fine them, cut their wind tunnel time, or in the worst cases take away championship points.""",
            },
            "es": {
                "short_definition": "El tope de gastos es el sistema de asignación de F1: cada equipo recibe el mismo techo de $215 millones para gastar en hacer su auto más rápido, así un equipo rico no puede simplemente gastar más que uno pobre hasta ganar siempre.",
                "body_markdown": """Imagina a dos chicos armando el mismo auto de carrera de LEGO, pero uno tiene presupuesto ilimitado para piezas extra y el otro no — así era la F1 antes de 2021. El tope de gastos lo arregla dándole a cada equipo exactamente la misma asignación, $215 millones para 2026, para gastar en rendimiento del auto: diseño, desarrollo, operaciones de carrera. No importa si el dueño del equipo es multimillonario o si el equipo apenas cierra sus números — todos construyen con el mismo número.

Eso sí, no es un tope a todo lo que gasta un equipo. Los salarios de pilotos, el marketing, y un puñado de los empleados más senior quedan afuera a propósito, para que los equipos todavía puedan competir fuerte por pilotos estrella e ingenieros top sin que ese gasto haga más rápido al auto en sí. Si un equipo se pasa del límite en las partes que sí cuentan, la FIA puede multarlo, recortarle tiempo de túnel de viento, o en los peores casos quitarle puntos del campeonato.""",
            },
            "pt": {
                "short_definition": "O teto de gastos é o sistema de cota da F1: cada equipe recebe o mesmo teto de US$ 215 milhões para gastar em deixar seu carro mais rápido, assim uma equipe rica não pode simplesmente gastar mais que uma pobre até vencer sempre.",
                "body_markdown": """Imagine duas crianças montando o mesmo carro de corrida de LEGO, mas uma tem orçamento ilimitado para peças extras e a outra não — assim era a F1 antes de 2021. O teto de gastos resolve isso dando a cada equipe exatamente a mesma cota, US$ 215 milhões para 2026, para gastar em desempenho do carro: design, desenvolvimento, operações de corrida. Não importa se o dono da equipe é bilionário ou se a equipe mal fecha as contas — todo mundo constrói com o mesmo número.

Só que não é um teto para tudo que uma equipe gasta. Salários de pilotos, marketing, e um punhado dos funcionários mais seniores ficam de fora de propósito, para que as equipes ainda possam competir forte por pilotos estrela e engenheiros de ponta sem que esse gasto deixe o carro em si mais rápido. Se uma equipe passa do limite nas partes que contam, a FIA pode multar, cortar tempo de túnel de vento, ou nos piores casos tirar pontos do campeonato.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "The cost cap is governed by the FIA's Financial Regulations, a standalone regulatory document separate from the Sporting and Technical Regulations, administered by a dedicated FIA Cost Cap Administration team that audits every constructor's accounts annually.",
                "body_markdown": """**A separate rulebook:** unlike aerodynamic or engine rules, the cost cap doesn't live in F1's Technical or Sporting Regulations — it has its own document, the Financial Regulations, first introduced for 2021 and requiring unanimous agreement from the FIA, Formula One Management, and every competing team to pass.

**Who enforces it:** the FIA's Cost Cap Administration is a dedicated unit, separate from race-weekend stewards, that reviews each team's full annual accounts — not just a spot check, a complete audit against the regulated categories of spend.

**The breach framework:** the regulations define two tiers. A breach under 5% of the cap counts as "minor" and typically draws financial penalties plus a reduction in the offending team's [Aerodynamic Testing Restrictions](/glossary/aerodynamic-testing-restrictions) allowance for the following period. Anything over 5% is a "material" breach, which escalates to potential championship point deductions or, in the most extreme case, exclusion from the championship — the same category of sanction the FIA reserves for its most serious sporting offenses.

**Revision schedule:** the FIA doesn't renegotiate the cap figure ad hoc — it's reviewed and adjusted on a defined schedule tied to actual cost inflation (freight, energy, materials), which is why the number has risen from its original 2021 level to $215 million for 2026 without a fresh unanimous vote each time.""",
            },
            "es": {
                "short_definition": "El tope de gastos está regido por el Reglamento Financiero de la FIA, un documento regulatorio aparte del Reglamento Deportivo y Técnico, administrado por un equipo dedicado de la FIA (Cost Cap Administration) que audita las cuentas de cada constructor cada año.",
                "body_markdown": """**Un reglamento aparte:** a diferencia de las reglas aerodinámicas o de motor, el tope de gastos no vive en el Reglamento Técnico ni en el Deportivo de F1 — tiene su propio documento, el Reglamento Financiero, presentado por primera vez para 2021 y que necesitó acuerdo unánime de la FIA, Formula One Management y cada equipo competidor para aprobarse.

**Quién lo hace cumplir:** la Cost Cap Administration de la FIA es una unidad dedicada, separada de los comisarios de fin de semana de carrera, que revisa las cuentas anuales completas de cada equipo — no un chequeo puntual, sino una auditoría completa contra las categorías de gasto reguladas.

**El marco de infracciones:** el reglamento define dos niveles. Una infracción de menos del 5% del tope cuenta como "menor" y típicamente trae sanciones económicas más una reducción en la asignación de [Restricciones de Testeo Aerodinámico](/glossary/aerodynamic-testing-restrictions) del equipo infractor para el período siguiente. Cualquier cosa por encima del 5% es una infracción "material", que escala hasta posibles descuentos de puntos del campeonato o, en el caso más extremo, la exclusión del campeonato — la misma categoría de sanción que la FIA reserva para sus faltas deportivas más graves.

**Calendario de revisión:** la FIA no renegocia la cifra del tope de forma improvisada — se revisa y ajusta en un calendario definido atado a la inflación real de costos (flete, energía, materiales), por eso el número subió de su nivel original de 2021 a $215 millones para 2026 sin necesitar un nuevo voto unánime cada vez.""",
            },
            "pt": {
                "short_definition": "O teto de gastos é regido pelo Regulamento Financeiro da FIA, um documento regulatório separado do Regulamento Esportivo e Técnico, administrado por uma equipe dedicada da FIA (Cost Cap Administration) que audita as contas de cada construtora todo ano.",
                "body_markdown": """**Um regulamento à parte:** diferente das regras aerodinâmicas ou de motor, o teto de gastos não vive no Regulamento Técnico nem no Esportivo da F1 — tem seu próprio documento, o Regulamento Financeiro, apresentado pela primeira vez para 2021 e que precisou de acordo unânime da FIA, da Formula One Management e de cada equipe competidora para ser aprovado.

**Quem faz cumprir:** a Cost Cap Administration da FIA é uma unidade dedicada, separada dos comissários de fim de semana de corrida, que revisa as contas anuais completas de cada equipe — não uma checagem pontual, e sim uma auditoria completa contra as categorias de gasto regulamentadas.

**O quadro de infrações:** o regulamento define dois níveis. Uma infração de menos de 5% do teto conta como "menor" e normalmente traz penalidades financeiras mais uma redução na cota de [Restrições de Teste Aerodinâmico](/glossary/aerodynamic-testing-restrictions) da equipe infratora para o período seguinte. Qualquer coisa acima de 5% é uma infração "material", que pode escalar até descontos de pontos no campeonato ou, no caso mais extremo, exclusão do campeonato — a mesma categoria de sanção que a FIA reserva para suas faltas esportivas mais graves.

**Calendário de revisão:** a FIA não renegocia o valor do teto de forma improvisada — ele é revisado e ajustado em um calendário definido, atrelado à inflação real de custos (frete, energia, materiais), por isso o número subiu do seu nível original de 2021 para US$ 215 milhões em 2026 sem precisar de um novo voto unânime a cada vez.""",
            },
        },
    },
    "concorde-agreement": {
        "eli5": {
            "en": {
                "short_definition": "The Concorde Agreement is F1's master contract — the private deal between the FIA, the commercial rights holder, and every team that decides how the sport's money gets split and how the whole business actually runs.",
                "body_markdown": """Think of F1 less like a sport with a rulebook and more like a company with a shareholders' agreement — the Concorde Agreement is that document. It's the contract every team has to sign to be on the grid at all, and it settles the stuff that actually decides who gets rich: how TV and sponsorship money gets divided between the teams, whether a team is allowed to skip a race it doesn't like, and what a brand-new team has to pay to join.

It's named after the Place de la Concorde in Paris, where it was first signed back in 1981 to end a fight between the teams and F1's governing body over exactly this kind of money and power question. Nobody outside the room gets to read the actual document — what the public knows comes from leaks and whatever numbers the FIA chooses to publish, like the cost cap figure. The current version runs from 2026 to 2030, and because every agreement eventually expires, "will they actually sign the next one" is a real source of anxiety for teams planning years ahead.""",
            },
            "es": {
                "short_definition": "El Concorde Agreement es el contrato maestro de la F1 — el acuerdo privado entre la FIA, el titular de los derechos comerciales, y cada equipo, que decide cómo se reparte la plata del deporte y cómo funciona realmente todo el negocio.",
                "body_markdown": """Piensa en la F1 menos como un deporte con un reglamento y más como una empresa con un acuerdo de accionistas — el Concorde Agreement es ese documento. Es el contrato que cada equipo tiene que firmar para siquiera estar en la parrilla, y define lo que realmente decide quién se hace rico: cómo se reparte la plata de TV y patrocinios entre los equipos, si un equipo puede saltearse una carrera que no le gusta, y cuánto tiene que pagar un equipo nuevo para sumarse.

Se llama así por la Place de la Concorde en París, donde se firmó por primera vez en 1981 para terminar una pelea entre los equipos y el ente que gobierna la F1 por exactamente este tipo de cuestión de plata y poder. Nadie fuera de esa sala puede leer el documento real — lo que sabe el público viene de filtraciones y de los números que la FIA decide publicar, como la cifra del tope de gastos. La versión actual corre de 2026 a 2030, y como todo acuerdo eventualmente vence, si van a firmar realmente el próximo es una fuente de ansiedad real para los equipos que planean con años de anticipación.""",
            },
            "pt": {
                "short_definition": "O Concorde Agreement é o contrato mestre da F1 — o acordo privado entre a FIA, a detentora dos direitos comerciais, e cada equipe, que decide como o dinheiro do esporte é dividido e como o negócio inteiro realmente funciona.",
                "body_markdown": """Pense na F1 menos como um esporte com um regulamento e mais como uma empresa com um acordo de acionistas — o Concorde Agreement é esse documento. É o contrato que cada equipe precisa assinar para sequer estar no grid, e define o que realmente decide quem enriquece: como o dinheiro de TV e patrocínio é dividido entre as equipes, se uma equipe pode pular uma corrida de que não gosta, e quanto uma equipe nova precisa pagar para entrar.

Tem esse nome por causa da Place de la Concorde em Paris, onde foi assinado pela primeira vez em 1981 para acabar com uma briga entre as equipes e o órgão que governa a F1 por exatamente esse tipo de questão de dinheiro e poder. Ninguém fora daquela sala pode ler o documento real — o que o público sabe vem de vazamentos e dos números que a FIA decide publicar, como o valor do teto de gastos. A versão atual vai de 2026 a 2030, e como todo acordo eventualmente vence, será que vão realmente assinar o próximo é uma fonte real de ansiedade para as equipes que planejam com anos de antecedência.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "The Concorde Agreement isn't an FIA regulation in the technical/sporting sense — it's a confidential commercial contract between the FIA, the commercial rights holder, and the teams, sitting alongside (not inside) the published Sporting and Technical Regulations.",
                "body_markdown": """**Why it's not a 'regulation' in the usual sense:** the FIA's Sporting and Technical Regulations are published documents that apply automatically to every competitor. The Concorde Agreement is different in kind — a negotiated, signed commercial contract, confidential between its parties, that happens to determine several things the public regulations don't touch: revenue distribution, participation obligations, and new-entrant terms like the [anti-dilution fee](/glossary/anti-dilution-fee).

**Three-way signatory structure:** the agreement binds three distinct parties — the FIA (the sport's governing body, responsible for the Sporting and Technical Regulations), the commercial rights holder (Formula One Management, which sells the TV and promotional rights), and each individual team. This structure is why some F1 rule changes require FIA-only approval while others — anything touching money — need team sign-off too.

**Why terms leak instead of publish:** because it's a private contract rather than a regulation, there's no legal requirement to publish it, unlike the FIA's technical documents which are public by design. What's publicly known — revenue splits, the cost cap figure, entry fee amounts — comes from what the FIA chooses to disclose or what individual teams reveal, not from an official released text.

**Expiry and renewal:** each Concorde Agreement cycle has a fixed end date; the current one runs 2026–2030. Because every clause — revenue share, entry terms, governance votes — has to be renegotiated before the next cycle, the period leading up to an expiry is historically when F1's biggest structural changes (entry fee levels, revenue formula adjustments) actually get decided.""",
            },
            "es": {
                "short_definition": "El Concorde Agreement no es un reglamento de la FIA en el sentido técnico/deportivo — es un contrato comercial confidencial entre la FIA, el titular de los derechos comerciales, y los equipos, que existe al lado (no adentro) del Reglamento Deportivo y Técnico publicado.",
                "body_markdown": """**Por qué no es un 'reglamento' en el sentido habitual:** el Reglamento Deportivo y el Técnico de la FIA son documentos públicos que aplican automáticamente a cada competidor. El Concorde Agreement es distinto de raíz — un contrato comercial negociado y firmado, confidencial entre sus partes, que determina varias cosas que los reglamentos públicos no tocan: distribución de ingresos, obligaciones de participación, y términos para nuevos entrantes como la [cuota anti-dilución](/glossary/anti-dilution-fee).

**Estructura de firmantes tripartita:** el acuerdo vincula a tres partes distintas — la FIA (el ente que gobierna el deporte, responsable del Reglamento Deportivo y Técnico), el titular de los derechos comerciales (Formula One Management, que vende los derechos de TV y promoción), y cada equipo individual. Esta estructura es por qué algunos cambios de reglas de F1 necesitan solo aprobación de la FIA mientras que otros — cualquier cosa que toque plata — también necesitan el visto bueno de los equipos.

**Por qué los términos se filtran en vez de publicarse:** como es un contrato privado y no un reglamento, no hay obligación legal de publicarlo, a diferencia de los documentos técnicos de la FIA que son públicos por diseño. Lo que se conoce públicamente — repartos de ingresos, la cifra del tope de gastos, montos de cuotas de entrada — viene de lo que la FIA decide revelar o lo que revelan equipos individuales, no de un texto oficial publicado.

**Vencimiento y renovación:** cada ciclo del Concorde Agreement tiene una fecha de fin fija; el actual corre de 2026 a 2030. Como cada cláusula — reparto de ingresos, términos de entrada, votos de gobernanza — se tiene que renegociar antes del siguiente ciclo, el período previo a un vencimiento es históricamente cuando se deciden de verdad los cambios estructurales más grandes de F1 (niveles de cuota de entrada, ajustes de fórmula de ingresos).""",
            },
            "pt": {
                "short_definition": "O Concorde Agreement não é um regulamento da FIA no sentido técnico/esportivo — é um contrato comercial confidencial entre a FIA, a detentora dos direitos comerciais, e as equipes, que existe ao lado (não dentro) do Regulamento Esportivo e Técnico publicado.",
                "body_markdown": """**Por que não é um 'regulamento' no sentido habitual:** o Regulamento Esportivo e o Técnico da FIA são documentos públicos que se aplicam automaticamente a todo competidor. O Concorde Agreement é diferente na essência — um contrato comercial negociado e assinado, confidencial entre suas partes, que acaba determinando várias coisas que os regulamentos públicos não tocam: distribuição de receita, obrigações de participação, e termos para novos entrantes como a [taxa antidiluição](/glossary/anti-dilution-fee).

**Estrutura de signatários tripartite:** o acordo vincula três partes distintas — a FIA (o órgão que governa o esporte, responsável pelo Regulamento Esportivo e Técnico), a detentora dos direitos comerciais (a Formula One Management, que vende os direitos de TV e promocionais), e cada equipe individual. Essa estrutura é o motivo pelo qual algumas mudanças de regras da F1 precisam só da aprovação da FIA, enquanto outras — qualquer coisa que envolva dinheiro — também precisam do aval das equipes.

**Por que os termos vazam em vez de serem publicados:** como é um contrato privado e não um regulamento, não há obrigação legal de publicá-lo, diferente dos documentos técnicos da FIA, que são públicos por design. O que se sabe publicamente — divisões de receita, o valor do teto de gastos, valores de taxas de entrada — vem do que a FIA decide divulgar ou do que equipes individuais revelam, não de um texto oficial publicado.

**Vencimento e renovação:** cada ciclo do Concorde Agreement tem uma data de término fixa; o atual vai de 2026 a 2030. Como cada cláusula — divisão de receita, termos de entrada, votos de governança — precisa ser renegociada antes do próximo ciclo, o período antes de um vencimento é historicamente quando as maiores mudanças estruturais da F1 (níveis de taxa de entrada, ajustes na fórmula de receita) realmente são decididas.""",
            },
        },
    },
    "anti-dilution-fee": {
        "eli5": {
            "en": {
                "short_definition": "The anti-dilution fee is the price of admission for a new F1 team — a payment to the ten teams already on the grid, to make up for the fact that a new competitor shrinks everyone else's slice of the prize money.",
                "body_markdown": """Imagine ten people splitting a pizza evenly, then an eleventh person shows up wanting a slice too — everyone else's piece just got smaller, through no fault of their own. That's what a new F1 team joining does to the prize-money pool, and the anti-dilution fee is the new team paying the other ten for the smaller slices they're about to get.

It's not a fee to the FIA, and it's not a fine — it goes straight to the ten existing teams, split by an agreed formula. The 2021 rules set a $200 million floor for this payment. When Cadillac wanted in for 2026, the existing teams pushed for as much as $600 million before landing on $450 million — more than double the original floor, which tells you how much more valuable a place on the F1 grid has become since 2021.""",
            },
            "es": {
                "short_definition": "La cuota anti-dilución es el precio de entrada para un equipo nuevo de F1 — un pago a los diez equipos que ya están en la parrilla, para compensar que un competidor nuevo achica la porción del fondo de premios de todos los demás.",
                "body_markdown": """Imagina a diez personas repartiendo una pizza en partes iguales, y de repente aparece una undécima persona que también quiere una porción — a todos los demás les toca un pedazo más chico, sin haber hecho nada mal. Eso es lo que le hace al fondo de premios un equipo nuevo que se suma a la F1, y la cuota anti-dilución es que el equipo nuevo le paga a los otros diez por las porciones más chicas que están por recibir.

No es una cuota a la FIA, ni una multa — va directo a los diez equipos existentes, repartida según una fórmula acordada. Las reglas de 2021 fijaron un piso de $200 millones para este pago. Cuando Cadillac quiso entrar para 2026, los equipos existentes pedían hasta $600 millones antes de acordar $450 millones — más del doble del piso original, lo que dice mucho sobre cuánto más valioso se volvió un lugar en la parrilla de F1 desde 2021.""",
            },
            "pt": {
                "short_definition": "A taxa antidiluição é o preço de entrada para uma equipe nova de F1 — um pagamento às dez equipes que já estão no grid, para compensar o fato de que um concorrente novo diminui a fatia do fundo de premiação de todo mundo.",
                "body_markdown": """Imagine dez pessoas dividindo uma pizza igualmente, e de repente aparece uma décima primeira pessoa também querendo uma fatia — todo mundo fica com um pedaço menor, sem ter feito nada de errado. É isso que uma equipe nova entrando na F1 faz com o fundo de premiação, e a taxa antidiluição é a equipe nova pagando às outras dez pelas fatias menores que elas estão prestes a receber.

Não é uma taxa para a FIA, nem uma multa — vai direto para as dez equipes existentes, dividida por uma fórmula acordada. As regras de 2021 fixaram um piso de US$ 200 milhões para esse pagamento. Quando a Cadillac quis entrar para 2026, as equipes existentes pediam até US$ 600 milhões antes de fecharem em US$ 450 milhões — mais que o dobro do piso original, o que mostra o quanto um lugar no grid da F1 ficou mais valioso desde 2021.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "The anti-dilution fee mechanism is defined within the Concorde Agreement, not a standalone FIA regulation — its floor value and distribution formula are commercial terms negotiated between the existing teams and the commercial rights holder, subject to FIA oversight of the entry process itself.",
                "body_markdown": """**Where it actually lives:** despite sounding like a technical eligibility rule, the anti-dilution fee is a Concorde Agreement term — a commercial contract provision, not a Sporting or Technical Regulation. The FIA still governs whether a new entrant meets the sporting and technical requirements to compete at all, but the fee itself is negotiated financial territory between the incumbent teams and Formula One Management.

**Floor vs. negotiated figure:** the 2021 Concorde Agreement cycle set $200 million as a contractual floor — the minimum an incumbent team group could accept, not a fixed price. Cadillac's actual $450 million reflects a negotiation that played out over roughly a year, with reported initial team demands as high as $600 million before settling ahead of the 2025 Australian Grand Prix.

**Distribution mechanism:** the fee is split among the existing teams according to a formula set out in the Concorde Agreement, not paid to the FIA or Formula One Management directly — which is the detail that most clearly marks it as compensation between competitors rather than a governance fee.

**Precedent-setting nature:** because each new entry negotiation resets the going rate (as Cadillac's deal did, more than doubling the 2021 floor), the anti-dilution fee functions less like a fixed rule and more like a market price that moves with F1's overall commercial value — a future applicant negotiates against Cadillac's $450 million, not the original 2021 figure.""",
            },
            "es": {
                "short_definition": "El mecanismo de la cuota anti-dilución está definido dentro del Concorde Agreement, no en un reglamento aparte de la FIA — su valor piso y su fórmula de distribución son términos comerciales negociados entre los equipos existentes y el titular de los derechos comerciales, sujeto a la supervisión de la FIA sobre el proceso de entrada en sí.",
                "body_markdown": """**Dónde vive en realidad:** aunque suene como una regla técnica de elegibilidad, la cuota anti-dilución es un término del Concorde Agreement — una cláusula de contrato comercial, no un Reglamento Deportivo o Técnico. La FIA sigue gobernando si un nuevo entrante cumple los requisitos deportivos y técnicos para competir, pero la cuota en sí es territorio financiero negociado entre los equipos existentes y Formula One Management.

**Piso vs. cifra negociada:** el ciclo del Concorde Agreement de 2021 fijó $200 millones como piso contractual — el mínimo que el grupo de equipos existentes podía aceptar, no un precio fijo. Los $450 millones reales de Cadillac reflejan una negociación que se extendió durante aproximadamente un año, con pedidos iniciales de los equipos reportados de hasta $600 millones antes de cerrarse antes del GP de Australia 2025.

**Mecanismo de distribución:** la cuota se reparte entre los equipos existentes según una fórmula establecida en el Concorde Agreement, no se paga directamente a la FIA ni a Formula One Management — ese detalle es lo que más claramente la marca como compensación entre competidores y no como una tasa de gobernanza.

**Naturaleza de precedente:** como cada negociación de entrada nueva reinicia el precio de mercado (como hizo el acuerdo de Cadillac, más que duplicando el piso de 2021), la cuota anti-dilución funciona menos como una regla fija y más como un precio de mercado que se mueve con el valor comercial general de la F1 — un futuro aspirante negocia contra los $450 millones de Cadillac, no contra la cifra original de 2021.""",
            },
            "pt": {
                "short_definition": "O mecanismo da taxa antidiluição está definido dentro do Concorde Agreement, não em um regulamento separado da FIA — seu valor piso e sua fórmula de distribuição são termos comerciais negociados entre as equipes existentes e a detentora dos direitos comerciais, sujeitos à supervisão da FIA sobre o próprio processo de entrada.",
                "body_markdown": """**Onde realmente vive:** apesar de soar como uma regra técnica de elegibilidade, a taxa antidiluição é um termo do Concorde Agreement — uma cláusula de contrato comercial, não um Regulamento Esportivo ou Técnico. A FIA ainda governa se um novo entrante cumpre os requisitos esportivos e técnicos para competir, mas a taxa em si é território financeiro negociado entre as equipes existentes e a Formula One Management.

**Piso vs. valor negociado:** o ciclo do Concorde Agreement de 2021 fixou US$ 200 milhões como piso contratual — o mínimo que o grupo de equipes existentes poderia aceitar, não um preço fixo. Os US$ 450 milhões reais da Cadillac refletem uma negociação que durou cerca de um ano, com pedidos iniciais das equipes reportados em até US$ 600 milhões antes de fechar antes do GP da Austrália de 2025.

**Mecanismo de distribuição:** a taxa é dividida entre as equipes existentes segundo uma fórmula definida no Concorde Agreement, não é paga diretamente à FIA nem à Formula One Management — esse detalhe é o que mais claramente a marca como compensação entre concorrentes, e não como uma taxa de governança.

**Natureza de precedente:** como cada negociação de entrada nova reinicia o preço de mercado (como fez o acordo da Cadillac, mais que dobrando o piso de 2021), a taxa antidiluição funciona menos como uma regra fixa e mais como um preço de mercado que se move junto com o valor comercial geral da F1 — um futuro candidato negocia contra os US$ 450 milhões da Cadillac, não contra o valor original de 2021.""",
            },
        },
    },
    "prize-money": {
        "eli5": {
            "en": {
                "short_definition": "F1 pays teams around $1.6 billion a year, but not for winning races — it's paid out once, at the end of the season, based on where each team finished in the constructors' championship overall.",
                "body_markdown": """Here's the part that surprises a lot of new fans: winning a Grand Prix on Sunday doesn't hand a team a check that week. Nobody gets a special bonus for a single win — what actually determines the money is where a team's combined results land in the constructors' championship table once the whole season is done, in December.

The pool is huge — reported at roughly $1.6 billion a year — and it's split so the champion gets the biggest share, second place gets less, and so on down the grid. There's also a smaller side pool for teams that have been in F1 a long time, on top of their results-based share, and Ferrari specifically gets an extra historic payment tied to being the only team that's raced in every F1 season since 1950. So finishing 2nd instead of 3rd is worth real money, even if the two teams won the exact same number of races that year.""",
            },
            "es": {
                "short_definition": "F1 paga a los equipos cerca de $1.600 millones al año, pero no por ganar carreras — se paga una sola vez, a fin de temporada, según dónde terminó cada equipo en el campeonato de constructores en general.",
                "body_markdown": """Acá está la parte que sorprende a muchos fans nuevos: ganar un Gran Premio el domingo no le da a un equipo un cheque esa semana. Nadie recibe un bono especial por una victoria puntual — lo que realmente determina la plata es dónde quedan los resultados combinados de un equipo en la tabla del campeonato de constructores una vez que termina toda la temporada, en diciembre.

El fondo es enorme — se reporta en unos $1.600 millones al año — y se reparte de forma que el campeón se lleva la porción más grande, el segundo se lleva menos, y así hacia abajo en la parrilla. También hay un fondo más chico aparte para equipos que llevan mucho tiempo en la F1, encima de su porción por resultados, y Ferrari específicamente recibe un pago histórico extra por ser el único equipo que corrió en todas las temporadas de F1 desde 1950. Así que terminar 2° en vez de 3° vale plata real, aunque los dos equipos hayan ganado exactamente la misma cantidad de carreras ese año.""",
            },
            "pt": {
                "short_definition": "A F1 paga às equipes cerca de US$ 1,6 bilhão por ano, mas não por vencer corridas — é pago uma única vez, no fim da temporada, com base em onde cada equipe terminou no campeonato de construtores em geral.",
                "body_markdown": """Aqui está a parte que surpreende muitos fãs novos: vencer um Grande Prêmio no domingo não dá a uma equipe um cheque naquela semana. Ninguém recebe um bônus especial por uma vitória pontual — o que realmente determina o dinheiro é onde os resultados combinados de uma equipe ficam na tabela do campeonato de construtores depois que a temporada inteira termina, em dezembro.

O fundo é enorme — reportado em cerca de US$ 1,6 bilhão por ano — e é dividido de forma que o campeão fica com a maior fatia, o segundo lugar fica com menos, e assim por diante pelo grid. Também existe um fundo menor à parte para equipes que estão há muito tempo na F1, além da fatia baseada em resultados, e a Ferrari especificamente recebe um pagamento histórico extra por ser a única equipe que correu em todas as temporadas da F1 desde 1950. Então terminar em 2º em vez de 3º vale dinheiro real, mesmo que as duas equipes tenham vencido exatamente o mesmo número de corridas naquele ano.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "Prize money distribution isn't governed by the FIA's Sporting Regulations — it's a Concorde Agreement commercial term, administered by Formula One Management, that determines each team's share of F1's centralized revenue pool based on final constructors' championship position.",
                "body_markdown": """**Not a sporting regulation:** the FIA's Sporting Regulations define how points are awarded per race, but the conversion of those points into money is entirely a commercial matter, governed by the Concorde Agreement and administered by Formula One Management — the FIA itself doesn't distribute prize money.

**Two-tier structure:** the payment formula has a large, performance-based tier — the bulk of the pool, split by final constructors' championship position — and a smaller, separate tier for "long-standing team" bonuses, which rewards tenure in the sport independent of that year's results. Ferrari's additional historic payment, tied to being the only constructor to compete in every F1 World Championship season since 1950, is a specific, named provision within this structure rather than a generic loyalty bonus available to any long-tenured team on equal terms.

**Season-long settlement, not per-event:** unlike sports with per-event purses, F1's centralized revenue is calculated and distributed based on the championship table as it stands at season's end — a structural choice that ties every race weekend's points, not just wins, directly to a team's year-end payout, and links prize money conceptually to the same constructors' standings that set the following season's [Aerodynamic Testing Restrictions](/glossary/aerodynamic-testing-restrictions) allocation.""",
            },
            "es": {
                "short_definition": "La distribución del premio en dinero no la rige el Reglamento Deportivo de la FIA — es un término comercial del Concorde Agreement, administrado por Formula One Management, que determina la porción de cada equipo del fondo de ingresos centralizado de F1 según la posición final en el campeonato de constructores.",
                "body_markdown": """**No es un reglamento deportivo:** el Reglamento Deportivo de la FIA define cómo se otorgan los puntos por carrera, pero convertir esos puntos en plata es enteramente un asunto comercial, regido por el Concorde Agreement y administrado por Formula One Management — la FIA en sí no distribuye el premio en dinero.

**Estructura de dos niveles:** la fórmula de pago tiene un nivel grande basado en rendimiento — la mayor parte del fondo, repartida por posición final en el campeonato de constructores — y un nivel más chico y separado para bonos de "equipo de larga trayectoria", que premia la antigüedad en el deporte independientemente de los resultados de ese año. El pago histórico adicional de Ferrari, atado a ser el único constructor que compitió en todas las temporadas del Mundial de F1 desde 1950, es una disposición específica y nombrada dentro de esta estructura, no un bono genérico de lealtad disponible para cualquier equipo de larga trayectoria en igualdad de condiciones.

**Liquidación de toda la temporada, no por evento:** a diferencia de deportes con premios por evento, el ingreso centralizado de F1 se calcula y distribuye según la tabla del campeonato tal como queda a fin de temporada — una decisión estructural que ata los puntos de cada fin de semana de carrera, no solo las victorias, directamente al pago de fin de año de un equipo, y conecta conceptualmente el premio en dinero con la misma tabla de constructores que fija la asignación de [Restricciones de Testeo Aerodinámico](/glossary/aerodynamic-testing-restrictions) de la temporada siguiente.""",
            },
            "pt": {
                "short_definition": "A distribuição da premiação não é regida pelo Regulamento Esportivo da FIA — é um termo comercial do Concorde Agreement, administrado pela Formula One Management, que determina a fatia de cada equipe do fundo de receita centralizado da F1 com base na posição final no campeonato de construtores.",
                "body_markdown": """**Não é um regulamento esportivo:** o Regulamento Esportivo da FIA define como os pontos são dados por corrida, mas converter esses pontos em dinheiro é inteiramente uma questão comercial, regida pelo Concorde Agreement e administrada pela Formula One Management — a própria FIA não distribui a premiação.

**Estrutura em duas camadas:** a fórmula de pagamento tem uma camada grande, baseada em desempenho — a maior parte do fundo, dividida pela posição final no campeonato de construtores — e uma camada menor e separada para bônus de "equipe de longa data", que recompensa o tempo de casa no esporte independentemente dos resultados daquele ano. O pagamento histórico adicional da Ferrari, ligado a ser a única construtora que competiu em todas as temporadas do Mundial de F1 desde 1950, é uma disposição específica e nomeada dentro dessa estrutura, não um bônus genérico de fidelidade disponível para qualquer equipe de longa data em igualdade de condições.

**Acerto da temporada inteira, não por evento:** diferente de esportes com premiação por evento, a receita centralizada da F1 é calculada e distribuída de acordo com a tabela do campeonato como ela está no fim da temporada — uma escolha estrutural que liga os pontos de cada fim de semana de corrida, não só as vitórias, diretamente ao pagamento de fim de ano de uma equipe, e conecta conceitualmente a premiação à mesma tabela de construtores que define a cota de [Restrições de Teste Aerodinâmico](/glossary/aerodynamic-testing-restrictions) da temporada seguinte.""",
            },
        },
    },
    "hosting-fee": {
        "eli5": {
            "en": {
                "short_definition": "The hosting fee is what a circuit pays F1 just to be on the calendar — a fixed yearly bill that's owed whether the race sells out or half the seats stay empty.",
                "body_markdown": """Think of it like renting a stadium for a concert: the venue gets paid its rental fee regardless of whether the show sells out or flops. That's the hosting fee — a circuit or race promoter pays Formula One Management a set amount, usually somewhere between $15 million and $55 million a year, purely for the right to have a Grand Prix on the calendar. Rain, empty grandstands, a boring race — none of it changes what's owed.

What a circuit charges varies wildly. Some of Europe's oldest, most prestigious races actually pay comparatively little, because F1 needs them for credibility and history. Newer races backed by government or tourism money rather than ticket sales tend to pay at the very top of the range. Across the whole calendar, these fees add up to roughly 29% of F1's total revenue — more than $1 billion a year — making the hosting fee one of the most reliable, boring-but-important sources of money in the sport.""",
            },
            "es": {
                "short_definition": "La cuota de sede es lo que paga un circuito a F1 solo por estar en el calendario — una factura fija anual que se debe sin importar si la carrera se agota o queda la mitad de las tribunas vacías.",
                "body_markdown": """Piénsalo como alquilar un estadio para un concierto: el lugar cobra su alquiler sin importar si el show se agota o es un fracaso. Eso es la cuota de sede — un circuito o promotor de carrera le paga a Formula One Management un monto fijo, normalmente entre $15 y $55 millones al año, solo por el derecho de tener un Gran Premio en el calendario. Lluvia, tribunas vacías, una carrera aburrida — nada de eso cambia lo que se debe.

Lo que cobra cada circuito varía muchísimo. Algunas de las carreras más antiguas y prestigiosas de Europa en realidad pagan relativamente poco, porque la F1 las necesita por credibilidad e historia. Las carreras más nuevas, financiadas con plata de gobiernos o turismo en vez de venta de entradas, tienden a pagar en la punta más alta del rango. En todo el calendario, estas cuotas suman cerca del 29% del ingreso total de la F1 — más de $1.000 millones al año — lo que hace de la cuota de sede una de las fuentes de plata más confiables, aburridas pero importantes, del deporte.""",
            },
            "pt": {
                "short_definition": "A taxa de sede é o que um circuito paga à F1 só por estar no calendário — uma conta fixa anual devida independentemente de a corrida esgotar ou metade dos assentos ficarem vazios.",
                "body_markdown": """Pense como alugar um estádio para um show: o local recebe o aluguel independentemente de o show esgotar ou fracassar. É isso que é a taxa de sede — um circuito ou promotor de corrida paga à Formula One Management um valor fixo, normalmente entre US$ 15 e US$ 55 milhões por ano, apenas pelo direito de ter um Grande Prêmio no calendário. Chuva, arquibancadas vazias, uma corrida sem graça — nada disso muda o que é devido.

O que cada circuito cobra varia muito. Algumas das corridas mais antigas e prestigiadas da Europa na verdade pagam relativamente pouco, porque a F1 precisa delas por credibilidade e história. Corridas mais novas, bancadas por dinheiro de governo ou turismo em vez de venda de ingressos, tendem a pagar na ponta mais alta da faixa. Em todo o calendário, essas taxas somam cerca de 29% da receita total da F1 — mais de US$ 1 bilhão por ano — o que faz da taxa de sede uma das fontes de dinheiro mais confiáveis, chatas mas importantes, do esporte.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "Hosting fees are individually negotiated commercial contracts between Formula One Management and each circuit or national promoter — not an FIA regulation, and not a standardized formula, which is why fees vary enormously across the calendar.",
                "body_markdown": """**Not FIA territory:** the FIA doesn't set or collect hosting fees — its role is limited to certifying that a circuit meets the safety and technical standards (Grade 1 licensing) required to host a round of the World Championship at all. The commercial fee itself is negotiated entirely between Formula One Management and the individual promoter, outside any published regulation.

**No shared formula:** because each contract is bilateral and confidential, there's no public methodology for how a fee is calculated. Published or leaked figures (typically $15–55 million a year) reflect a mix of market negotiating leverage, contract length, and whether a race is backed by ticket revenue versus state or tourism funding — not a rate card.

**Where it sits in F1's revenue reporting:** hosting fees, alongside broadcast and sponsorship income, make up the centralized revenue pool referenced in the Concorde Agreement's [prize money](/glossary/prize-money) distribution formula — meaning a strong slate of high-fee-paying races indirectly benefits every team's payout, not just the promoter and Formula One Management.

**Contract length as leverage:** hosting deals typically run multiple years, and a promoter's leverage to negotiate the fee down (or Formula One Management's leverage to push it up) shifts significantly depending on how many other cities are competing for a calendar slot at renewal time — a dynamic that has pushed newer-market fees upward even as some legacy European races retain comparatively favorable long-term terms.""",
            },
            "es": {
                "short_definition": "Las cuotas de sede son contratos comerciales negociados individualmente entre Formula One Management y cada circuito o promotor nacional — no un reglamento de la FIA, ni una fórmula estandarizada, por eso las cuotas varían tanto en todo el calendario.",
                "body_markdown": """**No es terreno de la FIA:** la FIA no fija ni cobra las cuotas de sede — su rol se limita a certificar que un circuito cumple los estándares de seguridad y técnicos (licencia de Grado 1) necesarios para siquiera albergar una fecha del Mundial. La cuota comercial en sí se negocia enteramente entre Formula One Management y el promotor individual, fuera de cualquier reglamento publicado.

**Sin fórmula compartida:** como cada contrato es bilateral y confidencial, no hay una metodología pública de cómo se calcula una cuota. Las cifras publicadas o filtradas (típicamente $15-55 millones al año) reflejan una mezcla de poder de negociación de mercado, duración del contrato, y si una carrera se sostiene con venta de entradas o con fondos estatales o de turismo — no una tarifa fija.

**Dónde se ubica en el reporte de ingresos de F1:** las cuotas de sede, junto con el ingreso por transmisión y patrocinio, forman el fondo de ingresos centralizado al que hace referencia la fórmula de distribución del [premio en dinero](/glossary/prize-money) del Concorde Agreement — lo que significa que una buena tanda de carreras que pagan cuotas altas beneficia indirectamente el pago de cada equipo, no solo al promotor y a Formula One Management.

**La duración del contrato como palanca de negociación:** los acuerdos de sede típicamente corren varios años, y el poder de un promotor para negociar la cuota a la baja (o el de Formula One Management para subirla) cambia bastante según cuántas otras ciudades estén compitiendo por un lugar en el calendario al momento de la renovación — una dinámica que empujó al alza las cuotas de los mercados más nuevos, aun cuando algunas carreras europeas históricas mantienen términos de largo plazo comparativamente favorables.""",
            },
            "pt": {
                "short_definition": "As taxas de sede são contratos comerciais negociados individualmente entre a Formula One Management e cada circuito ou promotor nacional — não um regulamento da FIA, nem uma fórmula padronizada, por isso as taxas variam tanto em todo o calendário.",
                "body_markdown": """**Não é território da FIA:** a FIA não define nem cobra as taxas de sede — seu papel se limita a certificar que um circuito cumpre os padrões de segurança e técnicos (licença de Grau 1) necessários para sequer sediar uma etapa do Mundial. A taxa comercial em si é negociada inteiramente entre a Formula One Management e o promotor individual, fora de qualquer regulamento publicado.

**Sem fórmula compartilhada:** como cada contrato é bilateral e confidencial, não existe uma metodologia pública de como uma taxa é calculada. Os valores publicados ou vazados (tipicamente US$ 15-55 milhões por ano) refletem uma mistura de poder de negociação de mercado, duração do contrato, e se uma corrida se sustenta com venda de ingressos ou com fundos estatais ou de turismo — não uma tabela de preços.

**Onde isso entra no relatório de receita da F1:** as taxas de sede, junto com a receita de transmissão e patrocínio, formam o fundo de receita centralizado referenciado na fórmula de distribuição da [premiação](/glossary/prize-money) do Concorde Agreement — o que significa que uma boa leva de corridas pagando taxas altas beneficia indiretamente o pagamento de cada equipe, não só o promotor e a Formula One Management.

**A duração do contrato como moeda de troca:** os acordos de sede normalmente duram vários anos, e o poder de um promotor para negociar a taxa para baixo (ou o da Formula One Management para empurrá-la para cima) muda bastante dependendo de quantas outras cidades estão disputando uma vaga no calendário no momento da renovação — uma dinâmica que empurrou para cima as taxas de mercados mais novos, mesmo com algumas corridas europeias históricas mantendo termos de longo prazo comparativamente favoráveis.""",
            },
        },
    },
    "title-sponsorship": {
        "eli5": {
            "en": {
                "short_definition": "A title sponsor is the company whose name gets attached to the whole team — like Oracle Red Bull Racing — and it's paying for that privilege at prices from around $25 million a year for a smaller team up to $110 million for a top one.",
                "body_markdown": """You know a title sponsor when you hear a team's full name: it's the brand stapled to the front, not just a logo tucked into a corner of the car. That naming-rights-level visibility is what a title sponsor is actually buying, and the price tag scales hard with how competitive and visible the team is — a team fighting for wins and camera time can charge a lot more for that same naming slot than one running at the back of the grid.

Here's the part that makes it so valuable to teams specifically: none of this money counts against F1's [cost cap](/glossary/cost-cap). The cap limits what a team can spend making the car faster, not what it's allowed to earn — so a bigger title-sponsor check doesn't buy extra performance directly, but it funds everything the cap doesn't touch, or just goes straight to the bottom line as profit.""",
            },
            "es": {
                "short_definition": "Un patrocinador título es la empresa cuyo nombre se pega a todo el equipo — como Oracle Red Bull Racing — y paga por ese privilegio precios que van desde unos $25 millones al año para un equipo chico hasta $110 millones para uno top.",
                "body_markdown": """Reconoces a un patrocinador título en cuanto escuchas el nombre completo de un equipo: es la marca pegada adelante, no solo un logo metido en una esquina del auto. Esa visibilidad al nivel de naming rights es lo que realmente compra un patrocinador título, y el precio escala fuerte según qué tan competitivo y visible es el equipo — uno que pelea victorias y tiempo de cámara puede cobrar mucho más por ese mismo lugar de naming que uno que corre al fondo de la parrilla.

Acá está la parte que lo hace tan valioso específicamente para los equipos: nada de esa plata cuenta contra el [tope de gastos](/glossary/cost-cap) de F1. El tope limita lo que un equipo puede gastar en hacer el auto más rápido, no lo que puede ganar — así que un cheque de patrocinador título más grande no compra rendimiento extra de forma directa, pero financia todo lo que el tope no toca, o directamente pasa a ser ganancia.""",
            },
            "pt": {
                "short_definition": "Um patrocinador master é a empresa cujo nome fica colado em toda a equipe — como Oracle Red Bull Racing — e paga por esse privilégio preços que vão de cerca de US$ 25 milhões por ano para uma equipe menor até US$ 110 milhões para uma de ponta.",
                "body_markdown": """Você reconhece um patrocinador master assim que ouve o nome completo de uma equipe: é a marca colada na frente, não só um logo enfiado num canto do carro. Essa visibilidade em nível de naming rights é o que um patrocinador master realmente compra, e o preço escala forte de acordo com quão competitiva e visível é a equipe — uma que briga por vitórias e tempo de câmera pode cobrar bem mais por esse mesmo espaço de naming do que uma que corre no fundo do grid.

Aqui está a parte que torna isso tão valioso especificamente para as equipes: nada desse dinheiro conta para o [teto de gastos](/glossary/cost-cap) da F1. O teto limita o que uma equipe pode gastar para deixar o carro mais rápido, não o que ela pode ganhar — então um cheque maior de patrocinador master não compra desempenho extra diretamente, mas financia tudo que o teto não toca, ou simplesmente vira lucro.""",
            },
        },
        "fia": {
            "en": {
                "short_definition": "Title sponsorship value isn't regulated by the FIA at all — there's no cap on sponsorship income, only on the performance spending it can fund, a deliberate asymmetry written into the Financial Regulations that govern the cost cap, not a separate sponsorship rule.",
                "body_markdown": """**No regulation of sponsorship income:** unlike almost every other revenue or cost category in F1, there is no FIA rule limiting how much a title sponsor can pay a team, who a team can sign with, or how sponsorship money must be used. The only regulatory touchpoint is indirect: the Financial Regulations' cost cap limits how much of that income can convert into car-performance spending.

**Why the asymmetry is deliberate:** the FIA's 2021 Financial Regulations were built specifically to cap spending, not income, because capping income directly would require regulating each team's private commercial contracts — a much harder and more invasive proposition than auditing spending categories. The result is a system where a team's sponsorship ceiling is set entirely by the market, while its ability to convert that money into faster laps is what's actually capped.

**Reporting requirement, not a spending one:** teams do have to declare sponsorship income as part of their annual Cost Cap Administration filing, since auditors need to distinguish revenue from the capped-spending categories — but this is an accounting transparency measure, not a limit on the income itself.

**Category shift as a market signal, not a rule change:** the recent growth of technology and AI companies as title and technical-partner sponsors reflects market demand for F1's visibility, not any FIA policy encouraging or restricting a particular sponsor category — the regulations are, by design, indifferent to who's paying, only to how much of it gets spent on the car.""",
            },
            "es": {
                "short_definition": "El valor del patrocinio título no está regulado por la FIA en absoluto — no hay tope al ingreso por patrocinio, solo al gasto de rendimiento que puede financiar, una asimetría deliberada escrita en el Reglamento Financiero que rige el tope de gastos, no una regla de patrocinio aparte.",
                "body_markdown": """**Sin regulación del ingreso por patrocinio:** a diferencia de casi cualquier otra categoría de ingreso o gasto en F1, no hay ninguna regla de la FIA que limite cuánto puede pagar un patrocinador título a un equipo, con quién puede firmar un equipo, o cómo se debe usar la plata del patrocinio. El único punto de contacto regulatorio es indirecto: el tope de gastos del Reglamento Financiero limita cuánto de ese ingreso se puede convertir en gasto de rendimiento del auto.

**Por qué la asimetría es deliberada:** el Reglamento Financiero de 2021 de la FIA se construyó específicamente para topear el gasto, no el ingreso, porque topear el ingreso directamente requeriría regular los contratos comerciales privados de cada equipo — una propuesta mucho más difícil e invasiva que auditar categorías de gasto. El resultado es un sistema donde el techo de patrocinio de un equipo lo fija enteramente el mercado, mientras que lo que está realmente topeado es su capacidad de convertir esa plata en vueltas más rápidas.

**Requisito de reporte, no de gasto:** los equipos sí tienen que declarar el ingreso por patrocinio como parte de su presentación anual ante la Cost Cap Administration, porque los auditores necesitan distinguir ese ingreso de las categorías de gasto topeadas — pero esto es una medida de transparencia contable, no un límite al ingreso en sí.

**El cambio de categoría como señal de mercado, no como cambio de regla:** el crecimiento reciente de empresas de tecnología e inteligencia artificial como patrocinadores título y socios técnicos refleja demanda de mercado por la visibilidad de la F1, no ninguna política de la FIA que fomente o restrinja una categoría particular de sponsor — el reglamento es, por diseño, indiferente a quién paga, solo le importa cuánto de eso se gasta en el auto.""",
            },
            "pt": {
                "short_definition": "O valor do patrocínio master não é regulado pela FIA de forma alguma — não há teto para a receita de patrocínio, só para o gasto de desempenho que ela pode financiar, uma assimetria deliberada escrita no Regulamento Financeiro que rege o teto de gastos, não uma regra de patrocínio à parte.",
                "body_markdown": """**Sem regulação da receita de patrocínio:** diferente de quase qualquer outra categoria de receita ou gasto na F1, não existe nenhuma regra da FIA que limite quanto um patrocinador master pode pagar a uma equipe, com quem uma equipe pode fechar contrato, ou como o dinheiro do patrocínio deve ser usado. O único ponto de contato regulatório é indireto: o teto de gastos do Regulamento Financeiro limita quanto dessa receita pode virar gasto em desempenho do carro.

**Por que a assimetria é deliberada:** o Regulamento Financeiro de 2021 da FIA foi construído especificamente para limitar o gasto, não a receita, porque limitar a receita diretamente exigiria regular os contratos comerciais privados de cada equipe — uma proposta muito mais difícil e invasiva do que auditar categorias de gasto. O resultado é um sistema em que o teto de patrocínio de uma equipe é definido inteiramente pelo mercado, enquanto o que realmente é limitado é sua capacidade de converter esse dinheiro em voltas mais rápidas.

**Exigência de relato, não de gasto:** as equipes precisam declarar a receita de patrocínio como parte de sua declaração anual à Cost Cap Administration, porque os auditores precisam distinguir essa receita das categorias de gasto limitadas — mas isso é uma medida de transparência contábil, não um limite à receita em si.

**A mudança de categoria como sinal de mercado, não como mudança de regra:** o crescimento recente de empresas de tecnologia e inteligência artificial como patrocinadoras master e parceiras técnicas reflete demanda de mercado pela visibilidade da F1, não nenhuma política da FIA que incentive ou restrinja uma categoria específica de patrocinador — o regulamento é, por design, indiferente a quem paga, só importa quanto disso é gasto no carro.""",
            },
        },
    },
}


def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    for slug, meta in TERM_META.items():
        for depth in ("eli5", "fia"):
            for locale in ("en", "es", "pt"):
                content = CONTENT[slug][depth][locale]
                row = {
                    "translation_group_id": meta["tgid"],
                    "locale": locale,
                    "slug": slug,
                    "term": meta["terms"][locale],
                    "category": meta["category"],
                    "depth": depth,
                    "short_definition": content["short_definition"],
                    "body_markdown": content["body_markdown"],
                    "related_terms": meta["related_terms"],
                    "sources": meta["sources"],
                    "status": "draft",
                }
                sb.table("glossary_terms").upsert(
                    row, on_conflict="locale,slug,depth"
                ).execute()
                print(f"OK  {locale}/{slug}/{depth}")


if __name__ == "__main__":
    main()
