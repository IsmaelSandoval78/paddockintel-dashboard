/* ═══════════════════════════════════════════════════════════
   PADDOCKINTEL i18n — Diccionario Global de Traducciones
   ═══════════════════════════════════════════════════════════ */

const translations = {
    es: {
        // --- PORTADA (index.html) ---
        meta_title: "PaddockIntel — Panel de Inteligencia F1",
        logo_sub: "Panel de Inteligencia de F1",
        nav_news: "↗ Noticias",
        live_data: "Datos en Vivo",
        season_badge: "F1 · TEMPORADA 2026",
        loading: "Cargando…",
        ticker_loading: "Inteligencia F1 · Cargando clasificaciones…",
        map_title: "Temporada 2026 F1",
        map_rounds: "24 Rondas",
        legend_completed: "Completados",
        legend_next: "Próxima Carrera",
        legend_upcoming: "Próximas",
        legend_hint: "Haz clic en un circuito ↗",
        wdc_title: "Campeonato de Pilotos",
        wcc_title: "Campeonato de Constructores",
        footer_intel: "Inteligencia F1",
        footer_credits: "Datos: Ergast/jolpi.ca · OpenWeather · Estimaciones salariales vía reportes públicos · Modelo de premios estimado",
        footer_profiles: "Perfiles de Pilotos",

        // --- PERFILES (driver.html / constructor.html) ---
        driver_profile_title: "PaddockIntel — Perfil de Piloto",
        driver_economic_profile: "Perfil Económico del Piloto",
        back_dashboard: "← Volver al Panel",
        loading_driver: "Cargando perfil del piloto...",
        loading_records: "Cargando registros históricos...",
        loading_economics: "Cargando analítica económica...",
        season_results_title: "Resultados Temporada 2026",
        by_race_tag: "Por Carrera",
        economic_intel_title: "Inteligencia Económica"
    },
    en: {
        // --- PORTADA (index.html) ---
        meta_title: "PaddockIntel — F1 Intelligence Dashboard",
        logo_sub: "F1 Intelligence Dashboard",
        nav_news: "↗ News",
        live_data: "Live Data",
        season_badge: "F1 · 2026 SEASON",
        loading: "Loading…",
        ticker_loading: "F1 Intelligence · Loading standings…",
        map_title: "2026 F1 Season",
        map_rounds: "24 Rounds",
        legend_completed: "Completed",
        legend_next: "Next Race",
        legend_upcoming: "Upcoming",
        legend_hint: "Click a circuit ↗",
        wdc_title: "Driver Championship",
        wcc_title: "Constructor Championship",
        footer_intel: "F1 Intelligence",
        footer_credits: "Data: Ergast/jolpi.ca · OpenWeather · Salary estimates via public reporting · Prize model estimated",
        footer_profiles: "Driver Profiles",

        // --- PERFILES (driver.html / constructor.html) ---
        driver_profile_title: "PaddockIntel — Driver Profile",
        driver_economic_profile: "Driver Economic Profile",
        back_dashboard: "← Dashboard",
        loading_driver: "Loading driver profile...",
        loading_records: "Loading records...",
        loading_economics: "Loading economic metrics...",
        season_results_title: "2026 Season Results",
        by_race_tag: "By Race",
        economic_intel_title: "Economic Intelligence"
    }
};

// Detectar idioma del navegador o el guardado en caché
let currentLang = localStorage.getItem("paddock_lang") || 
                  (navigator.language.startsWith("es") ? "es" : "en");

function applyTranslations() {
    // Buscar todos los elementos con el atributo data-i18n
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    // Resaltar visualmente el botón del idioma activo en el Header
    document.querySelectorAll(".lang-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`btn-lang-${currentLang}`);
    if (activeBtn) activeBtn.classList.add("active");

    localStorage.setItem("paddock_lang", currentLang);
    document.documentElement.lang = currentLang;
}

// Función global para alternar idiomas
function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations();
        // Avisar a los scripts hermanos (app.js, driver.js) que el idioma cambió
        window.dispatchEvent(new Event("languageChanged"));
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", applyTranslations);