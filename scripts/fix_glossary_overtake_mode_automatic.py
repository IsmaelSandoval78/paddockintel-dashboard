#!/usr/bin/env python3
"""Corrects an inaccuracy in the already-published 'overtake-mode' glossary
term (eli5 + technical layers, EN+ES): Straight Mode/Corner Mode was
described as fully automatic with no driver input. Cross-checked against
a dedicated Motorsport.com report on driver workload plus F1.com's
'EXPLAINED' article: it's actually driver-activated (a steering wheel
button, same basic mechanic as the old DRS), with an automatic safety
close only when the driver brakes or lifts off. Corrected visibly per
EEAT-EXPERT.md's corrections policy, not silently edited.
"""

import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

CORRECTION_NOTE_EN = (
    "*Corrected 2026-09-15: this entry originally described Straight Mode/"
    "Corner Mode as fully automatic with no driver input. Cross-checked "
    "against a dedicated report on driver workload: it's driver-activated, "
    "the same basic mechanic as the old DRS button — corrected below.*\n\n"
)
CORRECTION_NOTE_ES = (
    "*Corregido el 15-09-2026: esta entrada describía originalmente Straight "
    "Mode/Corner Mode como totalmente automático, sin intervención del "
    "piloto. Verificado contra un reporte específico sobre la carga de "
    "trabajo del piloto: en realidad se activa manualmente, la misma "
    "mecánica básica que el viejo botón del DRS — corregido debajo.*\n\n"
)

