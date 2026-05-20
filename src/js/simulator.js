/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/simulator.js (Race Simulation Engine)
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    const data = window.miamiSimData;
    if (!data) return;

    let currentLap = 1;
    let isPlaying = false;
    let intervalId = null;

    const leaderboardEl = document.getElementById("sim-leaderboard");
    const lapIndicatorEl = document.getElementById("sim-lap-indicator");
    const playBtn = document.getElementById("btn-sim-play");
    const resetBtn = document.getElementById("btn-sim-reset");

    // Función matemática para interpolar los gaps entre vueltas clave
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

        // Mantenemos el orden de la vuelta clave más cercana
        return { order: lap >= next.lap ? next.order : prev.order, gaps: interpolatedGaps };
    }

    function updateUI() {
        lapIndicatorEl.textContent = `LAP ${currentLap} / ${data.totalLaps}`;
        const lapData = getInterpolatedLapData(currentLap);
        
        leaderboardEl.innerHTML = "";

        lapData.order.forEach((driverId, index) => {
            const driver = data.drivers[driverId];
            const gap = lapData.gaps[index];
            const gapText = index === 0 ? "LEADER" : `+${gap.toFixed(1)}s`;
            
            // Inversamente proporcional para la barra de progreso visual
            const barWidth = Math.max(20, 100 - (gap * 4)); 

            leaderboardEl.innerHTML += `
                <div class="sim-driver-row">
                    <div class="sb-pos">${index + 1}</div>
                    <div class="sb-color-bar" style="background:${driver.color}"></div>
                    <div class="sb-info">
                        <span class="sb-name">${driver.name}</span>
                        <div class="sb-bar-wrap">
                            <div class="sb-bar" style="width:${barWidth}%; background:${driver.color}; opacity:0.8"></div>
                        </div>
                    </div>
                    <div class="sim-live-gap">${gapText}</div>
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
        }, 1000); // 1 vuelta por segundo
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

    // Inicializar primera vuelta
    updateUI();
});