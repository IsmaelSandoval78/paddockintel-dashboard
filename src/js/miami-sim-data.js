/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL — src/js/miami-sim-data.js (v5 - Grid Completa 22 Pilotos)
   Matrix de Telemetría Oficial Vuelta 1 - GP de Miami 2026
   ═══════════════════════════════════════════════════════════ */

window.miamiGridTelemetry = {
    totalLaps: 57,
    simulationDurationSeconds: 30, // 30 segundos cinematográficos de visualización
    realLapTimeSeconds: 96.280,   // Tiempo real de la Vuelta 1 (Standing Start)
    drivers: {
        "verstappen": { name: "M. Verstappen", code: "VER", team: "Red Bull", color: "#3671C6" },
        "antonelli":  { name: "K. Antonelli",  code: "ANT", team: "Mercedes", color: "#27F4D2" },
        "leclerc":     { name: "C. Leclerc",    code: "LEC", team: "Ferrari", color: "#E8002D" },
        "norris":      { name: "L. Norris",     code: "NOR", team: "McLaren", color: "#FF8000" },
        "hamilton":    { name: "L. Hamilton",   code: "HAM", team: "Ferrari", color: "#E8002D" },
        "russell":     { name: "G. Russell",    code: "RUS", team: "Mercedes", color: "#27F4D2" },
        "piastri":     { name: "O. Piastri",    code: "PIA", team: "McLaren", color: "#FF8000" },
        "sainz":       { name: "C. Sainz",      code: "SAI", team: "Aston Martin", color: "#229971" },
        "perez":       { name: "S. Pérez",      code: "PER", team: "Red Bull", color: "#3671C6" },
        "alonso":      { name: "F. Alonso",     code: "ALO", team: "Aston Martin", color: "#229971" },
        "gasly":       { name: "P. Gasly",      code: "GAS", team: "Alpine", color: "#FF87BC" },
        "albon":       { name: "A. Albon",      code: "ALB", team: "Williams", color: "#64C4FF" },
        "tsunoda":     { name: "Y. Tsunoda",    code: "TSU", team: "RB", color: "#6692FF" },
        "hulkenberg":  { name: "N. Hülkenberg", code: "HUL", team: "Audi", color: "#52E252" },
        "bearman":     { name: "O. Bearman",    code: "BEA", team: "Haas", color: "#B6BABD" },
        "ocon":        { name: "E. Ocon",       code: "OCO", team: "Alpine", color: "#FF87BC" },
        "stroll":      { name: "L. Stroll",     code: "STR", team: "Cadillac", color: "#C8102E" },
        "ricciardo":   { name: "D. Ricciardo",  code: "RIC", team: "Cadillac", color: "#C8102E" },
        "magnussen":   { name: "K. Magnussen",  code: "MAG", team: "Haas", color: "#B6BABD" },
        "bottas":      { name: "V. Bottas",     code: "BOT", team: "Williams", color: "#64C4FF" },
        "zhou":        { name: "G. Zhou",       code: "ZHO", team: "Audi", color: "#52E252" },
        "bortoleto":   { name: "G. Bortoleto",  code: "BOR", team: "RB", color: "#6692FF" }
    },
    // Evolución de posiciones y distancias (gaps en segundos detrás del P1) durante la Vuelta 1
    timeline: [
        {
            progress: 0.0, // Arrancada (Semáforo en Verde)
            order: ["verstappen", "antonelli", "leclerc", "norris", "hamilton", "russell", "piastri", "sainz", "perez", "alonso", "gasly", "albon", "tsunoda", "hulkenberg", "bearman", "ocon", "stroll", "ricciardo", "magnussen", "bottas", "zhou", "bortoleto"],
            gaps:  [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1]
        },
        {
            progress: 0.33, // Sector 1 (Curva 4 - Ataques iniciales)
            order: ["verstappen", "antonelli", "norris", "leclerc", "hamilton", "russell", "piastri", "perez", "sainz", "alonso", "albon", "gasly", "tsunoda", "bearman", "hulkenberg", "ocon", "ricciardo", "stroll", "magnussen", "bottas", "bortoleto", "zhou"],
            gaps:  [0.0, 0.4, 1.1, 1.5, 2.1, 2.6, 3.1, 3.8, 4.2, 4.9, 5.5, 5.9, 6.4, 7.1, 7.5, 8.2, 8.9, 9.4, 10.1, 10.8, 11.2, 12.0]
        },
        {
            progress: 0.66, // Sector 2 (Gran Recta Posterior - Rebufo y adelantamiento de Kimi)
            order: ["antonelli", "verstappen", "norris", "hamilton", "leclerc", "russell", "piastri", "perez", "sainz", "alonso", "albon", "tsunoda", "gasly", "bearman", "ricciardo", "hulkenberg", "ocon", "stroll", "magnussen", "bortoleto", "bottas", "zhou"],
            gaps:  [0.0, 0.2, 1.8, 2.4, 2.9, 3.8, 4.2, 5.1, 5.6, 6.5, 7.1, 7.8, 8.2, 9.0, 9.8, 10.2, 10.9, 11.5, 12.3, 13.1, 13.6, 14.8]
        },
        {
            progress: 1.0, // Línea de Meta (Cierre de la Vuelta 1)
            order: ["antonelli", "verstappen", "norris", "hamilton", "leclerc", "russell", "piastri", "perez", "sainz", "alonso", "albon", "tsunoda", "bearman", "gasly", "ricciardo", "hulkenberg", "stroll", "ocon", "magnussen", "bortoleto", "bottas", "zhou"],
            gaps:  [0.0, 0.6, 2.1, 2.8, 3.4, 4.2, 4.9, 5.8, 6.2, 7.1, 8.0, 8.6, 9.5, 9.9, 10.6, 11.2, 12.1, 12.5, 13.4, 14.1, 14.8, 16.2]
        }
    ]
};