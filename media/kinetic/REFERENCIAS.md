# Biblioteca de referencias
Qué técnica sacamos de cada vídeo de `referencias/` y cómo se pide en el `.json`.

| Vídeo | Técnica | En el motor |
|---|---|---|
| transiciones para las fechas.mov | Rueda curva 3D de nombres; caja de color (rojo → azul → verde) que marca la opción; letra grande a la izquierda | `"type": "wheel"` |
| transiciones letras.mov | Imagen u objeto bordeado con contornos de color que se dibujan solos | `"trace"` en textos, `"type": "track"` para trazados |
| presentacion de numero final.mov | Cuadrícula de baldosas que giran una a una para transformar una cifra en otra | `"enter": { "type": "tiles" }` |

Pendiente de aprovechar: el cubo que se despliega (fechas, 0:02), la cuadrícula 3×3 de cuadrados negros que se convierte en mosaico de letras (fechas, 0:03) y el texto que se escribe letra a letra (letras, 0:08).
