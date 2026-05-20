/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/simulator.js (v3 - Telemetry Ghost Lap)
   Cinematic SVG Progress & Live Curve Split Stamper Engine
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    const data = window.miamiFastestLapData;
    if (!data) return;

    // Elementos de la interfaz
    const container = document.getElementById("sim-leaderboard");
    const lapIndicatorEl = document.getElementById("sim-lap-indicator");
    const playBtn = document.getElementById("btn-sim-play");
    const resetBtn = document.getElementById("btn-sim-reset");

    if (!container) return;

    // 1. Configurar la escena de telemetría oscura premium
    container.className = "sim-layout-split";
    container.innerHTML = `
        <div class="sim-controls">
            <button id="btn-sim-play" class="sim-btn">▶ ANALYZE LAP</button>
            <div class="sim-live-chrono-block" id="sim-chrono">00:00<span>.000</span></div>
            <button id="btn-sim-reset" class="sim-btn">🔄 RESET</button>
        </div>
        <div class="sim-map-canvas" id="telemetry-canvas">
            <svg width="100%" height="100%" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet">
                <path id="miami-ghost-path" class="circuit-vector-path" 
                    d="M 45,110 C 45,40 120,30 170,50 C 220,70 260,40 285,85 C 310,130 265,175 200,165 C 140,155 110,190 75,165 C 45,140 45,130 45,110 Z" />
                <path id="miami-glow-path" class="circuit-active-glow" 
                    d="M 45,110 C 45,40 120,30 170,50 C 220,70 260,40 285,85 C 310,130 265,175 200,165 C 140,155 110,190 75,165 C 45,140 45,130 45,110 Z" />
            </svg>
            <div id="ghost-car" class="sim-gps-dot" style="display: none; --color-glow: ${data.color}; background-color: ${data.color}">
                ${data.code}
            </div>
        </div>
    `;

    // Reasignar elementos creados
    const svgPath = document.getElementById("miami-ghost-path");
    const glowPath = document.getElementById("miami-glow-path");
    const canvas = document.getElementById("telemetry-canvas");
    const chronoEl = document.getElementById("sim-chrono");
    const car = document.getElementById("ghost-car");

    let animationId = null;
    let startTime = null;
    let isRunning = false;
    let stampedCheckpoints = new Set(); // Para evitar duplicados en la misma vuelta

    const totalLength = svgPath.getTotalLength();
    const totalDurationMs = data.durationSeconds * 1000;

    // Formateador de tiempo real de F1 (Minutos:Segundos.Milisegundos)
    function formatTelemetryTime(currentMs) {
        // Mapeo lineal: Pasar el tiempo de animación (ej: 12s) al tiempo real del CSV (1:29.742)
        const progressFactor = currentMs / totalDurationMs;
        const totalRealSeconds = 89.742; // 1 min 29.742 seg en segundos puros
        const currentRealSeconds = progressFactor * totalRealSeconds;

        const mins = Math.floor(currentRealSeconds / 60);
        const secs = Math.floor(currentRealSeconds % 60);
        const mils = Math.floor((currentRealSeconds % 1) * 1000);

        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}<span>.${String(mils).padStart(3, '0')}</span>`;
    }

    function loop(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        if (elapsed >= totalDurationMs) {
            // Fin de la vuelta rápida: Clavar el tiempo final exacto del CSV
            chronoEl.innerHTML = `01:29<span>.742</span>`;
            car.style.left = `${(svgPath.getPointAtLength(totalLength).x / 320) * 100}%`;
            car.style.top = `${(svgPath.getPointAtLength(totalLength).y / 220) * 100}%`;
            
            // Forzar que aparezcan todos los checkpoints al final por si acaso
            data.checkpoints.forEach(chk => stampBadge(chk));
            
            lapIndicatorEl.textContent = `FASTEST LAP LOCKED`;
            playBtn.textContent = "▶ ANALYZE LAP";
            isRunning = false;
            return;
        }

        const progressPercent = elapsed / totalDurationMs;
        const currentDist = progressPercent * totalLength;
        const point = svgPath.getPointAtLength(currentDist);

        // Actualizar posición física del coche de Kimi
        car.style.left = `${(point.x / 320) * 100}%`;
        car.style.top = `${(point.y / 220) * 100}%`;

        // Actualizar el cronómetro digital
        chronoEl.innerHTML = formatTelemetryTime(elapsed);

        // Controlar el destello/estela del trazo
        glowPath.style.strokeDashoffset = totalLength - currentDist;

        // Evaluar si el monoplaza cruzó una curva/checkpoint
        data.checkpoints.forEach(chk => {
            if (progressPercent >= chk.percent && !stampedCheckpoints.has(chk.id)) {
                stampedCheckpoints.add(chk.id);
                stampBadge(chk);
            }
        });

        animationId = requestAnimationFrame(loop);
    }

    function stampBadge(chk) {
        // Obtener las coordenadas exactas de la curva en el vector
        const point = svgPath.getPointAtLength(chk.percent * totalLength);
        
        // Crear la estampa infográfica flotante
        const stamp = document.createElement("div");
        stamp.className = "sim-telemetry-stamp";
        
        // Ajustar desfase de posición para que no tape la línea del circuito
        let offsetTop = 0;
        let offsetLeft = 0;
        if (chk.placement === "top") offsetTop = -25;
        if (chk.placement === "bottom") offsetTop = 25;
        if (chk.placement === "left") offsetLeft = -35;
        if (chk.placement === "right") offsetLeft = 35;

        stamp.style.left = `${((point.x + offsetLeft) / 320) * 100}%`;
        stamp.style.top = `${((point.y + offsetTop) / 220) * 100}%`;

        stamp.innerHTML = `
            <span class="stamp-name">${chk.name}</span>
            <span class="stamp-time">${chk.split}</span>
        `;
        canvas.appendChild(stamp);
    }

    function resetSimulation() {
        cancelAnimationFrame(animationId);
        isRunning = false;
        startTime = null;
        stampedCheckpoints.clear();
        playBtn.textContent = "▶ ANALYZE LAP";
        lapIndicatorEl.textContent = `MIAMI GP 2026`;
        chronoEl.innerHTML = `00:00<span>.000</span>`;
        glowPath.style.strokeDashoffset = totalLength;
        
        // Eliminar todas las banderas viejas de las curvas
        document.querySelectorAll('.sim-telemetry-stamp').forEach(el => el.remove());

        // Colocar coche en la línea de salida
        const startPoint = svgPath.getPointAtLength(0);
        car.style.display = "flex";
        car.style.left = `${(startPoint.x / 320) * 100}%`;
        car.style.top = `${(startPoint.y / 220) * 100}%`;
    }

    playBtn.addEventListener("click", () => {
        if (isRunning) {
            cancelAnimationFrame(animationId);
            playBtn.textContent = "▶ ANALYZE LAP";
            isRunning = false;
        } else {
            if (!startTime) {
                resetSimulation();
            }
            isRunning = true;
            playBtn.textContent = "⏸ PAUSE TELEMETRY";
            lapIndicatorEl.textContent = `LIVE ANALYTICS`;
            animationId = requestAnimationFrame(loop);
        }
    });

    resetBtn.addEventListener("click", resetSimulation);

    // Inicializar coche en la grilla de salida
    resetSimulation();
});