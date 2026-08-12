# PaddockIntel DESIGN.md v2.0.0 — Relanzamiento (Holanda, 23 ago 2026)

Reemplaza el criterio visual v0.3.0 ("Swiss Industrial Print" único) por un sistema de **dos
registros** basado en 13 referencias analizadas en sesión de diseño. Sigue gobernando las
cuatro superficies (Hub, Blog, Digest, Book) — lo que cambia es que ya no comparten una única
paleta/forma, sino que cada una se asigna a un modo.

## Identidad

PaddockIntel es la **Wikipedia visual de la Fórmula 1**: autoridad de datos verificables +
storytelling que hace sentir al lector "el que entiende el juego por dentro" — nunca el drama
manufacturado de los medios genéricos de F1.

## Dos modos, no uno

El error a evitar es forzar un solo lenguaje visual para todo el sitio. No son dos sitios
distintos — son dos registros del mismo sistema, como una revista física tiene páginas de
datos/tablas y páginas de reportaje.

| Modo | Superficies | Referencia base | Peso |
|---|---|---|---|
| **Data Mode** | Hub, Digest | Dark Mode Techy (navy, no negro puro) | ~80% del producto |
| **Story Mode** | Blog, Book | Editorial cálido tipo revista independiente | ~20% del producto |

## Tokens — Data Mode (Hub, Digest)

- **Color:**
  - Fondo: `#0B1220` – `#0F1729` (azul marino oscuro, NO negro puro `#000000`)
  - Superficie de tarjeta: `#141C2E` con borde sutil `#1F2A3F`
  - Acento primario: `#E61919` (rojo de marca — sin cambios, misma disciplina de uso: enlaces,
    estados activos, callouts clave, nunca como fill grande)
  - Acento secundario de dato: teal/cian `#2DD4BF` para líneas de red/mapas — reservado para
    visualizaciones (track dominance, gráficos), nunca para CTAs
  - Oro (logros/campeonatos): `#D4B563` con wash `rgba(212,181,99,0.12)` — más claro que el
    `#C9A84C` de v0.3.0 para mantener contraste sobre navy; el wash es alpha sobre el fondo, no
    un hex sólido (a diferencia de v0.3.0 donde `--gold-dim` era un crema sólido, eso solo
    funciona sobre fondo claro)
  - Verde (stats positivos, ej. delta favorable): `#34D399` con wash `rgba(52,211,153,0.12)` —
    mismo criterio de wash por alpha, no hex sólido
  - Texto: blanco `#F4F4F0` / gris secundario `#8A93A6`
- **Tipografía:** Archivo Black (headlines) + JetBrains Mono (datos, labels, cifras) — igual
  que antes, funciona bien sobre fondo oscuro
- **Forma:** esquinas suavizadas en tarjetas de dato, `4–8px` — **ya no `0` universal**. Esto
  reemplaza la regla anterior de radio-cero, solo para superficies Data Mode. Botones/iconos
  chicos (ej. share button) se mantienen cuadrados — ver sección de ese componente
- **Motion:** líneas de flujo animadas (tipo "Energy Flow") reservadas para UN elemento por
  pantalla — nunca decorativo en todos lados. **Excepción:** los videos Remotion de track
  dominance NO usan este lenguaje — ver "Motion pieces" más abajo, se mantienen en el estándar
  Blueprint claro/sin-glow independientemente del modo del sitio en vivo

## Tokens — Story Mode (Blog, Book)

- **Color:** paleta cálida — crema `#F4F1EA`, rojo ladrillo, mostaza — inspirada en "Side
  Note", NO en "Fashora" (demasiado comercial/genérico para el tono buscado)
- **Tipografía:** Archivo Black (headlines cortos/callouts), Lora para body/prosa
  (line-height 1.6+) — sin cambios respecto a v0.3.0
- **Detalle de autor:** ilustraciones o marcas hechas a mano son opcionales, pero el tono de
  copy debe sentirse curado, no producido en masa
- **Grid editorial:** tarjetas de artículo con fotografía real + títulos con gancho de
  curiosidad, categorías codificadas por color
- **Forma:** se mantiene sin radio (`0`) — Story Mode no adopta las esquinas suaves de Data
  Mode, conserva el registro editorial/print anterior

## Elementos firma (lo que hace esto reconocible como PaddockIntel y no genérico)

**Regla del track dominance:** se representa plano, no isométrico — la claridad del dato
importa más que la personalidad visual, y en formato 9:16 (TikTok/Reels) lo plano escala mejor
a pantallas pequeñas.

**Excepción explícita — circuitos con desnivel real (dos subtipos, no confundir):**

- **Subtipo A — Cruce real (la pista pasa por encima de sí misma):** el puente de Suzuka es el
  único caso claro en el calendario actual. Se representa con pilares, sombra proyectada y
  separación de nivel — en planta los dos trazados se superpondrían como si estuvieran
  conectados, lo cual sería literalmente falso.
