---
slug: "bahrain-gp-malasia-2026-vitoria-72-de-verstappen"
title: "A Vitória de Verstappen É o Recibo do Sábado"
locale: pt
meta_description: "A 72ª vitória de Verstappen iguala Schumacher e dá à Red Bull-Ford seu 1º triunfo -- após 100 min de atraso por chuva e falha de motor."
status: published
published_at: "2026-10-04T16:00:00+00:00"
paywalled: false
translation_group_id: "a1ed0cba-4e97-4c50-a161-0034ea7f0172"
tags: ["race-analysis", "red-bull"]

stats:
  - value: "2,307s"
    label: "MARGEM DE VITÓRIA DE VERSTAPPEN SOBRE ANTONELLI"
    unit: "da pole à bandeira, sem precisar de sorte com o Safety Car"
  - value: "72"
    label: "VITÓRIAS NA CARREIRA DE VERSTAPPEN -- IGUALA SCHUMACHER"
    unit: "as 72 de Schumacher foram todas na Ferrari; as de Verstappen, todas na Red Bull"
  - value: "~100 min"
    label: "QUANTO A CHUVA E UMA FALHA DE MOTOR ATRASARAM A LARGADA"
    unit: "40 min de chuva, depois uma solução da FIA para uma falha de software"
  - value: "84 pts"
    label: "VANTAGEM DE ANTONELLI SOBRE RUSSELL NO CAMPEONATO APÓS SEPANG"
    unit: "a maior da temporada, com 7 corridas pela frente"

faq:
  - q: "Quem venceu o GP do Bahrein na Malásia de 2026?"
    a: "Max Verstappen, liderando todas as voltas depois que a corrida realmente começou e vencendo Kimi Antonelli por 2,307 segundos na bandeira -- sua primeira vitória de 2026 e a primeira da Red Bull Ford Powertrains em sua temporada de estreia."
  - q: "Por que o GP do Bahrein na Malásia foi atrasado?"
    a: "Uma chuva torrencial caiu sobre Sepang quarenta minutos antes da largada programada, e quando diminuiu, uma falha de software do motor que a FIA classificou como \"sem precedentes\" atingiu vários carros na volta de formação e forçou um atraso adicional -- cerca de 100 minutos no total antes que uma solução fosse distribuída e a corrida começasse."
  - q: "Quantos Grandes Prêmios Max Verstappen venceu na carreira?"
    a: "72, até o GP do Bahrein na Malásia de 2026 -- igualando o recorde de Michael Schumacher de mais vitórias com uma única equipe. As 72 de Schumacher foram todas na Ferrari; as de Verstappen, todas na Red Bull Racing."
  - q: "O que aconteceu com George Russell no GP do Bahrein na Malásia?"
    a: "O Mercedes dele falhou durante o segundo período de Safety Car da corrida, a cinco voltas do fim -- Toto Wolff confirmou um problema de motor. Somado ao segundo lugar de Kimi Antonelli, isso levou a diferença de Russell no campeonato à maior da temporada: 84 pontos, com sete corridas pela frente."

charts:
  - type: grid_to_finish
    title: "Da Classificação à Chegada"
    note: "Ordem de classificação, não o grid final -- a punição de cinco posições de Hadjar por um componente de motor (3º no ritmo, mas largou em 8º) empurra todo mundo do P4 em diante uma posição no grid, o que não muda nenhuma dessas posições finais. A punição de Lindblad foi bem maior: uma queda de 30 posições o jogou para o último lugar do grid (P22) apesar de ter classificado em 16º no ritmo, então seu 10º lugar final é uma corrida de último a pontuar através de todo o pelotão, não a melhora modesta de 16 para 10 que este gráfico sozinho sugeriria. Posições finais segundo a classificação oficial; o abandono de Russell aconteceu no segundo período de Safety Car, a cinco voltas do fim."
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
    title: "Ritmo por Volta, Ponta do Pelotão"
    note: "Cada volta dos cinco primeiros colocados, colorida em relação à melhor volta de cada piloto na corrida. As células em branco são as voltas molhadas do início, os pit stops, e o período de Safety Car entre as voltas 43 e 50 -- não são dados reais de ritmo para ninguém. As voltas 1 e 2 não têm tempo registrado na fonte de dados (largada atrasada e em formação)."
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

Max Verstappen venceu uma corrida que demorou mais para começar do que a maioria das corridas dura inteira. Uma chuva torrencial caiu sobre Sepang quarenta minutos antes da largada programada, e quando diminuiu, uma falha de software do motor que a FIA classificou como "sem precedentes" atingiu vários carros na volta de formação e forçou um atraso adicional -- cerca de 100 minutos no total antes que uma solução fosse distribuída e o pelotão realmente começasse a correr. Martin Brundle, na transmissão, chamou de "uma das corridas mais malucas de Fórmula 1 que já vi. Foi absolutamente surreal".

