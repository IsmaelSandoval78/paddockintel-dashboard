---
slug: "azerbaiyan-gp-2026-remontadas-baku"
title: "Dos remontadas decidieron Bakú, no los relanzamientos"
locale: es
meta_description: "Russell ganó en Bakú por 0.196s — pero la remontada de Verstappen desde el P8 y la de Antonelli desde el P16 son la verdadera historia."
status: published
published_at: "2026-09-26T15:00:00+00:00"
paywalled: false
translation_group_id: "c4f8e1d2-9b7a-4e6c-a3f0-1d8e6c2b5a97"
tags: ["featured", "race-analysis"]

stats:
  - value: "0.196s"
    label: "MARGEN DE VICTORIA DE RUSSELL"
    unit: "sobre Verstappen, en la línea de meta"
  - value: "P16 → P5"
    label: "ANTONELLI"
    unit: "un día después de su choque en la Q1"
  - value: "P8 → P2"
    label: "VERSTAPPEN"
    unit: "remontada a través del pelotón"

faq:
  - q: "¿Quién ganó el Gran Premio de Azerbaiyán 2026?"
    a: "George Russell, liderando todas las vueltas y resistiendo a Max Verstappen por 0.196 segundos en la meta, según el resultado oficial de F1.com."
  - q: "¿Cómo terminó quinto Kimi Antonelli después de chocar en la clasificación?"
    a: "Antonelli había chocado en la Q1 el día anterior y largó decimosexto. Sus tiempos de vuelta en carrera igualaron el ritmo de los punteros durante casi toda la distancia — fue una remontada genuina, no una construida sobre la mala suerte de otros pilotos."
  - q: "¿El choque de Colapinto afectó a quién ganó la carrera?"
    a: "No. El accidente múltiple en la vuelta del relanzamiento, con Colapinto, Gasly y Norris, ocurrió bien lejos de la pelea por el liderato y se cubre por separado, incluyendo lo que le costó a McLaren y a Alpine en el campeonato."

charts:
  - type: grid_to_finish
    title: "De la clasificación a la meta"
    note: "Los diez pilotos que definen el fin de semana: el podio, las dos remontadas y los tres abandonos del incidente de Colapinto en el relanzamiento. Las posiciones muestran el orden de clasificación, no la grilla final — la sanción posterior de Sainz lo movió cinco puestos atrás para largar P14, algo que no cambia ninguna de las otras nueve posiciones."
    rows:
      - { code: "RUS", team: "mercedes", quali: 1, finish: 1, highlight: true }
      - { code: "LEC", team: "ferrari", quali: 2, finish: 4 }
      - { code: "PIA", team: "mclaren", quali: 3, finish: 14 }
      - { code: "HAD", team: "rb", quali: 4, finish: 3 }
      - { code: "NOR", team: "mclaren", quali: 5, finish: null, dnf: true }
      - { code: "HAM", team: "ferrari", quali: 6, finish: 6 }
      - { code: "GAS", team: "alpine", quali: 7, finish: null, dnf: true }
      - { code: "VER", team: "redbull", quali: 8, finish: 2, highlight: true }
      - { code: "SAI", team: "williams", quali: 9, finish: 10 }
      - { code: "ANT", team: "mercedes", quali: 16, finish: 5, highlight: true }

  - type: lap_pace_heatmap
    title: "Ritmo por vuelta, punta del pelotón"
    note: "Todas las vueltas de Russell, Verstappen, Hadjar y Antonelli, coloreadas contra la mejor vuelta propia de cada piloto en la carrera. Las celdas en blanco son vueltas dentro de los dos períodos de Safety Car — no son datos reales de ritmo para nadie."
    outlierThresholdMs: 115000
    drivers:
      - code: "RUS"
        team: "mercedes"
        laps: [null,109535,108858,108619,108169,107932,107812,107687,108016,107891,107869,107497,107607,107566,108011,107503,107925,107870,107580,107572,107465,107191,107109,107363,107364,107176,107058,107005,106991,106937,null,null,null,null,null,null,null,null,106332,106039,105620,105480,105721,105164,105055,105259,105037,104996,104916,105005,107230]
      - code: "VER"
        team: "redbull"
        laps: [null,109236,109023,109457,107851,107574,107931,107919,108868,108019,108557,108407,108001,108011,108132,107942,107687,107916,108454,107838,107663,107655,107385,107497,107207,107800,107480,107370,107307,107290,null,null,null,null,null,null,null,null,106422,106196,105784,105389,105574,105135,105070,105271,105136,104993,105020,105188,106520]
      - code: "HAD"
        team: "rb"
        laps: [null,109976,108833,109322,108447,107994,109033,107935,108248,108643,108366,108143,108130,108011,108180,107883,107909,108021,107598,108321,107547,107806,107444,107249,107482,107172,107992,107249,107337,107374,null,null,null,null,null,null,null,null,108253,106628,106251,106155,106167,105846,105733,105856,105844,105792,105618,105932,107805]
      - code: "ANT"
        team: "mercedes"
        laps: [null,111637,110744,109951,108913,108245,109433,109476,109871,108118,110312,109236,108135,108066,108062,108472,107852,108053,107860,108009,107732,108331,107901,107518,107899,107582,107554,107289,107452,null,null,null,null,null,null,null,null,null,109335,107249,107066,107410,106056,106209,105638,105551,105803,105716,105533,105413,108032]

