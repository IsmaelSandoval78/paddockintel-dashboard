---
slug: "azerbaijao-gp-2026-recuperacoes-baku"
title: "Duas recuperações decidiram Baku, não as relargadas"
locale: pt
meta_description: "Russell venceu em Baku por 0,196s — mas a recuperação de Verstappen do P8 e a de Antonelli do P16 são a verdadeira história."
status: published
published_at: "2026-09-26T15:00:00+00:00"
paywalled: false
translation_group_id: "c4f8e1d2-9b7a-4e6c-a3f0-1d8e6c2b5a97"
tags: ["featured", "race-analysis"]

stats:
  - value: "0,196s"
    label: "MARGEM DE VITÓRIA DE RUSSELL"
    unit: "sobre Verstappen, na linha de chegada"
  - value: "P16 → P5"
    label: "ANTONELLI"
    unit: "um dia depois do acidente na Q1"
  - value: "P8 → P2"
    label: "VERSTAPPEN"
    unit: "recuperação através do pelotão"

faq:
  - q: "Quem venceu o GP do Azerbaijão de 2026?"
    a: "George Russell, liderando todas as voltas e segurando Max Verstappen por 0,196 segundos na chegada, segundo o resultado oficial da F1.com."
  - q: "Como Kimi Antonelli terminou em quinto depois de bater na classificação?"
    a: "Antonelli havia batido na Q1 no dia anterior e largou em décimo sexto. Seus tempos de volta na corrida acompanharam o ritmo dos líderes por quase toda a prova — foi uma recuperação genuína, não construída em cima do azar de outros pilotos."
  - q: "O acidente de Colapinto afetou quem venceu a corrida?"
    a: "Não. O acidente múltiplo na volta da relargada, envolvendo Colapinto, Gasly e Norris, aconteceu bem longe da disputa pela liderança e é coberto separadamente, incluindo o que custou à McLaren e à Alpine no campeonato."

charts:
  - type: grid_to_finish
    title: "Da classificação à chegada"
    note: "Os dez pilotos que definem o fim de semana: o pódio, as duas recuperações e os três abandonos do incidente de Colapinto na relargada. As posições mostram a ordem de classificação, não o grid final — a punição de Sainz após a classificação o jogou cinco posições para trás, largando em P14, o que não muda nenhuma das outras nove posições."
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
    title: "Ritmo por volta, ponta do pelotão"
    note: "Todas as voltas de Russell, Verstappen, Hadjar e Antonelli, coloridas em relação à melhor volta de cada piloto na corrida. As células em branco são voltas dentro dos dois períodos de Safety Car — não são dados reais de ritmo para ninguém."
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

George Russell liderou todas as voltas do GP do Azerbaijão de 2026 e segurou Max Verstappen por 0,196 segundos na linha de chegada, numa corrida que comissários e imprensa já classificam como uma das mais caóticas da temporada: dois Safety Cars, um acidente múltiplo na volta da relargada que tirou três carros, e um pódio para um piloto que tinha ficado três corridas fora por uma lesão no pulso. Mas o resultado que realmente decidiu a corrida aconteceu bem antes de tudo isso: na classificação do dia anterior, e em quanto terreno dois pilotos precisaram recuperar a partir dali.

## As duas recuperações

Verstappen classificou em oitavo, chamando sua própria sessão de "não boa o suficiente". Passou o meio da corrida recuperando posições no pelotão e terminou em segundo, o rival mais próximo que Russell teve a tarde toda.

A recuperação de Kimi Antonelli foi a maior. Ele havia batido na Q1 no dia anterior e largou em décimo sexto — sua pior posição de grid na temporada, num circuito onde ultrapassar é genuinamente difícil. Terminou em quinto. Seus tempos de volta ficaram a poucos décimos dos líderes durante quase toda a distância da corrida, o tipo de ritmo que produz um resultado por mérito próprio, não um entregue pelo azar alheio. Ele chegava ao fim de semana na liderança do campeonato de pontos; uma classificação ruim não custou essa liderança, e a corrida de domingo é o motivo.

O pódio de Isack Hadjar entra na mesma conversa. Ele tinha perdido as três corridas anteriores por uma lesão no pulso, classificou em quarto no seu retorno e terminou no pódio pela primeira vez na carreira — numa prova com dois períodos de Safety Car que bagunçaram o ritmo de quase todo o pelotão.

## Da classificação à chegada

Três dos dez pilotos que definem este fim de semana abandonaram no mesmo incidente: Franco Colapinto travou as rodas na relargada e levou junto seu próprio companheiro Gasly e a McLaren de Norris. Esse acidente é coberto em detalhes separadamente, incluindo o que realmente custou à McLaren em relação à Alpine no campeonato. O gráfico abaixo cruza a posição de classificação com a posição final dos dez pilotos que realmente definiram como esta corrida vai ser lembrada.

## Ritmo por volta, ponta do pelotão

O gráfico abaixo mostra todas as voltas dos quatro pilotos mais relevantes, coloridas em relação à melhor volta de cada um na corrida — mais claro é mais perto da volta mais rápida, mais escuro está mais longe dela. As voltas dentro dos dois períodos de Safety Car ficam em branco em vez de coloridas, porque uma volta de Safety Car não é um dado real de ritmo para ninguém.

A linha de Russell é a mais reveladora: nunca a volta mais rápida da corrida, mas sim a mais consistente, que é exatamente o que uma vantagem desse tamanho precisa. A linha de Antonelli respalda a recuperação descrita acima — seu ritmo, durante quase toda a distância, fica na mesma faixa dos líderes, sem cair como cairia um piloto apenas somando pontos a partir de uma má posição de largada.

## Veredito

A manchete é a vitória de Russell, e é uma vitória real — ele nunca esteve seriamente ameaçado até as voltas finais e respondeu a cada ataque que Verstappen ainda tinha. Mas uma margem de 0,196 segundos na frente é uma história muito menor do que o que aconteceu atrás: dois pilotos que classificaram mal e voltaram ao pódio e a um quase-pódio por ritmo, não por sorte. O caos de Baku — os acidentes, os dois Safety Cars, a história do retorno ao pódio — é o que todo mundo vai lembrar desta corrida. As recuperações são o que realmente explica a ordem de chegada.
