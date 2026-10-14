#!/usr/bin/env python3
"""relevant-costs: add the eli5 and fia depths (EN/ES/PT) next to the existing technical rows.

Until now the term only had depth=technical, so /glossary/relevant-costs/ fell back to it
and /fia-regulation/ didn't exist. Every claim in the fia depth is taken from the text of
FIA Section D (Issue 3, 10 June 2025): the Relevant Costs definition in the definitions
appendix, Articles D4.1.1-D4.1.2 (obligation and cap amount), D4.2 (Reporting Group),
D5.1.1 a-z (Excluded Costs), D6.1.1 (Adjustments) and D7 (reporting). category,
related_terms, sources and translation_group_id are copied from the technical row of the
same locale.

Run from the repo root, with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
.env.local:

    python scripts/seed_glossary_relevant_costs_layers.py            # dry run
    python scripts/seed_glossary_relevant_costs_layers.py --apply    # upsert as published

Idempotent: upserts on (locale, slug, depth).
"""

import os
import re
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SLUG = "relevant-costs"
PUBLISHED_AT = "2026-10-14T12:00:00+00:00"

LAYERS = {
    "en": {
        "eli5": {
            "short_definition": "Relevant Costs are the part of a team's spending that counts against F1's $215 million cost cap: the money that goes into designing, building, testing and racing the car, after a list of named exclusions such as driver pay is taken out.",
            "body_markdown": """Think of a budget rule that only applies to some of your spending. The cap limits what a team spends on the car, not everything the team spends. A team adds up all its costs, crosses out the items the rules say don't count, applies a few corrections, and what's left is its Relevant Costs. That number, not the team's total bill, is what has to stay under the [Cost Cap](/glossary/cost-cap): $215 million for 2026.

The crossed-out items are the ones that don't make the car faster in a direct way: the race drivers' pay, marketing, the three best-paid people at the team, and departments like legal, HR and finance. What goes into designing, building, testing and racing the car generally stays in.

The corrections exist so a team can't shrink the number with clever bookkeeping. A part bought from a sister company, for example, is counted at least at its fair market price, not at an in-house discount. For the full list of what's in and out, see [F1 Cost Cap: what's included and excluded](/f1-cost-cap-what-is-included-and-excluded).""",
        },
        "fia": {
            "short_definition": "Section D of the FIA's 2026 Financial Regulations defines Relevant Costs as the Total Costs of a team's Reporting Group, less Excluded Costs (Article D5.1.1, items a to z), subject to the Adjustments in Article D6.1. Article D4.1.1 requires every team to report them and keep them under the Cost Cap.",
            "body_markdown": """**The definition:** the Financial Regulations for F1 Teams (Section D, Issue 3, 10 June 2025) define Relevant Costs as "the Total Costs of the Reporting Group less any Excluded Costs, and subject to any applicable Adjustments." Total Costs means all costs and losses recognised within profit or loss of the underlying books and records.

**The obligation (Article D4.1.1):** an F1 Team must determine and report its Relevant Costs against the [Cost Cap](/glossary/cost-cap) in its Presentation Currency, and must not incur, directly or via another entity, Relevant Costs above the Cost Cap in a Full Year Reporting Period. Article D4.1.2 sets the cap at US$215,000,000 when 24 Competitions or fewer take place, plus US$1,800,000 for each Competition above 24, adjusted for Indexation where applicable.

**Whose costs (Article D4.2):** the calculation covers the team's Reporting Group, the entities the regulations treat as part of the F1 Team. Booking a cost in another company does not take it out of scope.

**Exclusions (Article D5.1.1):** a lettered list, from (a) to (z), of costs removed from Total Costs. It includes marketing; Consideration for F1 Drivers and Other Racing Drivers, with their travel and accommodation; the three individuals with the highest Consideration (the "Excluded Persons"); heritage-asset activities; finance costs and corporate income tax; human resources, finance and legal activities; property costs; employee bonuses up to a limit; FIA entry and Super Licence fees; specified Competition and test travel; and sustainability, health and safety, and catering costs.

**Adjustments (Article D6.1.1):** corrections to Total Costs so the figure reflects what the work actually cost. Related Party, Inter-Team and Power Unit transactions connected with an F1 Activity count at the higher of the contracted cost and Fair Value, and income offset against costs must generally be grossed back up.

**Reporting (Article D7):** teams submit Interim and Full Year Reporting Documentation to the Cost Cap Administration. The full-year package includes an assessment report from the independent audit firm that signs the team's audited annual financial statements.""",
        },
    },
    "es": {
        "eli5": {
            "short_definition": "Los costes relevantes son la parte del gasto de un equipo que cuenta para el límite de costes de 215 millones de dólares de la F1: el dinero que se va en diseñar, construir, probar y hacer correr el coche, después de quitar una lista de exclusiones nominadas, como el sueldo de los pilotos.",
            "body_markdown": """Piensa en una regla de presupuesto que solo se aplica a una parte de tus gastos. El límite controla lo que un equipo gasta en el coche, no todo lo que gasta el equipo. El equipo suma todos sus costes, tacha las partidas que el reglamento dice que no cuentan, aplica algunas correcciones, y lo que queda son sus costes relevantes. Ese número, y no la factura total del equipo, es el que tiene que quedar por debajo del [límite de costes](/es/glossary/cost-cap): 215 millones de dólares en 2026.

Las partidas tachadas son las que no hacen más rápido el coche de forma directa: el sueldo de los pilotos, el marketing, las tres personas mejor pagadas del equipo y departamentos como legal, recursos humanos y finanzas. Lo que se va en diseñar, construir, probar y hacer correr el coche, en general, se queda dentro.

Las correcciones existen para que un equipo no pueda achicar el número con trucos contables. Una pieza comprada a una empresa hermana, por ejemplo, se cuenta como mínimo a su valor justo de mercado, no con un descuento interno. La lista completa de lo que entra y lo que no está en [Límite de costes de F1: qué incluye y qué excluye](/es/f1-cost-cap-what-is-included-and-excluded).""",
        },
        "fia": {
            "short_definition": "La Sección D del Reglamento Financiero 2026 de la FIA define los costes relevantes como los costes totales del grupo de reporte del equipo, menos los costes excluidos (artículo D5.1.1, apartados a a z), sujetos a los ajustes del artículo D6.1. El artículo D4.1.1 obliga a cada equipo a reportarlos y a mantenerlos por debajo del límite de costes.",
            "body_markdown": """**La definición:** el Reglamento Financiero para Equipos de F1 (Sección D, edición 3, 10 de junio de 2025) define los costes relevantes como "los costes totales del grupo de reporte menos cualquier coste excluido, y sujetos a los ajustes aplicables". Los costes totales son todos los costes y pérdidas reconocidos en la cuenta de resultados de los libros y registros contables subyacentes.

**La obligación (artículo D4.1.1):** un equipo de F1 debe determinar y reportar sus costes relevantes frente al [límite de costes](/es/glossary/cost-cap) en su moneda de presentación, y no puede incurrir, directamente o a través de otra entidad, en costes relevantes por encima del límite en un período de reporte anual. El artículo D4.1.2 fija el límite en 215.000.000 de dólares cuando se disputan 24 competiciones o menos, más 1.800.000 dólares por cada competición por encima de 24, ajustado por indexación cuando corresponda.

**Los costes de quién (artículo D4.2):** el cálculo abarca el grupo de reporte del equipo, las entidades que el reglamento considera parte del equipo de F1. Registrar un coste en otra empresa no lo saca del cálculo.

**Exclusiones (artículo D5.1.1):** una lista con letras, de la (a) a la (z), de costes que se restan de los costes totales. Incluye el marketing; la contraprestación a los pilotos de F1 y a otros pilotos de carreras, con sus viajes y alojamiento; las tres personas con mayor contraprestación (las "personas excluidas"); las actividades de patrimonio histórico; los costes financieros y el impuesto sobre sociedades; las actividades de recursos humanos, finanzas y legales; los costes inmobiliarios; los bonos a empleados hasta un límite; las tasas de inscripción de la FIA y de la Superlicencia; determinados viajes a competiciones y pruebas; y los costes de sostenibilidad, salud y seguridad, y catering.

**Ajustes (artículo D6.1.1):** correcciones a los costes totales para que la cifra refleje lo que realmente costó el trabajo. Las transacciones con partes vinculadas, entre equipos y de unidades de potencia relacionadas con una actividad de F1 se cuentan por el mayor valor entre el coste contratado y el valor razonable, y los ingresos compensados contra costes, en general, deben volver a sumarse.

**Reporte (artículo D7):** los equipos presentan la documentación de reporte intermedia y anual a la Administración del Límite de Costes. El paquete anual incluye un informe de evaluación de la firma de auditoría independiente que firma los estados financieros anuales auditados del equipo.""",
        },
    },
    "pt": {
        "eli5": {
            "short_definition": "Custos relevantes são a parte dos gastos de uma equipe que conta para o teto de gastos de 215 milhões de dólares da F1: o dinheiro que vai para projetar, construir, testar e correr com o carro, depois de retirada uma lista de exclusões nomeadas, como o salário dos pilotos.",
            "body_markdown": """Pense numa regra de orçamento que só vale para uma parte dos seus gastos. O teto controla o que uma equipe gasta com o carro, não tudo o que a equipe gasta. A equipe soma todos os seus custos, risca os itens que o regulamento diz que não contam, aplica algumas correções, e o que sobra são os seus custos relevantes. É esse número, e não a conta total da equipe, que precisa ficar abaixo do [teto de gastos](/pt/glossary/cost-cap): 215 milhões de dólares em 2026.

Os itens riscados são os que não deixam o carro mais rápido de forma direta: o salário dos pilotos, o marketing, as três pessoas mais bem pagas da equipe e departamentos como jurídico, recursos humanos e finanças. O que vai para projetar, construir, testar e correr com o carro, em geral, fica dentro.

As correções existem para que uma equipe não consiga encolher o número com truques contábeis. Uma peça comprada de uma empresa irmã, por exemplo, conta no mínimo pelo seu valor justo de mercado, e não com um desconto interno. A lista completa do que entra e do que sai está em [Teto de gastos da F1: o que entra e o que sai](/pt/f1-cost-cap-what-is-included-and-excluded).""",
        },
        "fia": {
            "short_definition": "A Seção D do Regulamento Financeiro de 2026 da FIA define custos relevantes como os custos totais do grupo de reporte da equipe, menos os custos excluídos (Artigo D5.1.1, itens a a z), sujeitos aos ajustes do Artigo D6.1. O Artigo D4.1.1 obriga cada equipe a reportá-los e a mantê-los abaixo do teto de gastos.",
            "body_markdown": """**A definição:** o Regulamento Financeiro para Equipes de F1 (Seção D, edição 3, 10 de junho de 2025) define custos relevantes como "os custos totais do grupo de reporte menos quaisquer custos excluídos, e sujeitos aos ajustes aplicáveis". Custos totais são todos os custos e perdas reconhecidos no resultado dos livros e registros contábeis subjacentes.

**A obrigação (Artigo D4.1.1):** uma equipe de F1 precisa determinar e reportar seus custos relevantes em relação ao [teto de gastos](/pt/glossary/cost-cap) na sua moeda de apresentação, e não pode incorrer, diretamente ou por meio de outra entidade, em custos relevantes acima do teto num período de reporte anual. O Artigo D4.1.2 fixa o teto em 215.000.000 de dólares quando são disputadas 24 competições ou menos, mais 1.800.000 dólares por competição acima de 24, ajustado pela indexação quando for o caso.

**Os custos de quem (Artigo D4.2):** o cálculo abrange o grupo de reporte da equipe, as entidades que o regulamento considera parte da equipe de F1. Lançar um custo em outra empresa não o tira do cálculo.

**Exclusões (Artigo D5.1.1):** uma lista com letras, de (a) a (z), de custos subtraídos dos custos totais. Inclui o marketing; a remuneração dos pilotos de F1 e de outros pilotos de corrida, com suas viagens e hospedagem; as três pessoas com maior remuneração (as "pessoas excluídas"); as atividades de patrimônio histórico; os custos financeiros e o imposto de renda corporativo; as atividades de recursos humanos, finanças e jurídico; os custos imobiliários; os bônus a funcionários até um limite; as taxas de inscrição da FIA e da Superlicença; determinadas viagens a competições e testes; e os custos de sustentabilidade, saúde e segurança, e catering.

**Ajustes (Artigo D6.1.1):** correções nos custos totais para que o número reflita o que o trabalho de fato custou. Transações com partes relacionadas, entre equipes e de unidades de potência ligadas a uma atividade de F1 contam pelo maior valor entre o custo contratado e o valor justo, e receitas compensadas contra custos, em geral, precisam ser somadas de volta.

**Reporte (Artigo D7):** as equipes entregam a documentação de reporte intermediária e anual à Administração do Teto de Gastos. O pacote anual inclui um relatório de avaliação da empresa de auditoria independente que assina as demonstrações financeiras anuais auditadas da equipe.""",
        },
    },
}

