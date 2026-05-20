// Telemetría simulada vuelta a vuelta - GP de Miami 2026
window.miamiSimData = {
    totalLaps: 57,
    drivers: {
        "antonelli": { name: "K. Antonelli", team: "Mercedes", color: "#27F4D2", code: "ANT" },
        "verstappen": { name: "M. Verstappen", team: "Red Bull", color: "#3671C6", code: "VER" },
        "norris": { name: "Lando Norris", team: "McLaren", color: "#FF8000", code: "NOR" },
        "hamilton": { name: "Lewis Hamilton", team: "Ferrari", color: "#E8002D", code: "HAM" },
        "russell": { name: "George Russell", team: "Mercedes", color: "#27F4D2", code: "RUS" }
    },
    // Momentos clave y distancias relativas (en segundos detrás del líder)
    laps: [
        { lap: 1, order: ["verstappen", "antonelli", "norris", "hamilton", "russell"], gaps: [0.0, 0.8, 1.5, 2.3, 3.1] },
        { lap: 5, order: ["verstappen", "antonelli", "norris", "hamilton", "russell"], gaps: [0.0, 1.2, 2.4, 3.8, 4.5] },
        { lap: 12, order: ["verstappen", "antonelli", "norris", "hamilton", "russell"], gaps: [0.0, 0.4, 3.1, 5.2, 5.9] },
        // ¡Adelantamiento! Antonelli toma la punta en la vuelta 15
        { lap: 15, order: ["antonelli", "verstappen", "norris", "hamilton", "russell"], gaps: [0.0, 0.6, 3.8, 6.1, 6.8] },
        { lap: 25, order: ["antonelli", "verstappen", "norris", "hamilton", "russell"], gaps: [0.0, 2.1, 4.2, 7.5, 8.2] },
        // Ventana de Pit Stops (vuelta 32), Hamilton adelanta a Norris en boxes
        { lap: 34, order: ["antonelli", "verstappen", "hamilton", "norris", "russell"], gaps: [0.0, 3.5, 8.1, 9.4, 11.2] },
        { lap: 45, order: ["antonelli", "verstappen", "hamilton", "norris", "russell"], gaps: [0.0, 4.8, 9.5, 10.1, 13.0] },
        { lap: 57, order: ["antonelli", "verstappen", "hamilton", "norris", "russell"], gaps: [0.0, 5.4, 11.2, 11.8, 15.4] }
    ]
};