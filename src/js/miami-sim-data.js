/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/miami-sim-data.js (v2 - High Fidelity)
   F1 Fastest Lap Telemetry Data Hub
   ═══════════════════════════════════════════════════════════ */

window.miamiFastestLapData = {
    driver: "Andrea Kimi Antonelli",
    code: "ANT",
    team: "Mercedes",
    color: "#27F4D2",
    finalTime: "1:29.742",
    durationSeconds: 12, // Duración de la animación en segundos para alta retención visual
    checkpoints: [
        { percent: 0.25, id: "chk-1", name: "T4 · High Speed", split: "14.825s", placement: "top" },
        { percent: 0.48, id: "chk-2", name: "SEC 1 · Chrono", split: "28.450s", placement: "right" },
        { percent: 0.70, id: "chk-3", name: "T16 · Chicane", split: "53.912s", placement: "bottom" },
        { percent: 0.88, id: "chk-4", name: "SEC 2 · Speed Trap", split: "1:01.570s", placement: "left" }
    ]
};