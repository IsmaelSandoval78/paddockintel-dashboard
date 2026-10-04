---
slug: "bahrain-gp-malasia-2026-victoria-72-de-verstappen"
title: "La Victoria de Verstappen Es el Recibo del Sábado"
locale: es
meta_description: "La victoria 72 de Verstappen iguala a Schumacher y le da a Red Bull-Ford su primer triunfo -- tras 100 min de demora por lluvia y falla de motor."
status: published
published_at: "2026-10-04T16:00:00+00:00"
paywalled: false
translation_group_id: "a1ed0cba-4e97-4c50-a161-0034ea7f0172"
tags: ["race-analysis", "red-bull"]

stats:
  - value: "2.307s"
    label: "MARGEN DE VICTORIA DE VERSTAPPEN SOBRE ANTONELLI"
    unit: "de la pole a la bandera, sin necesitar suerte de Safety Car"
  - value: "72"
    label: "VICTORIAS DE LA CARRERA DE VERSTAPPEN -- IGUALA A SCHUMACHER"
    unit: "las 72 de Schumacher fueron en Ferrari; las de Verstappen, todas en Red Bull"
  - value: "~100 min"
    label: "CUÁNTO DEMORARON LA LARGADA LA LLUVIA Y UNA FALLA DE MOTOR"
    unit: "40 min de lluvia, y después una solución de la FIA a una falla de software"
  - value: "84 pts"
    label: "VENTAJA DE ANTONELLI SOBRE RUSSELL EN EL CAMPEONATO TRAS SEPANG"
    unit: "un máximo de la temporada, con 7 carreras por delante"

faq:
  - q: "¿Quién ganó el Gran Premio de Baréin en Malasia de 2026?"
    a: "Max Verstappen, liderando todas las vueltas una vez que la carrera arrancó de verdad y venciendo a Kimi Antonelli por 2.307 segundos en la bandera -- su primera victoria de 2026 y la primera de Red Bull Ford Powertrains en su temporada debut."
  - q: "¿Por qué se demoró el Gran Premio de Baréin en Malasia?"
    a: "Una lluvia torrencial cayó sobre Sepang cuarenta minutos antes de la largada programada, y cuando amainó, una falla de software del motor que la FIA calificó de \"sin precedentes\" afectó a varios autos en la vuelta de formación y forzó una demora adicional -- unos 100 minutos en total antes de que se distribuyera una solución y la carrera arrancara."
  - q: "¿Cuántos Grandes Premios ganó Max Verstappen en su carrera?"
    a: "72, hasta el Gran Premio de Baréin en Malasia de 2026 -- iguala el récord de Michael Schumacher de más victorias con un solo equipo. Las 72 de Schumacher fueron todas en Ferrari; las de Verstappen, todas en Red Bull Racing."
  - q: "¿Qué le pasó a George Russell en el Gran Premio de Baréin en Malasia?"
    a: "Su Mercedes falló durante el segundo período de Safety Car de la carrera, a cinco vueltas del final -- Toto Wolff confirmó un problema de motor. Sumado al segundo puesto de Kimi Antonelli, eso llevó la diferencia de Russell en el campeonato a un máximo de la temporada: 84 puntos, con siete carreras por delante."