- **Subtipo B — Desnivel severo sin cruce:** Eau Rouge-Raidillon en Spa (~40m de desnivel en
  ese complejo, según fuentes públicas) y la subida de curva 1 en COTA. Sin pilares ni
  estructura elevada — es una rampa/ladera ascendente. Se representa como terrazas isométricas
  ascendentes con la cinta de pista siguiendo el perfil de subida, sin inventar un puente que
  no existe.

Verificar cuál subtipo aplica a cada circuito antes de diseñar su página — confundirlos es
inventar geometría que no es real.

1. **Track Dominance Map** — circuito real (no mapa del mundo) con trazado coloreado por
   dominancia entre dos pilotos, lenguaje de nodos/líneas brillantes (referencia Vireon)
   aplicado a un circuito de F1 en vez de un mapa mundial de amenazas. Aplica al componente
   interactivo en el sitio (Data Mode); los exports de video para redes siguen el estándar
   Blueprint, no este lenguaje de glow
2. **Panel personal ("arma tu equipo")** — nombre, avatar, stats propios, inspirado en el
   saludo personalizado de dashboards financieros y el "Customize dashboard" de fintech dark
3. **Feed social de predicciones/comparaciones** — inspirado en el "Master Trade Feed" de
   BitP: ver qué predicen o comparan otros fans que sigues, no solo tus propios datos
4. **Cifra grande como hero** — cuando un dato es el punto central de una pantalla, se
   presenta como tipografía gigante (inspirado en Vobiz "<80ms"), no enterrado en una tabla

## Psicología aplicada — resumen

- **Fan F1 que más se repitió en referencias "Encaja":** entender estrategia/técnica + estatus
  de "el que sabe" — el producto debe hablarle al fan que quiere números y contexto, no chisme
- **Lectura web que más se repitió:** autoridad por data cruda + recompensa inmediata arriba —
  el dato más importante de cada pantalla va arriba, sin requerir lectura previa

## Qué evitar explícitamente

- Isométrico genérico de kit de iconos — se ve como cualquier producto, no como F1
- Negro puro + un solo acento vibrante sin contexto real detrás — es el default de cualquier
  IA generando diseño; solo funciona si está anclado a algo específico del dominio
- Mezclar comercial genérico (estilo Fashora) con el tono editorial buscado — el sitio debe
  sentirse curado, no vendedor
- Aplicar Data Mode a Blog/Book o Story Mode a Hub/Digest — cada superficie tiene un modo
  asignado, no se mezclan registros en la misma pantalla sin criterio

## Superficies

**Hub** (Data Mode)
- Mapa interactivo + panel derecho, KPI cards con esquinas 4–8px sobre fondo `#0B1220`
- Neumorfismo previo de las KPI cards queda retirado — reemplazado por el lenguaje de tarjeta
  Data Mode (superficie `#141C2E`, borde `#1F2A3F`, sin sombra difusa)

**Digest** (Data Mode)
- Card-list layout sobre fondo Data Mode
- Headline: Archivo Black o Inter bold (evaluar en implementación)
- Source chip: JetBrains Mono, small, uppercase, acento teal `#2DD4BF` permitido para el chip
  (visualización de dato, no CTA)
- `our_summary`: Inter, regular (short-form, permanece Inter — Lora sigue reservada a
  superficies long-form)

**Blog** (Story Mode)
- Max content width ~680-720px para legibilidad
- Header stats block en JetBrains Mono sobre fondo Story Mode
- Body en Lora
- Pull-quotes / sección Verdict pueden usar Archivo Black, solo para líneas de callout cortas
  — nunca párrafos completos

**Book** (Story Mode)
- Ritmo tipo página — márgenes más anchos que Blog
- Números de capítulo en Archivo Black
- Body en Lora
- Fondo puede virar a blanco puro por "página" para diferenciarse del chrome web; rojo de
  acento reservado solo para separadores de capítulo

## Responsive breakpoints

Mobile/tablet-first en las cuatro superficies — se revisan en 375px, 768px y 1280px mínimo.

- **Phone (<768px)**: Bento grids → columna única. Headlines con `clamp()`, nunca `rem` fijo.
  Blog/Book → ancho completo con padding, sin max-width fijo. Tablas de datos → scroll
  horizontal o fallback de card apilada. Nav → menú colapsado.
- **Tablet (768-1024px)**: Bento grids → 2 columnas. Blog/Book mantienen max-width relajado,
  todavía no el column de 680-720px de escritorio.
- **Desktop (>1024px)**: Layout completo según lo especificado por superficie arriba.

## Share button component

Aparece en cada card de Digest y de preview de artículo de Blog — mismo componente, misma
posición, en ambos modos.

