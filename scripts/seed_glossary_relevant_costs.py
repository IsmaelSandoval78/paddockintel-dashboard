#!/usr/bin/env python3
"""Draft glossary term: relevant-costs (EN/ES/PT, depth=technical).

Related-term chips on a glossary page resolve only to other glossary slugs
(see getRelatedGlossaryTerms). An article slug in related_terms is dropped,
so the Cost Cap Map is linked from this term's body, and cost-cap's
related_terms gain "relevant-costs" — not the article slug.

Does not publish. After review, flip the new rows (and confirm the cost-cap
chip) in Supabase.

Run from the repo root, with NEXT_PUBLIC_SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY in .env.local:

    python scripts/seed_glossary_relevant_costs.py

Idempotent: upserts relevant-costs on (locale, slug, depth) and appends
"relevant-costs" to every existing cost-cap row that does not already
list it. Re-running the older cost-cap seed files after this script would
overwrite related_terms; those files now include relevant-costs as well.
"""

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

GROUP_ID = "c4e8a1d2-7b63-4f90-9e15-8a2d6c0b47f1"
SLUG = "relevant-costs"

SOURCES = [
    {
        "name": "FIA — 2026 Formula One Financial Regulations for F1 Teams, Section D (Issue 3, 10 June 2025)",
        "url": "https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_regulations_-_f1_teams_-_iss_03-_2025-06-10.pdf",
    },
    {
        "name": "Formula1.com — EXPLAINED: What is the F1 cost cap and why has it gone up?",
        "url": "https://www.formula1.com/en/latest/article/explained-what-is-the-f1-cost-cap-and-why-has-it-gone-up.2tYtDIe5SbE5utjThctBT3",
    },
]

LOCALES = {
    "en": {
        "term": "Relevant Costs",
        "short_definition": "Relevant Costs are the F1-team costs that count toward the Cost Cap. The FIA defines them in Section D; named exclusions, including an F1 driver's pay for driving services, sit outside that total.",
        "body_markdown": """The [Cost Cap](/glossary/cost-cap) does not limit every dollar a team spends or earns. It limits Relevant Costs: the defined costs of operating, developing, manufacturing, testing, and racing the F1 car, after the exclusions and adjustments in the Financial Regulations.

A plain-English map of what generally falls inside, and what is named as outside — driver pay, the three highest-paid eligible personnel, specified travel, and the separate Power Unit Manufacturer rules — is in [F1 Cost Cap: what's included and excluded](/f1-cost-cap-what-is-included-and-excluded). The regulation text controls an edge case.""",
    },
    "es": {
        "term": "Costes Relevantes (Relevant Costs)",
        "short_definition": "Los costes relevantes son los costes del equipo de F1 que cuentan para el límite de costes. La FIA los define en la Sección D; las exclusiones nominadas, incluido el pago a un piloto de F1 por sus servicios de pilotaje, quedan fuera de ese total.",
        "body_markdown": """El [límite de costes](/es/glossary/cost-cap) no limita cada dólar que un equipo gasta o ingresa. Limita los costes relevantes: los costes definidos de operar, desarrollar, fabricar, probar y hacer correr el coche de F1, después de las exclusiones y los ajustes del Reglamento Financiero.

El mapa en lenguaje claro de lo que en general entra, y de lo que queda nominado fuera — el sueldo del piloto, las tres personas elegibles mejor pagadas, determinados viajes y el reglamento separado de los fabricantes de unidades de potencia — está en [Límite de costes de F1: qué incluye y qué excluye](/es/f1-cost-cap-what-is-included-and-excluded). El texto del reglamento decide un caso límite.""",
    },
    "pt": {
        "term": "Custos Relevantes (Relevant Costs)",
        "short_definition": "Custos relevantes são os custos da equipe de F1 que contam para o teto de gastos. A FIA os define na Seção D; as exclusões nomeadas, inclusive o pagamento a um piloto de F1 pelos serviços de pilotagem, ficam fora desse total.",
        "body_markdown": """O [teto de gastos](/pt/glossary/cost-cap) não limita cada dólar que uma equipe gasta ou recebe. Ele limita os custos relevantes: os custos definidos de operar, desenvolver, fabricar, testar e correr com o carro de F1, depois das exclusões e dos ajustes do Regulamento Financeiro.

O mapa em linguagem direta do que em geral entra, e do que fica nomeado fora — o salário do piloto, as três pessoas elegíveis mais bem pagas, viagens especificadas e o regulamento separado dos fabricantes de unidades de potência — está em [Teto de gastos da F1: o que entra e o que sai](/pt/f1-cost-cap-what-is-included-and-excluded). O texto do regulamento decide um caso-limite.""",
    },
}

def main() -> None:
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    for locale, content in LOCALES.items():
        row = {
            "translation_group_id": GROUP_ID,
            "locale": locale,
            "slug": SLUG,
            "term": content["term"],
            "category": "regulations",
            "depth": "technical",
            "short_definition": content["short_definition"],
            "body_markdown": content["body_markdown"],
            "related_terms": ["cost-cap"],
            "sources": SOURCES,
            "status": "draft",
        }
        sb.table("glossary_terms").upsert(row, on_conflict="locale,slug,depth").execute()
        print(f"OK  {locale}/{SLUG}/technical (draft)")

    existing = (
        sb.table("glossary_terms")
        .select("id, locale, depth, related_terms")
        .eq("slug", "cost-cap")
        .execute()
    )
    updated = 0
    for row in existing.data or []:
        terms = list(row.get("related_terms") or [])
        if SLUG in terms:
            continue
        terms.append(SLUG)
        sb.table("glossary_terms").update({"related_terms": terms}).eq("id", row["id"]).execute()
        updated += 1
        print(f"OK  cost-cap related_terms + {SLUG} ({row['locale']}/{row['depth']})")
    print(f"cost-cap rows updated: {updated}")
    print("Still draft. Publish relevant-costs only after the Section D issue check.")

if __name__ == "__main__":
    main()
