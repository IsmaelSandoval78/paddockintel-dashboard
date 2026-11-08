# Kit de tipografía cinética — paso a paso
1. Descomprime y mueve la carpeta `kinetic-kit` a tu Escritorio. Copia dentro tu música `PaddockIntel_Decoded.wav`.
2. Terminal:  cd ~/Desktop/kinetic-kit
3. Instala lo necesario (una sola vez):
   python3.13 -m pip install playwright imageio-ffmpeg
   python3.13 -m playwright install chromium
4. Prueba que todo funciona renderizando el ejemplo de Mercedes:
   python3.13 render.py mercedes-9.html prueba.mp4 --seconds 24 --hold 22.5 --music PaddockIntel_Decoded.wav --music-start 22.646
5. Para crear otros vídeos: escribe  claude  y pega:
   "Lee BRIEF-KINETIC.md y mercedes-9.html. Conviértelo en un template y haz un vídeo nuevo sobre: [tu tema]. Explícame en español."