UPDATES = [
    {
        "locale": "en",
        "depth": "eli5",
        "body_markdown": CORRECTION_NOTE_EN + """It's like a boost pad in a racing video game that only lights up when you're right on someone's bumper: get close enough to the car in front — within one second, at a defined point on track, exactly like the old DRS rule — and you're allowed to draw extra power from the car's battery and electric motor for a short window, giving a genuine speed advantage to help you complete the move.

The big difference from [DRS](/glossary/drs) is *what's* being adjusted. DRS opened a flap on the rear wing to physically cut aerodynamic drag. Overtake Mode doesn't touch the wing at all — it's a power boost from the electrified half of the engine. Separately, F1's 2026 cars also switch their wing angles between a high-downforce cornering setup and a low-drag straight-line setup — the driver activates that with a button too, just like the old DRS, but on every qualifying straight, for every car, regardless of whether anyone's chasing anyone (see [Active Aero](/glossary/active-aero) for the full mechanic). Overtake Mode is the extra layer on top, reserved specifically for a driver close enough to attack.""",
    },
    {
        "locale": "en",
        "depth": "technical",
        "body_markdown": CORRECTION_NOTE_EN + """2026's aero and power rules introduce two separate systems that are easy to conflate:

**Straight Mode / Corner Mode (formerly X-Mode/Z-Mode):** every car's front and rear wing angles switch between a low-drag configuration on straights and a high-downforce configuration for corners. Activation is driver-triggered — a control on the steering wheel, the same basic mechanic as the old DRS button — available on every qualifying straight, every lap, for every driver, regardless of whether they're racing anyone (full detail in [Active Aero](/glossary/active-aero)). The wings do close automatically the instant a driver brakes or lifts off the throttle, as a safety backstop, but engaging Straight Mode itself is a manual action, not automatic software behavior.

**Overtake Mode (formerly Manual Override Mode):** this is the actual mechanism replacing DRS's overtaking-assist role. When a chasing car is within one second of the car ahead at a defined detection point — the same proximity-gate concept DRS used — the driver can draw additional power from the electrified half of the [power unit](/glossary/power-unit) (the significantly upgraded MGU-K) for a limited window, adding genuine straight-line speed on top of the driver-activated Straight Mode aero state.

**Why a power boost instead of a drag-reducing flap:** with wing elements already simplified and drag reduced across the board by the 2026 regulations, there was less drag left for a DRS-style flap to meaningfully cut. Shifting the overtaking assist to the power unit — which received a major electric-power increase for 2026 anyway — gave the FIA a fresh, tunable lever to replace DRS's function without depending on the wings doing double duty.""",
    },
    {
        "locale": "es",
        "depth": "eli5",
        "body_markdown": CORRECTION_NOTE_ES + """Es como un power-up en un videojuego de carreras que solo se activa cuando estás pegado al paragolpes de alguien: acércate lo suficiente al auto de adelante — dentro de un segundo, en un punto definido de la pista, exactamente como la vieja regla del DRS — y puedes usar potencia extra de la batería y el motor eléctrico del auto durante una ventana corta, dando una ventaja de velocidad real para ayudarte a completar la maniobra.

La gran diferencia con el [DRS](/glossary/drs) es *qué* se está ajustando. El DRS abría un flap en el alerón trasero para reducir físicamente la resistencia aerodinámica. Overtake Mode no toca el alerón para nada — es un impulso de potencia de la mitad electrificada del motor. Por separado, los autos de F1 de 2026 también cambian el ángulo de sus alerones entre una puesta a punto de mucha carga para curvas y otra de poca resistencia para rectas — el piloto también activa eso con un botón, igual que el viejo DRS, pero en cada recta habilitada, para cada auto, sin importar si alguien persigue a alguien (ver [Active Aero](/glossary/active-aero) para el mecanismo completo). Overtake Mode es la capa extra encima, reservada específicamente para un piloto lo suficientemente cerca como para atacar.""",
    },
    {
        "locale": "es",
        "depth": "technical",
        "body_markdown": CORRECTION_NOTE_ES + """Las reglas de aero y potencia de 2026 introducen dos sistemas separados que es fácil confundir:

**Straight Mode / Corner Mode (antes X-Mode/Z-Mode):** el ángulo de los alerones delantero y trasero de cada auto cambia entre una configuración de poca resistencia en las rectas y una de mucha carga aerodinámica para las curvas. La activación la dispara el piloto — un control en el volante, la misma mecánica básica que el viejo botón del DRS — disponible en cada recta habilitada, en cada vuelta, para cada piloto, sin importar si está corriendo contra alguien (detalle completo en [Active Aero](/glossary/active-aero)). Los alerones sí se cierran automáticamente en el instante en que el piloto frena o suelta el acelerador, como respaldo de seguridad, pero activar Straight Mode en sí es una acción manual, no un comportamiento automático del software.

**Overtake Mode (antes Manual Override Mode):** este es el mecanismo real que reemplaza el rol de asistencia para adelantar que tenía el DRS. Cuando un auto que persigue está a menos de un segundo del auto de adelante en un punto de detección definido — el mismo concepto de umbral de proximidad que usaba el DRS — el piloto puede usar potencia adicional de la mitad electrificada de la [unidad de potencia](/glossary/power-unit) (la MGU-K, significativamente mejorada) durante una ventana limitada, sumando velocidad real en recta encima del estado aerodinámico de Straight Mode, que el piloto ya activó manualmente.

**Por qué un impulso de potencia en vez de un flap que reduce resistencia:** con los elementos de los alerones ya simplificados y la resistencia reducida en general por el reglamento 2026, quedaba menos resistencia para que un flap estilo DRS recortara de forma significativa. Trasladar la asistencia para adelantar a la unidad de potencia — que de todos modos recibió un aumento grande de potencia eléctrica para 2026 — le dio a la FIA una palanca nueva y ajustable para reemplazar la función del DRS sin depender de que los alerones cumplan una doble función.""",
    },
]


def main():
    sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    for upd in UPDATES:
        result = (
            sb.table("glossary_terms")
            .update({
                "body_markdown": upd["body_markdown"],
                "related_terms": ["drs", "ground-effect", "active-aero"],
            })
            .eq("slug", "overtake-mode")
            .eq("locale", upd["locale"])
            .eq("depth", upd["depth"])
            .execute()
        )
        print(f"OK  {upd['locale']}/overtake-mode/{upd['depth']}  ({len(result.data)} row)")


if __name__ == "__main__":
    main()
