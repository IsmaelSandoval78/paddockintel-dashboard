/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/simulator.js (v5 - 22-Driver Fluid Matrix Engine)
   Standing Start, RequestAnimationFrame Interpolation & Smooth Swapping
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    const data = window.miamiGridTelemetry;
    if (!data) return;

    const wallEl = document.getElementById("sim-telemetry-wall");
    const playBtn = document.getElementById("btn-sim-play");
    const resetBtn = document.getElementById("btn-sim-reset");
    const chronoEl = document.getElementById("sim-chrono");
    const lapIndicatorEl = document.getElementById("sim-lap-indicator");

    if (!wallEl) return; // Romper si no estamos en la portada

    let animationId = null;
    let startTime = null;
    let isRunning = false;
    let currentProgress = 0; // De 0.0 a 1.0

    const durationMs = data.simulationDurationSeconds * 1000;
    const rowHeight = 24; // 20px de fila + 4px de espaciado de seguridad

    // 1. Construcción inicial de las 22 ranuras en la pared de telemetría
    function buildTelemetryWall() {
        wallEl.innerHTML = "";
        const initialState = data.timeline[0];

        initialState.order.forEach((driverId, index) => {
            const driver = data.drivers[driverId];
            const row = document.createElement("div");
            row.id = `sim-row-${driverId}`;
            row.className = "sim-telemetry-row";
            row.style.top = `${index * rowHeight}px`;

            row.innerHTML = `
                <div class="sim-row-pos" id="sim-pos-${driverId}">P${index + 1}</div>
                <div class="sim-row-pill" style="background:${driver.color}">${driver.code}</div>
                <div class="sim-row-track-lane">
                    <div class="sim-row-bar-elastic" id="sim-bar-${driverId}" style="background:${driver.color}; width: 0%;"></div>
                </div>
                <div class="sim-row-gap-text" id="sim-gap-${driverId}">0.000s</div>
            `;
            wallEl.appendChild(row);
        });
    }

    // 2. Motor de interpolación matemática lineal cuadro por cuadro
    function getFrameTelemetry(progress) {
        let prev = data.timeline[0];
        let next = data.timeline[data.timeline.length - 1];

        for (let i = 0; i < data.timeline.length; i++) {
            if (data.timeline[i].progress <= progress) prev = data.timeline[i];
            if (data.timeline[i].progress >= progress) { next = data.timeline[i]; break; }
        }

        if (prev.progress === next.progress) {
            return { order: prev.order, gaps: prev.gaps };
        }

        const factor = (progress - prev.progress) / (next.progress - prev.progress);

        // Crear mapa temporal para promediar distancias individuales
        const currentGaps = {};
        
        // Mapear el gap de cada piloto en los dos puntos de control
        prev.order.forEach((driverId, prevIdx) => {
            const prevGap = prev.gaps[prevIdx];
            // Buscar el gap del mismo piloto en el siguiente checkpoint
            const nextIdx = next.order.indexOf(driverId);
            const nextGap = nextIdx !== -1 ? next.gaps[nextIdx] : prevGap;
            
            // Interpolar linealmente el gap exacto de este fotograma
            currentGaps[driverId] = prevGap + (nextGap - prevGap) * factor;
        });

        // Reordenar la grilla dinámicamente de menor a mayor distancia con respecto al P1
        const sortedOrder = Object.keys(currentGaps).sort((a, b) => currentGaps[a] - currentGaps[b]);
        const sortedGaps = sortedOrder.map(driverId => currentGaps[driverId]);

        return { order: sortedOrder, gaps: sortedGaps };
    }

    // 3. Renderizador continuo (60 FPS por Hardware)
    function loop(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        if (elapsed >= durationMs) {
            // Cierre de carrera: Bloquear estados finales perfectos de la meta
            currentProgress = 1.0;
            renderFrame(1.0);
            chronoEl.innerHTML = `01:36<span>.280</span>`; // Tiempo final del P1
            lapIndicatorEl.textContent = `LAP 1 COMPLETE`;
            playBtn.textContent = "▶ START TELEMETRY";
            isRunning = false;
            return;
        }

        currentProgress = elapsed / durationMs;
        renderFrame(currentProgress);

        // Actualizar Cronómetro Digital Corriendo en paralelo
        const currentRealSeconds = currentProgress * data.realLapTimeSeconds;
        const mins = Math.floor(currentRealSeconds / 60);
        const secs = Math.floor(currentRealSeconds % 60);
        const mils = Math.floor((currentRealSeconds % 1) * 1000);
        chronoEl.innerHTML = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}<span>.${String(mils).padStart(3, '0')}</span>`;

        animationId = requestAnimationFrame(loop);
    }

    function renderFrame(progress) {
        const frameData = getFrameTelemetry(progress);
        const maxGap = Math.max(...frameData.gaps, 1.0);

        frameData.order.forEach((driverId, index) => {
            const row = document.getElementById(`sim-row-${driverId}`);
            const posLabel = document.getElementById(`sim-pos-${driverId}`);
            const bar = document.getElementById(`sim-bar-${driverId}`);
            const gapLabel = document.getElementById(`sim-gap-${driverId}`);

            if (!row) return;

            // --- REUBICACIÓN ARMONIOSA VERTICAL ---
            // Reasigna el top de la fila. El CSS se encarga del desplazamiento elástico solo si cambia su rank
            row.style.top = `${index * rowHeight}px`;
            if (posLabel) posLabel.textContent = `P${index + 1}`;

            // --- DEFORMACIÓN HORIZONTAL DE BARRAS DE GAP ---
            const gap = frameData.gaps[index];
            if (index === 0) {
                if (bar) bar.style.width = `0%`;
                if (gapLabel) gapLabel.textContent = "LEADER";
            } else {
                // Inversamente proporcional: entre más cerca del líder, la barra es más delgada
                const widthPercentage = (gap / maxGap) * 85; 
                if (bar) bar.style.width = `${Math.max(2, widthPercentage)}%`;
                if (gapLabel) gapLabel.textContent = `+${gap.toFixed(3)}s`;
            }
        });
    }

    function resetSimulation() {
        cancelAnimationFrame(animationId);
        isRunning = false;
        startTime = null;
        currentProgress = 0;
        playBtn.textContent = "▶ START TELEMETRY";
        lapIndicatorEl.textContent = `LAP 1 TELEMETRY`;
        chronoEl.innerHTML = `00:00<span>.000</span>`;
        buildTelemetryWall();
    }

    playBtn.addEventListener("click", () => {
        if (isRunning) {
            cancelAnimationFrame(animationId);
            playBtn.textContent = "▶ START TELEMETRY";
            isRunning = false;
        } else {
            if (currentProgress >= 1.0) resetSimulation();
            isRunning = true;
            playBtn.textContent = "⏸ PAUSE";
            animationId = requestAnimationFrame(loop);
        }
    });

    resetBtn.addEventListener("click", resetSimulation);

    // Arrancar el muro en frío
    buildTelemetryWall();
});