charts:
  - type: grid_to_finish
    title: "De la Clasificación a la Meta"
    note: "Orden de clasificación, no grilla final -- la sanción de cinco puestos de Hadjar por un componente de motor (3° en ritmo, pero largó 8°) corre a todos del P4 en adelante un lugar en la grilla, algo que no cambia ninguna de estas posiciones finales. La sanción de Lindblad fue mucho más grande: una caída de 30 puestos lo mandó al último lugar de la grilla (P22) pese a clasificar 16° en ritmo, así que su 10° puesto final es un manejo de último a puntos a través de todo el pelotón, no la mejora moderada de 16 a 10 que este gráfico por sí solo sugeriría. Posiciones finales según la clasificación oficial; el abandono de Russell ocurrió en el segundo período de Safety Car, a cinco vueltas del final."
    rows:
      - { code: "VER", team: "redbull", quali: 1, finish: 1, highlight: true }
      - { code: "HAM", team: "ferrari", quali: 2, finish: 3, highlight: true }
      - { code: "HAD", team: "redbull", quali: 3, finish: 5 }
      - { code: "ANT", team: "mercedes", quali: 4, finish: 2, highlight: true }
      - { code: "LEC", team: "ferrari", quali: 5, finish: 4 }
      - { code: "NOR", team: "mclaren", quali: 6, finish: 9 }
      - { code: "PIA", team: "mclaren", quali: 7, finish: 6 }
      - { code: "RUS", team: "mercedes", quali: 8, finish: null, dnf: true, highlight: true }
      - { code: "LAW", team: "rb", quali: 11, finish: 7 }
      - { code: "ALO", team: "aston", quali: 12, finish: 8 }
      - { code: "LIN", team: "rb", quali: 16, finish: 10 }

  - type: lap_pace_heatmap
    title: "Ritmo por Vuelta, Punta del Pelotón"
    note: "Cada vuelta de los cinco primeros clasificados, coloreada contra la mejor vuelta propia de cada piloto en la carrera. Las celdas en blanco son las vueltas mojadas del arranque, las paradas en boxes, y el período de Safety Car entre las vueltas 43 y 50 -- no son datos reales de ritmo para nadie. Las vueltas 1 y 2 no tienen tiempo registrado en la fuente de datos (largada demorada y en formación)."
    outlierThresholdMs: 108000
    drivers:
      - code: "VER"
        team: "redbull"
        laps: [null,null,114550,109030,109634,110519,111456,111887,123556,null,147418,null,104849,103456,102227,101198,100980,100953,101386,101102,101154,101263,101409,101335,101553,101717,101753,101900,101895,101957,102005,102190,108881,121354,100888,100275,100675,100813,101173,100690,100935,100965,117083,null,135018,null,147148,null,null,145454,null,98423,98529,98614,98220]
      - code: "ANT"
        team: "mercedes"
        laps: [null,null,111458,108702,109756,110741,112884,112623,122695,null,147449,null,106383,104307,102901,101930,101337,101388,101415,101576,101441,101542,101607,103354,102031,101992,101881,102190,102175,102384,102429,102399,109078,121917,100338,100761,100610,100654,100829,101409,101230,101691,117598,136465,null,140144,145311,null,149726,145542,null,98589,98866,98904,98930]
      - code: "HAM"
        team: "ferrari"
        laps: [null,null,141532,133074,124251,121279,116549,112876,140394,143525,113622,128062,110975,104923,104598,102044,102784,102938,102498,102295,102490,101858,102174,102477,101727,102223,102013,102276,102145,102504,108868,120477,100178,100906,101158,101432,101183,101021,101612,101596,101175,101675,129124,null,136606,132150,129173,149879,149109,143882,null,99625,98610,99103,99445]
      - code: "LEC"
        team: "ferrari"
        laps: [null,null,null,139763,110859,110593,111829,111529,143096,null,116505,115259,111392,107355,104926,102023,101896,102138,103147,103477,103400,103885,103016,102907,103167,103316,103964,109954,121443,101804,100906,101264,101040,101328,101165,101456,101399,101549,101455,101902,101875,101765,132814,null,133830,132657,113770,null,148305,143965,null,99610,99396,99336,99808]
      - code: "HAD"
        team: "redbull"
        laps: [null,null,114964,111757,111549,112005,111570,112021,127852,null,145335,null,107028,104340,103392,103020,102518,101867,102045,102128,102406,102271,102452,102434,102768,102895,103014,103096,103302,103901,110437,122721,100627,101297,100369,101494,101237,101480,101683,101186,101700,101557,124013,138310,null,133181,129246,null,149136,144167,null,99792,100526,100920,99819]

