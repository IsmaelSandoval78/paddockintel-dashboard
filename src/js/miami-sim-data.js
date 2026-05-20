// Telemetría Dinámica Horizontal - GP de Miami 2026
window.miamiSimData = {
    totalLaps: 57,
    drivers: {
        "antonelli": { name: "ANT", team: "Mercedes", color: "#27F4D2" },
        "verstappen": { name: "VER", team: "Red Bull", color: "#3671C6" },
        "norris": { name: "NOR", team: "McLaren", color: "#FF8000" },
        "hamilton": { name: "HAM", team: "Ferrari", color: "#E8002D" },
        "russell": { name: "RUS", team: "Mercedes", color: "#27F4D2" },
        "leclerc": { name: "LEC", team: "Ferrari", color: "#E8002D" } // Entra a la batalla a mitad de carrera
    },
    laps: [
        { lap: 1, order: ["verstappen", "antonelli", "norris", "hamilton", "russell"], gaps: [0.0, 0.8, 1.5, 2.3, 3.1] },
        { lap: 10, order: ["verstappen", "antonelli", "norris", "hamilton", "russell"], gaps: [0.0, 1.1, 2.8, 4.2, 4.9] },
        { lap: 20, order: ["antonelli", "verstappen", "norris", "hamilton", "russell"], gaps: [0.0, 0.9, 3.5, 5.1, 6.0] },
        // Vuelta 34: Ventana de Pits. Russell cae, Leclerc vuela y se mete al P3
        { lap: 34, order: ["antonelli", "verstappen", "leclerc", "hamilton", "norris"], gaps: [0.0, 2.8, 4.5, 6.2, 7.8] },
        { lap: 45, order: ["antonelli", "verstappen", "leclerc", "norris", "hamilton"], gaps: [0.0, 4.1, 5.2, 8.9, 9.5] },
        { lap: 57, order: ["antonelli", "verstappen", "leclerc", "norris", "hamilton"], gaps: [0.0, 5.4, 6.1, 11.2, 11.8] }
    ]
};