Verstappen venceu de forma limpa depois que a corrida começou: da pole à bandeira, 2,307 segundos à frente de Kimi Antonelli na chegada. Foi sua primeira vitória de 2026, o 72º triunfo da carreira -- igualando o recorde de Michael Schumacher de mais vitórias com uma única equipe, as de Schumacher todas na Ferrari, as de Verstappen todas na Red Bull Racing -- e a primeira vitória da Red Bull Ford Powertrains em sua temporada de estreia, na décima sexta tentativa. "Vencer nossa primeira corrida no nosso primeiro ano com motor próprio é bem impressionante", disse Verstappen. O chefe de equipe Laurent Mekies não hesitou: "O Max tem sido intocável".

## Da Classificação à Chegada

O gráfico abaixo mostra a verdadeira forma da corrida: onze pilotos cuja posição de classificação não diz quase nada sobre onde eles terminaram, porque a corrida de quase ninguém saiu como o sábado sugeria. Hadjar fez a terceira volta mais rápida na classificação, seu melhor fim de semana desde que voltou de uma lesão no pulso, e terminou em quinto depois que uma punição de cinco posições no grid por usar um sétimo motor de combustão interna fez o que punições de grid fazem. Antonelli classificou em quarto e terminou em segundo -- não pelo azar de mais ninguém, mas porque seu ritmo de corrida igualou o de Verstappen em tudo, menos nas voltas iniciais.

A linha de Hamilton no gráfico não faz justiça à sua tarde. Ele classificou em segundo, na primeira fila ao lado de Verstappen, e a Ferrari o mandou para a pista com pneus slick numa pista ainda molhada e secando. A aposta deu errado na hora -- ele caiu para o 18º lugar antes mesmo de a corrida realmente começar -- e passou o resto da tarde dirigindo de volta através do pelotão até terminar em terceiro, a 4,919 segundos da vitória. Um gráfico de classificação-para-chegada lê isso como "P2 para P3". Não foi uma corrida de "P2 para P3" para ele.

A linha de George Russell termina cedo. O Mercedes dele falhou no segundo período de Safety Car, a cinco voltas do fim, no que a Crash.net descreveu como um eco da própria falha de motor de Hamilton na mesma curva há uma década. Toto Wolff confirmou um problema de motor; a reação de Russell foi "Só rindo mesmo". Somado ao segundo lugar de Antonelli, isso levou sua diferença no campeonato à maior da temporada: 84 pontos, com sete corridas pela frente.

A linha mais discreta do gráfico esconde a maior história. Arvid Lindblad classificou em 16º, e depois recebeu uma punição de 30 posições no grid que o jogou para o último lugar -- P22, atrás dos outros 21 carros. Terminou em décimo e somou um ponto. Isso não é uma recuperação do 16º lugar; é uma corrida através de todo o pelotão desde o próprio fundo, e o formato de classificação-para-chegada acima não consegue mostrar isso sem dizer diretamente.

## Ritmo por Volta, Ponta do Pelotão

O mapa de calor abaixo é cada volta dos cinco primeiros colocados, colorida em relação à melhor volta de cada piloto -- mais claro é mais perto da sua melhor marca, mais escuro está mais longe. As voltas molhadas do início, os pit stops, e o período de Safety Car na faixa das voltas 43 a 50 ficam em branco em vez de coloridos, porque nenhum desses são dados reais de ritmo para ninguém.

O que sobra são dois trechos genuínos de bandeira verde: aproximadamente da volta 13 à 42, e o sprint até a bandeira a partir da volta 52. A linha de Verstappen é a que vale mais a pena olhar de perto -- não significativamente mais rápido que Antonelli ou Hamilton em nenhuma volta isolada, mas o mais consistentemente perto da própria melhor marca nos dois trechos, que é exatamente o tipo de corrida de onde sai uma vitória de 2,307 segundos de ponta a ponta. A linha de Hadjar conta a versão mais discreta da sua história: iguala a mesma faixa de ritmo apertada dos quatro pilotos deste gráfico que terminaram à frente dele, sem nada no cronômetro que explique a diferença para qualquer um deles, exceto a punição que já estava decidida antes de ele dar uma volta sequer.

## Veredito

[A pole do sábado](/pole-verstappen-sepang-aposta-motor-red-bull-2026) foi a versão limpa deste argumento: pista seca, uma volta, nada para reagir. O domingo foi a versão com tudo jogado contra -- uma largada atrasada pela chuva e uma falha de software do motor grave o bastante para precisar de uma solução da FIA em pleno grid, dois períodos de Safety Car, uma aposta de pneus que custou dezoito posições ao piloto que tinha largado em segundo, e o motor de um candidato ao título quebrando de vez a cinco voltas do fim. Nada disso aconteceu com a Red Bull-Ford. Verstappen nunca precisou de uma jogada de estratégia, porque o ritmo de sábado simplesmente se sustentou, volta após volta, exatamente no tipo de condição feita para expor uma fraqueza num motor que está na décima sexta corrida da própria existência.

Uma pole limpa é um único dado. Uma vitória que sobrevive a uma corrida que ativamente tenta quebrar tudo ao redor é bem mais difícil de descartar como um acaso isolado. As próprias medições da FIA disseram meses atrás que a Red Bull-Ford tinha construído o melhor motor do grid de 2026. Sepang é a primeira vez que o resultado e os dados concordam num dia em que mais nada deu certo.