sources:
  - name: "RacingNews365 — Max Verstappen and Red Bull-Ford make F1 history: 'Incredible!'"
    url: "https://racingnews365.com/max-verstappen-and-red-bull-ford-make-f1-history-incredible"
  - name: "RacingNews365 — Red Bull hail 'untouchable' Max Verstappen after smashing vital milestone"
    url: "https://racingnews365.com/red-bull-hail-untouchable-max-verstappen-after-smashing-vital-milestone"
  - name: "Sky Sports — Verstappen wins 'absolutely wild' Bahrain GP"
    url: "https://www.skysports.com/f1/news/12433/13594860/bahrain-gp-in-malaysia-max-verstappen-wins-first-race-of-2026-f1-season-in-wild-rain-hit-grand-prix-as-lewis-hamilton-surges-back"
  - name: "Crash.net — Max Verstappen wins bonkers Bahrain GP in Malaysia, George Russell's F1 title hopes up in smoke"
    url: "https://www.crash.net/f1/race-report/1106502/1/max-verstappen-wins-bonkers-bahrain-gp-malaysia-george-russells-f1-title"
  - name: "Autosport — F1 Bahrain GP in Malaysia: Verstappen wins chaotic race from Antonelli as Russell retires late on"
    url: "https://www.autosport.com/f1/news/f1-bahrain-gp-in-malaysia-report/10861849/"
  - name: "f1mania — Verstappen iguala marca de Schumacher com vitória no GP do Bahrein na Malásia"
    url: "https://www.f1mania.net/f1/f1-verstappen-iguala-marca-de-schumacher-com-vitoria-no-gp-do-bahrein-na-malasia/"
---

Max Verstappen ganó una carrera que tardó más en arrancar de lo que duran la mayoría de las carreras enteras. Una lluvia torrencial cayó sobre Sepang cuarenta minutos antes de la largada programada, y cuando amainó, una falla de software del motor que la FIA calificó de "sin precedentes" afectó a varios autos en la vuelta de formación y forzó una demora adicional -- unos 100 minutos en total antes de que se distribuyera una solución y el pelotón arrancara a correr de verdad. Martin Brundle, en la transmisión, la calificó como "una de las carreras más locas de Fórmula 1 que vi en mi vida. Fue absolutamente una locura".

Verstappen la ganó limpia una vez que arrancó: de la pole a la bandera, 2.307 segundos por delante de Kimi Antonelli en la meta. Fue su primera victoria de 2026, el triunfo número 72 de su carrera -- iguala el récord de Michael Schumacher de más victorias con un solo equipo, las de Schumacher todas en Ferrari, las de Verstappen todas en Red Bull Racing -- y la primera victoria de Red Bull Ford Powertrains en su temporada debut, al decimosexto intento. "Ganar nuestra primera carrera en nuestro primer año con motor propio es bastante impresionante", dijo Verstappen. El jefe de equipo Laurent Mekies no dudó: "Max estuvo intocable".

## De la Clasificación a la Meta

El gráfico de abajo muestra la verdadera forma de la carrera: once pilotos cuya posición de clasificación no dice casi nada sobre dónde terminaron, porque la carrera de casi nadie salió como el sábado hacía pensar. Hadjar clasificó tercero más rápido, su mejor fin de semana desde que volvió de una lesión en la muñeca, y terminó quinto después de que una sanción de cinco puestos en la grilla por usar un séptimo motor de combustión interna hiciera lo que hacen las sanciones de grilla. Antonelli clasificó cuarto y terminó segundo -- no por la mala suerte de nadie más, sino porque su ritmo de carrera igualó al de Verstappen en todo menos en las vueltas iniciales.