sources:
  - name: "Formula1.com — Russell narrowly holds off Verstappen to take victory over the line in chaotic Azerbaijan GP"
    url: "https://www.formula1.com/en/latest/article/russell-narrowly-holds-off-verstappen-to-take-victory-over-the-line-in-chaotic-azerbaijan-gp.5J4lgNh82JDL2GM302irF0"
  - name: "RaceFans — Russell soaks up pressure from Verstappen to win Azerbaijan Grand Prix"
    url: "https://www.racefans.net/2026/09/26/russell-soaks-up-pressure-from-verstappen-to-win-azerbaijan-grand-prix/"
  - name: "RaceFans — 2026 Azerbaijan Grand Prix result and championship points"
    url: "https://www.racefans.net/2026/09/26/2026-azerbaijan-grand-prix-race-result-and-championship-points/"
---

George Russell lideró todas las vueltas del Gran Premio de Azerbaiyán 2026 y resistió a Max Verstappen por 0.196 segundos en la línea de meta, en una carrera que comisarios y prensa ya califican como una de las más caóticas de la temporada: dos Safety Cars, un accidente múltiple en la vuelta del relanzamiento que terminó con tres autos afuera, y un piloto en el podio que había estado tres carreras sin correr por una lesión de muñeca. Pero el resultado que realmente decidió la carrera se definió antes de todo eso: en la clasificación del día anterior, y en cuánto terreno tuvieron que recuperar dos pilotos desde ahí.

## Las dos remontadas

Verstappen clasificó octavo, calificando su propia sesión como "no lo suficientemente buena". Pasó la parte central de la carrera remontando posiciones y terminó segundo, el rival más cercano que tuvo Russell en toda la tarde.

La remontada de Kimi Antonelli fue la más grande. Había chocado en la Q1 el día anterior y largó decimosexto — su peor posición de grilla en la temporada, en un circuito donde adelantar es genuinamente difícil. Terminó quinto. Sus tiempos de vuelta se mantuvieron a pocas décimas de los punteros durante casi toda la distancia de carrera, el tipo de ritmo que produce un resultado por mérito propio y no uno regalado por la mala suerte ajena. Llegaba al fin de semana liderando el campeonato de puntos; una mala clasificación no le costó ese liderazgo, y la carrera del domingo es la razón.

El podio de Isack Hadjar entra en la misma conversación. Se había perdido las tres carreras anteriores por una lesión de muñeca, clasificó cuarto en su regreso y terminó en el podio por primera vez en su carrera — en una prueba con dos períodos de Safety Car que desordenaron el ritmo de casi todo el pelotón.

## De la clasificación a la meta

Tres de los diez pilotos que definen este fin de semana abandonaron en el mismo incidente: Franco Colapinto bloqueó las ruedas en el relanzamiento y se llevó puesto a su propio compañero Gasly y al McLaren de Norris. Ese choque se cubre en detalle por separado, incluyendo lo que realmente le costó a McLaren frente a Alpine en el campeonato. El gráfico de abajo traza la posición de clasificación contra la posición final para los diez pilotos que realmente definieron cómo se va a recordar esta carrera.

## Ritmo por vuelta, punta del pelotón

El gráfico de abajo muestra todas las vueltas de los cuatro pilotos más relevantes, coloreadas contra la mejor vuelta propia de cada uno en la carrera — más claro es más cerca de su vuelta más rápida, más oscuro está más lejos de ella. Las vueltas dentro de los dos períodos de Safety Car quedan en blanco en lugar de coloreadas, porque una vuelta de Safety Car no es un dato de ritmo real para nadie.

La fila de Russell es la más reveladora: nunca la vuelta más rápida de la carrera, pero sí la más consistente, que es justo lo que necesita un margen de victoria como el suyo. La fila de Antonelli respalda la remontada descrita arriba — su ritmo, durante casi toda la distancia, se mantiene en la misma franja que el de los punteros, no cae como lo haría un piloto que simplemente suma puntos desde una mala posición de grilla.

## Veredicto

El título es la victoria de Russell, y es una victoria real — nunca estuvo seriamente amenazado hasta las últimas vueltas y respondió a cada ataque que le quedaba a Verstappen. Pero un margen de 0.196 segundos adelante es una historia mucho más chica que lo que pasó atrás: dos pilotos que clasificaron mal y remontaron hasta el podio y el subcampeonato de la carrera por ritmo, no por suerte. El caos de Bakú —los choques, los dos Safety Cars, la historia del regreso al podio— es lo que todos van a recordar de esta carrera. Las remontadas son lo que realmente explica el orden de llegada.
