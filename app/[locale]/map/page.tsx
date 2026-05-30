import { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import InteractiveMapDashboard from "@/components/InteractiveMapDashboard";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

const SUPPORTED_LOCALES = ["en", "es", "pt"];

const DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    metaTitle: "Global F1 Telemetry Map | Interactive Track Analytics",
    metaDesc: "Explore Formula 1 circuits globally. Real-time telemetry, historical lap thresholds, fastest pitstops, and multi-era driver victory logs.",
    title: "GLOBAL TRACK TELEMETRY MATRIX",
    subtitle: "GEOGRAPHICAL_NODES // LIVE_MAP",
    closeBtn: "CLOSE_PANEL",
    statsTitle: "TACTICAL CORE METRICS",
    fastestLap: "FASTEST_LAP_RECORD",
    fastestPit: "MIN_PIT_STOP_LATENCY",
    topWinners: "HISTORICAL DOMINANCE (MOST WINS)",
    recentWinners: "LAST 5 GRAND PRIX WINNERS",
    clickPrompt: "SELECT A GEOGRAPHICAL NODE TO INTERCEPT TELEMETRY",
    viewProfile: "VIEW FULL TECHNICAL PROFILE →",
    wins: "WINS",
  },
  es: {
    metaTitle: "Mapa Global de Telemetría de F1 | Analítica de Circuitos",
    metaDesc: "Explora los circuitos de Fórmula 1 a nivel global. Telemetría en tiempo real, límites históricos de vuelta, paradas en boxes más rápidas y victorias.",
    title: "MATRIZ DE TELEMETRÍA GLOBAL DE PISTAS",
    subtitle: "NODOS_GEOGRÁFICOS // MAPA_EN_VIVO",
    closeBtn: "CERRAR_PANEL",
    statsTitle: "MÉTRICAS CRÍTICAS TÁCTICAS",
    fastestLap: "RÉCORD DE VUELTA RÁPIDA",
    fastestPit: "LATENCIA MÍNIMA EN PIT STOP",
    topWinners: "DOMINIO HISTÓRICO (MÁS VICTORIAS)",
    recentWinners: "ÚLTIMOS 5 GANADORES DE GRAND PRIX",
    clickPrompt: "SELECCIONA UN NODO GEOGRÁFICO PARA INTERCEPTAR TELEMETRÍA",
    viewProfile: "VER PERFIL TÉCNICO COMPLETO →",
    wins: "VICTORIAS",
  },
  pt: {
    metaTitle: "Mapa Global de Telemetria F1 | Análise Interativa de Pistas",
    metaDesc: "Explore os circuitos da Fórmula 1 globalmente. Telemetria em tempo real, recordes históricos de volta, pit stops mais rápidos e dados de vitórias.",
    title: "MATRIZ DE TELEMETRIA GLOBAL DE PISTAS",
    subtitle: "NODOS_GEOGRÁFICOS // MAPA_AO_VIVO",
    closeBtn: "FECHAR_PANEL",
    statsTitle: "MÉTRICAS CRÍTICAS TÁTICAS",
    fastestLap: "RECORDE DE VOLTA RÁPIDA",
    fastestPit: "LATÊNCIA MÍNIMA DE PIT STOP",
    topWinners: "DOMÍNIO HISTÓRICO (MAIS VITÓRIAS)",
    recentWinners: "ÚLTIMOS 5 VENCEDORES DE GRAND PRIX",
    clickPrompt: "SELECIONE UM NODO GEOGRÁFICO PARA INTERCEPTAR TELEMETRIA",
    viewProfile: "VER PERFIL TÉCNICO COMPLETO →",
    wins: "VITÓRIAS",
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale)) return {};

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://paddockintel.com";
  const t = DICTIONARY[locale];

  return {
    title: `${t.metaTitle} | PaddockIntel`,
    description: t.metaDesc,
    alternates: {
      canonical: `${baseUrl}/${locale}/map`,
      languages: {
        "en": `${baseUrl}/en/map`,
        "es": `${baseUrl}/es/map`,
        "pt": `${baseUrl}/pt/map`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function MapPage({ params }: PageProps) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  const t = DICTIONARY[locale];

  // Extracción de circuitos base para renderizar los nodos geográficos primarios
  const { data: circuits, error } = await supabase
    .from("circuits")
    .select("id, lat, lng, alt")
    .order("id", { ascending: true });

  if (error || !circuits) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-mono text-red-500">
        CRITICAL_DATABASE_CONNECTION_FAILURE
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-zinc-950 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] text-zinc-100 p-4 md:p-8 overflow-hidden flex flex-col justify-start">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 h-full flex-1">
        
        {/* CABECERA INDUSTRIAL */}
        <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-500 font-bold">
              {t.subtitle}
            </p>
            <h1 className="font-mono text-2xl md:text-4xl font-black uppercase tracking-tighter text-zinc-50 mt-1">
              {t.title}
            </h1>
          </div>
          <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-1 text-zinc-400 hidden sm:inline">
            PROG_SEO_CORE_V1 // ENGINE_ACTIVE
          </span>
        </div>

        {/* CONTENEDOR PRINCIPAL DEL MAPA Y SIDEBAR PANEL */}
        <InteractiveMapDashboard 
          circuits={circuits} 
          dictionary={t} 
          locale={locale} 
        />
      </div>
    </main>
  );
}