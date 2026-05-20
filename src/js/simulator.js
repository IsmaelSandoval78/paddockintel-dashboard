/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/simulator.js (Dynamic Horizontal Engine)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    const data = window.miamiSimData;
    if (!data) return;

    let currentLap = 1;
    let isPlaying = false;
    let intervalId = null;

    const trackLineEl = document.getElementById("sim-leaderboard");
    const lapIndicatorEl = document.getElementById("sim-lap-indicator");
    const playBtn = document.getElementById("btn-sim-play");
    const resetBtn = document.getElementById("btn-sim-reset");

    // Reconfigurar contenedor para que sea una pista horizontal
    if(trackLineEl) {
        trackLineEl.className = "sim-track-line";
    }

    function getInterpolatedLapData(lap) {
        let prev = data.laps[0];
        let next = data.laps[data.laps.length - 1];

        for (let i = 0; i < data.laps.length; i++) {
            if (data.laps[i].lap <= lap) prev = data.laps[i];
            if (data.laps[i].lap >= lap) { next = data.laps[i]; break; }
        }

        if (prev.lap === next.lap) return { order: prev.order, gaps: prev.gaps };

        const factor = (lap - prev.lap) / (next.lap - prev.lap);
        const interpolatedGaps = prev.gaps.map((prevGap, idx) => {
            const nextGap = next.gaps[idx] || prevGap;
            return prevGap + (nextGap - prevGap) * factor;
        });

        return { order: lap >= next.lap ? next.order : prev.order, gaps: interpolatedGaps };
    }

    function updateUI() {
        lapIndicatorEl.textContent = `LAP ${currentLap} / ${data.totalLaps}`;
        const lapData = getInterpolatedLapData(currentLap);
        
        // Limpiar pista horizontal
        trackLineEl.innerHTML = "";

        // Encontrar la distancia máxima de esta vuelta para escalar la pista de 0% a 100%
        const maxGap = Math.max(...lapData.gaps, 1.0);

        lapData.order.forEach((driverId, index) => {
            const driver = data.drivers[driverId];
            const gap = lapData.gaps[index];
            
            // Cálculo de física elástica: El líder (gap 0) va al 85% (derecha). 
            // Los de atrás se posicionan relativamente según su distancia en segundos.
            const leftPercentage = index === 0 ? 85 : Math.max(5, 85 - ((gap / maxGap) * 75));

            trackLineEl.innerHTML += `
                <div class="sim-capsule-capsule" style="left: ${leftPercentage}%">
                    <span class="sim-capsule-pos">P${index + 1}</span>
                    <div class="sim-capsule-badge" style="background:${driver.color}">
                        ${driver.code}
                    </div>
                </div>
            `;
        });
    }

    function play() {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.textContent = "⏸ Pause";
        intervalId = setInterval(() => {
            if (currentLap < data.totalLaps) {
                currentLap++;
                updateUI();
            } else {
                pause();
            }
        }, 300); // Velocidad de carrera fluida
    }

    function pause() {
        isPlaying = false;
        playBtn.textContent = "▶ Play";
        clearInterval(intervalId);
    }

    playBtn.addEventListener("click", () => {
        isPlaying ? pause() : play();
    });

    resetBtn.addEventListener("click", () => {
        pause();
        currentLap = 1;
        updateUI();
    });

    updateUI();
});