- Forma: cuadrado, `0` border-radius siempre — es un control de icono, no una tarjeta de dato,
  no adopta las esquinas suaves de Data Mode
- Icon-only (glifo de share), sin texto de label
- Mobile/tablet: dispara el share sheet nativo del OS vía Web Share API — WhatsApp, Facebook,
  etc. aparecen automáticamente según lo instalado, sin código extra
- Desktop fallback (sin soporte Web Share API): flyout chico — copiar link, X, Facebook,
  WhatsApp (vía link `wa.me/?text=`, sin SDK) — WhatsApp con prioridad de posición dado el
  público ES/PT en LatAm y Brasil — esquinas cuadradas, borde acento-rojo en hover, sin sombra
- Color: texto/icono en color de texto del modo por defecto (blanco en Data Mode, near-black
  en Story Mode), acento rojo `#E61919` solo en hover/active — misma disciplina de acento que
  el resto del sistema

## Motion pieces (Remotion) — estándar "Blueprint" (sin cambios, deliberado)

Aplica a cualquier composición de video data-driven (track dominance, tendencias de temporada,
etc.) que se exporte para redes. **Se mantiene independiente del Data Mode del sitio en vivo**
— el video es un objeto que circula fuera del sitio y no necesita matchear el navy oscuro del
dashboard.

- **Fondo**: `#F4F4F0` con grid técnico sutil (líneas tipo papel cuadriculado, apenas más
  oscuras que la base) — funcional, no decorativo
- **Dibujo de línea**: el trazado/track se dibuja progresivamente (`stroke-dashoffset`), nunca
  aparece completo de golpe
- **Highlight de dominancia**: el segmento del piloto líder en acento rojo `#E61919`, sólido,
  borde duro — sin blur, sin glow, sin gradiente (explícitamente NO el lenguaje Vireon del
  componente interactivo en Data Mode)
- **Piloto secundario**: neutral negro/gris — nunca un segundo color saturado
- **Profundidad sin oscuridad**: sombras hard-offset (sin blur) en elementos flotantes — mismo
  lenguaje "sticker sobre papel" que las cards Hub pre-v2, aplicado a un elemento en movimiento
- **Call-outs de medición**: marcas de tick al inicio/fin de segmento con label delta en
  JetBrains Mono (ej. `|— Δ0.32s —|`) — estilo de línea de cota arquitectónica
- **Un dato a la vez**: el elemento más grande en pantalla es siempre un solo número/label
- **Cámara**: ángulo fijo top-down tipo dibujo técnico — sin perspectiva 3D forzada
- **Easing**: aceleración/desaceleración orgánica en todo movimiento, nunca lineal o hard-cut

## Qué NO cambia entre superficies (invariantes v2)

- Acento primario `#E61919` y su disciplina de uso (nunca fill grande, siempre puntual)
- Archivo Black reservado exclusivamente a texto de peso headline
- JetBrains Mono para todo dato tabular/numérico en ambos modos
- La asignación superficie → modo (Hub/Digest = Data Mode, Blog/Book = Story Mode) no se
  mezcla dentro de una misma pantalla
- El estándar Blueprint de Motion/Remotion no adopta el lenguaje glow de Data Mode

Lo que **sí** cambia respecto a v0.3.0: radio-cero universal (ahora solo aplica a Story Mode
y a controles de icono como el share button; Data Mode usa 4–8px en tarjetas), y el
neumorfismo de las KPI cards del Hub (retirado, reemplazado por tarjeta Data Mode estándar).

## Referencia de sesión (13 analizadas)

| # | Referencia | Estilo | Veredicto |
|---|---|---|---|
| 1 | SaaS Logística Isométrica | Swiss + Motorsport HUD | Encaja |
| 2 | GT Diagram Kit | Isometric Icon Kit | Tal vez |
| 3 | SaaS Isométrico Genérico | Isometric Icon Kit | No |
| 4 | Financial Dashboard (Bento) | Minimal Data-Viz | Encaja |
| 5 | Phoenix Zeus-X | Dark Mode Techy | Encaja |
| 6 | Milkinside | Glassmorphism | Tal vez |
| 7 | Fintech Dark Glow | Dark Mode Techy + Glass | Encaja |
| 8 | Fashora | Editorial Bold Maximalist | Tal vez |
| 9 | Side Note | Editorial / Luxury cálido | Encaja |
| 10 | BitP Trading Dashboard | Dark Mode Techy | Encaja |
| 11 | Vireon Threat Center | Dark Mode Techy | Encaja |
| 12 | Vobiz | Minimal Data-Viz | Tal vez |
| 13 | Fig.com | Editorial/Luxury + 3D Cinematográfico | Tal vez |

*(La librería visual completa con imágenes vive en el artifact de Claude original de la
sesión de diseño — este documento es la fuente de verdad textual para el repo.)*
