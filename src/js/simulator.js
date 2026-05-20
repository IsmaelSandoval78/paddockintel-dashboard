/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/simulator.js (v4 - Dual Ghost Matrix)
   Dual-Driver Interaction, Dynamic Sector Stamper & Real-Time Delta Engine
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sim-leaderboard");
    const lapIndicatorEl = document.getElementById("sim-lap-indicator");
    if (!container) return;

    // Base de datos local de respaldo en caso de retraso de red del JSON
    let telemetryDB = {
        drivers: {
            "antonelli": { name: "K. Antonelli", code: "ANT", color: "#27F4D2" },
            "verstappen": { name: "M. Verstappen", code: "VER", color: "#3671C6" },
            "leclerc": { name: "C. Leclerc", code: "LEC", color: "#E8002D" },
            "norris": { name: "L. Norris", code: "NOR", color: "#FF8000" },
            "hamilton": { name: "L. Hamilton", code: "HAM", team: "Ferrari", color: "#E8002D" }
        },
        matrix: {
            "1": {
                "antonelli":  {"s1": 31.42, "s2": 35.65, "s3": 29.81, "total_ms": 96880},
                "verstappen": {"s1": 30.95, "s2": 35.41, "s3": 29.92, "total_ms": 96280},
                "norris":     {"s1": 31.85, "s2": 35.91, "s3": 30.12, "total_ms": 97880},
                "hamilton":   {"s1": 32.11, "s2": 36.05, "s3": 30.45, "total_ms": 98610},
                "leclerc":    {"s1": 32.45, "s2": 36.21, "s3": 30.62, "total_ms": 99280}
            },
            "15": {
                "antonelli":  {"s1": 28.31, "s2": 33.25, "s3": 28.18, "total_ms": 89742},
                "verstappen": {"s1": 28.45, "s2": 33.41, "s3": 28.32, "total_ms": 90180},
                "leclerc":    {"s1": 28.75, "s2": 33.69, "s3": 28.49, "total_ms": 90930},
                "norris":     {"s1": 28.65, "s2": 33.58, "s3": 28.41, "total_ms": 90640},
                "hamilton":   {"s1": 28.81, "s2": 33.72, "s3": 28.55, "total_ms": 91080}
            },
            "34": {
                "antonelli":  {"s1": 30.11, "s2": 52.45, "s3": 28.62, "total_ms": 111180},
                "verstappen": {"s1": 29.95, "s2": 54.12, "s3": 28.85, "total_ms": 112920},
                "leclerc":    {"s1": 29.65, "s2": 51.20, "s3": 28.41, "total_ms": 109260},
                "hamilton":   {"s1": 29.88, "s2": 51.55, "s3": 28.52, "total_ms": 109950},
                "norris":     {"s1": 30.45, "s2": 55.11, "s3": 29.12, "total_ms": 114680}
            },
            "57": {
                "antonelli":  {"s1": 28.21, "s2": 33.15, "s3": 28.11, "total_ms": 89470},
                "verstappen": {"s1": 28.32, "s2": 33.22, "s3": 28.19, "total_ms": 89730},
                "leclerc":    {"s1": 28.45, "s2": 33.39, "s3": 28.31, "total_ms": 90150},
                "norris":     {"s1": 28.51, "s2": 33.42, "s3": 28.25, "total_ms": 90180},
                "hamilton":   {"s1": 28.62, "s2": 33.55, "s3": 28.42, "total_ms": 90590}
            }
        }
    };

    // 2. Inyectar la Consola de Mandos Interactiva de Apple
    container.className = "sim-layout-split";
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
            <div style="display:grid; grid-template-columns: 1fr 1fr 90px; gap:8px;">
                <select id="sel-driver-1" class="sim-btn" style="background:#22252e; text-align:left;"></select>
                <select id="sel-driver-2" class="sim-btn" style="background:#22252e; text-align:left;"></select>
                <select id="sel-lap" class="sim-btn" style="background:#22252e; font-family:monospace;"></select>
            </div>
            <div class="sim-controls" style="margin-top:4px;">
                <button id="btn-sim-play" class="sim-btn" style="background:var(--text-charcoal); min-width:130px;">▶ RUN ANALYSIS</button>
                <div class="sim-live-chrono-block" id="sim-chrono">00:00<span>.000</span></div>
                <button id="btn-sim-reset" class="sim-btn">🔄 RESET</button>
            </div>
        </div>
        <div class="sim-map-canvas" id="telemetry-canvas" style="margin-top:12px; height:180px;">
            <svg width="100%" height="100%" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet">
                <path id="miami-ghost-path" class="circuit-vector-path" 
                    d="M 45,110 C 45,40 120,30 170,50 C 220,70 260,40 285,85 C 310,130 265,175 200,165 C 140,155 110,190 75,165 C 45,140 45,130 45,110 Z" />
                <path id="miami-glow-path" class="circuit-active-glow" style="stroke: rgba(255,255,255,0.03);"
                    d="M 45,110 C 45,40 120,30 170,50 C 220,70 260,40 285,85 C 310,130 265,175 200,165 C 140,155 110,190 75,165 C 45,140 45,130 45,110 Z" />
            </svg>
            <div id="ghost-car-1" class="sim-gps-dot" style="display:none; width:26px; height:26px; font-size:9px;"></div>
            <div id="ghost-car-2" class="sim-gps-dot" style="display:none; width:26px; height:26px; font-size:9px; border-style:dashed;"></div>
        </div>
    `;

    const s1 = document.getElementById("sel-driver-1");
    const s2 = document.getElementById("sel-driver-2");
    const slap = document.getElementById("sel-lap");
    const playBtn = document.getElementById("btn-sim-play");
    const resetBtn = document.getElementById("btn-sim-reset");
    const svgPath = document.getElementById("miami-ghost-path");
    const canvas = document.getElementById("telemetry-canvas");
    const chronoEl = document.getElementById("sim-chrono");
    
    const car1 = document.getElementById("ghost-car-1");
    const car2 = document.getElementById("ghost-car-2");

    let animationId = null;
    let startTime = null;
    let isRunning = false;
    let animationDuration = 10000; // 10 segundos fijos por animación de vuelta
    let stampedSectors = new Set();

    // 3. Poblar Dropdowns dinámicamente
    function populateSelectors() {
        s1.innerHTML = ""; s2.innerHTML = ""; slap.innerHTML = "";
        Object.entries(telemetryDB.drivers).forEach(([id, d]) => {
            s1.innerHTML += `<option value="${id}">${d.name} (${d.code})</option>`;
            s2.innerHTML += `<option value="${id}">${d.name} (${d.code})</option>`;
        });
        Object.keys(telemetryDB.matrix).forEach(lap => {
            slap.innerHTML += `<option value="${lap}">LAP ${lap}</option>`;
        });
        
        // Predeterminados: Antonelli vs Verstappen
        s1.value = "antonelli";
        s2.value = "verstappen";
        slap.value = "15";
    }

    // Cargar JSON de Python en paralelo
    fetch('/src/data-outputs/lap-comparison.json')
        .then(r => r.ok ? r.json() : null)
        .then(res => { if(res) { telemetryDB = res; populateSelectors(); resetSimulation(); } })
        .catch(() => { populateSelectors(); resetSimulation(); });

    function loop(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        const d1 = s1.value;
        const d2 = s2.value;
        const currentLapNum = slap.value;

        const p1Data = telemetryDB.matrix[currentLapNum][d1];
        const p2Data = telemetryDB.matrix[currentLapNum][d2];

        if (!p1Data || !p2Data) return;

        const maxRealMs = Math.max(p1Data.total_ms, p2Data.total_ms);

        if (elapsed >= animationDuration) {
            // Fin de la vuelta: Clavar tiempos finales reales
            chronoEl.innerHTML = `GAP: ${( (p1Data.total_ms - p2Data.total_ms)/1000 ).toFixed(3)}s`;
            isRunning = false;
            playBtn.textContent = "▶ RUN ANALYSIS";
            stampSectorLabel(0.99, `🏁 FIN | ${telemetryDB.drivers[d1].code}: ${(p1Data.total_ms/1000).toFixed(2)}s | ${telemetryDB.drivers[d2].code}: ${(p2Data.total_ms/1000).toFixed(2)}s`, "bottom");
            return;
        }

        const currentProgressPct = elapsed / animationDuration;
        const pathLength = svgPath.getTotalLength();

        // ── FISICA GHOST 1 (Piloto 1) ──
        const p1TimePassed = currentProgressPct * p1Data.total_ms;
        const p1Distance = (p1TimePassed / p1Data.total_ms) * pathLength;
        const pt1 = svgPath.getPointAtLength(p1Distance % pathLength);
        car1.style.left = `${(pt1.x / 320) * 100}%`; car1.style.top = `${(pt1.y / 220) * 100}%`;

        // ── FISICA GHOST 2 (Piloto 2) ──
        const p2TimePassed = currentProgressPct * p2Data.total_ms;
        const p2Distance = (p2TimePassed / p2Data.total_ms) * pathLength;
        const pt2 = svgPath.getPointAtLength(p2Distance % pathLength);
        car2.style.left = `${(pt2.x / 320) * 100}%`; car2.style.top = `${(pt2.y / 220) * 100}%`;

        // ── CÁCULO DEL DELTA VIVO (Milisegundos de Transmisión) ──
        const liveDeltaSeconds = (p1TimePassed - p2TimePassed) / 1000;
        const leadingCode = liveDeltaSeconds <= 0 ? telemetryDB.drivers[d1].code : telemetryDB.drivers[d2].code;
        chronoEl.innerHTML = `${leadingCode} Δ <span>${Math.abs(liveDeltaSeconds).toFixed(3)}s</span>`;

        // ── DETECTAR HITOS DE SECTORES (Sector 1 al 33%, Sector 2 al 66%) ──
        if (currentProgressPct >= 0.33 && !stampedSectors.has("s1")) {
            stampedSectors.add("s1");
            stampSectorLabel(0.33, `S1 | ${telemetryDB.drivers[d1].code}: ${p1Data.s1}s | ${telemetryDB.drivers[d2].code}: ${p2Data.s1}s`, "top");
        }
        if (currentProgressPct >= 0.66 && !stampedSectors.has("s2")) {
            stampedSectors.add("s2");
            stampSectorLabel(0.66, `S2 | ${telemetryDB.drivers[d1].code}: ${p1Data.s2}s | ${telemetryDB.drivers[d2].code}: ${p2Data.s2}s`, "right");
        }

        animationId = requestAnimationFrame(loop);
    }

    function stampSectorLabel(percent, text, placement) {
        const point = svgPath.getPointAtLength(percent * svgPath.getTotalLength());
        const stamp = document.createElement("div");
        stamp.className = "sim-telemetry-stamp";
        
        let ox = 0, oy = 0;
        if (placement === "top") oy = -24;
        if (placement === "bottom") oy = 24;
        if (placement === "right") ox = 35;

        stamp.style.left = `${((point.x + ox) / 320) * 100}%`;
        stamp.style.top = `${((point.y + oy) / 220) * 100}%`;
        stamp.innerHTML = `<span class="stamp-name" style="font-size:8px;">${text}</span>`;
        canvas.appendChild(stamp);
    }

    function resetSimulation() {
        cancelAnimationFrame(animationId);
        isRunning = false; startTime = null; stampedSectors.clear();
        playBtn.textContent = "▶ RUN ANALYSIS";
        lapIndicatorEl.textContent = `TELEMETRY MATRIX`;
        chronoEl.innerHTML = `00:00<span>.000</span>`;
        document.querySelectorAll('.sim-telemetry-stamp').forEach(el => el.remove());

        const d1 = s1.value; const d2 = s2.value;
        if(!telemetryDB.drivers[d1]) return;

        car1.style.display = "flex"; car2.style.display = "flex";
        car1.style.backgroundColor = telemetryDB.drivers[d1].color; car1.textContent = telemetryDB.drivers[d1].code;
        car2.style.backgroundColor = telemetryDB.drivers[d2].color; car2.textContent = telemetryDB.drivers[d2].code;

        const startPoint = svgPath.getPointAtLength(0);
        car1.style.left = `${(startPoint.x / 320) * 100}%`; car1.style.top = `${(startPoint.y / 220) * 100}%`;
        car2.style.left = `${(startPoint.x / 320) * 100}%`; car2.style.top = `${(startPoint.y / 220) * 100}%`;
    }

    playBtn.addEventListener("click", () => {
        if (isRunning) {
            cancelAnimationFrame(animationId);
            playBtn.textContent = "▶ RUN ANALYSIS";
            isRunning = false;
        } else {
            if (!startTime) document.querySelectorAll('.sim-telemetry-stamp').forEach(el => el.remove());
            isRunning = true;
            playBtn.textContent = "⏸ PAUSE";
            animationId = requestAnimationFrame(loop);
        }
    });

    resetBtn.addEventListener("click", resetSimulation);
    s1.addEventListener("change", resetSimulation);
    s2.addEventListener("change", resetSimulation);
    slap.addEventListener("change", resetSimulation);
});