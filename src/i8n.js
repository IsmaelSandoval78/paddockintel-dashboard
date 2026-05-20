const translations = {
    es: {
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
        footer_profiles: "Perfiles de Pilotos"
    },
    en: {
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
        footer_profiles: "Driver Profiles"
    }
};

let currentLang = localStorage.getItem("paddock_lang") || 
                  (navigator.language.startsWith("es") ? "es" : "en");

function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(element => {
        const key = element.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    // Resaltar visualmente el botón del idioma activo
    document.querySelectorAll(".lang-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`btn-lang-${currentLang}`);
    if (activeBtn) activeBtn.classList.add("active");

    localStorage.setItem("paddock_lang", currentLang);
    document.documentElement.lang = currentLang;
}

function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        applyTranslations();
        window.dispatchEvent(new Event("languageChanged"));
    }
}

document.addEventListener("DOMContentLoaded", applyTranslations);