La línea de Hamilton en el gráfico no le hace justicia a su tarde. Clasificó segundo, en la primera fila al lado de Verstappen, y Ferrari lo mandó a pista con neumáticos slick en una pista todavía mojada y en proceso de secado. La apuesta salió mal de inmediato -- cayó al puesto 18 antes de que la carrera empezara de verdad -- y se pasó el resto de la tarde manejando de vuelta a través del pelotón hasta terminar tercero, a 4.919 segundos de la victoria. Un gráfico de clasificación a meta lee eso como "P2 a P3". No fue una carrera de "P2 a P3" para él.

La línea de George Russell termina antes de tiempo. Su Mercedes falló en el segundo período de Safety Car, a cinco vueltas del final, en lo que Crash.net describió como un eco de la propia falla de motor de Hamilton en la misma curva hace una década. Toto Wolff confirmó un problema de motor; la reacción de Russell fue "Hay que reírse". Sumado al segundo puesto de Antonelli, eso llevó su diferencia en el campeonato a un máximo de la temporada: 84 puntos, con siete carreras por delante.

La línea más silenciosa del gráfico esconde su historia más grande. Arvid Lindblad clasificó 16°, y después recibió una sanción de 30 puestos en la grilla que lo mandó al último lugar -- P22, detrás de los otros 21 autos. Terminó décimo y sumó un punto. Eso no es una remontada desde el 16° puesto; es un manejo a través de todo el pelotón desde el mismísimo fondo, y el formato de clasificación a meta de arriba no puede mostrar eso sin decirlo directamente.

## Ritmo por Vuelta, Punta del Pelotón

El mapa de calor de abajo es cada vuelta de los cinco primeros clasificados, coloreada contra la mejor vuelta propia de cada piloto -- más claro es más cerca de su mejor marca, más oscuro está más lejos. Las vueltas mojadas del arranque, las paradas en boxes, y el período de Safety Car a mitad de los cuarenta están en blanco en vez de coloreadas, porque ninguna de esas son datos reales de ritmo para nadie.

Lo que queda son dos tramos genuinos de bandera verde: aproximadamente de la vuelta 13 a la 42, y el sprint hasta la bandera desde la vuelta 52. La línea de Verstappen es la que vale la pena leer más de cerca -- no significativamente más rápido que Antonelli o Hamilton en ninguna vuelta individual, pero el más consistentemente cerca de su propia mejor marca en ambos tramos, que es exactamente el tipo de carrera de la que sale una victoria de 2.307 segundos de punta a punta. La línea de Hadjar cuenta la versión más silenciosa de su historia: iguala la misma banda de ritmo ajustada que los cuatro pilotos de este gráfico que terminaron adelante de él, sin nada en el cronómetro que explique la diferencia con ninguno de ellos salvo la sanción que ya estaba decidida antes de que diera una vuelta.

## Veredicto

[La pole del sábado](/pole-verstappen-sepang-apuesta-motor-red-bull-2026) fue la versión limpia de este argumento: pista seca, una vuelta, nada a qué reaccionar. El domingo fue la versión con todo en contra -- una largada demorada por la lluvia y una falla de software del motor lo bastante grave como para necesitar una solución de la FIA en plena grilla, dos períodos de Safety Car, una apuesta de neumáticos que le costó dieciocho puestos al piloto que había largado segundo, y el motor de un candidato al título rompiéndose del todo a cinco vueltas del final. Nada de eso le pasó a Red Bull-Ford. Verstappen nunca necesitó una jugada de estrategia, porque el ritmo del sábado simplemente se sostuvo, vuelta tras vuelta, en exactamente el tipo de condiciones hechas para exponer una debilidad en un motor que recién lleva dieciséis carreras de existencia.

Una pole limpia es un solo dato. Una victoria que sobrevive a una carrera que activamente trata de romper todo a su alrededor es mucho más difícil de descartar como casualidad. Las propias mediciones de la FIA dijeron hace meses que Red Bull-Ford había construido el mejor motor de la parrilla 2026. Sepang es la primera vez que el resultado y los datos coinciden en un día en que nada más salió bien.