VOSEO = re.compile(r"\b(vos|podés|tenés|sabés|querés|pensá|mirá|fijate|imaginate|acercate)\b", re.I)


def main() -> None:
    apply = "--apply" in sys.argv
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    rows, problems = [], []
    for locale, depths in LAYERS.items():
        tech = sb.table("glossary_terms").select("*").eq("slug", SLUG).eq("locale", locale).eq("depth", "technical").execute().data
        if not tech:
            problems.append(f"{locale}: no technical row to copy from")
            continue
        tech = tech[0]
        for depth, text in depths.items():
            if locale == "es" and VOSEO.search(text["short_definition"] + text["body_markdown"]):
                problems.append(f"es/{depth}: voseo marker found")
            rows.append({
                "slug": SLUG,
                "locale": locale,
                "depth": depth,
                "term": tech["term"],
                "category": tech["category"],
                "related_terms": tech["related_terms"],
                "sources": tech["sources"],
                "translation_group_id": tech["translation_group_id"],
                "short_definition": text["short_definition"],
                "body_markdown": text["body_markdown"],
                "status": "published",
                "published_at": PUBLISHED_AT,
            })
    print(f"{len(rows)} rows prepared")
    if problems:
        print("Refusing to write:\n  " + "\n  ".join(problems))
        sys.exit(1)
    if not apply:
        print("Dry run OK. Re-run with --apply to write.")
        return
    for row in rows:
        sb.table("glossary_terms").upsert(row, on_conflict="locale,slug,depth").execute()
    print(f"Upserted {len(rows)} rows.")


if __name__ == "__main__":
    main()
