import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import UnifiedIndexDashboard from "@/components/UnifiedIndexDashboard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

const SUPPORTED_LOCALES = ["en", "es", "pt"];

const DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    metaTitle: "PaddockIntel Hub | Live F1 Telemetry & Global Track Analytics",
    metaDesc: "High-density programmatic F1 data architecture. Interactive global telemetry map, historical lap thresholds, and core network registry.",
    subtitle: "SYSTEM_CORE // UNIFIED_INDEX",
    title: "PADDOCKINTEL FLUID DATA ARCHITECTURE",
    circuitsLabel: "CIRCUITS_REGISTRY (2025-2026)",
    driversLabel: "DRIVERS_TELEMETRY",
    seasonsLabel: "CHRONOLOGICAL_LINEAGE",
    eeatBadge: "DATA_LINEAGE_VERIFIED",
    mapSubtitle: "GEOGRAPHICAL_NODES // LIVE_MAP",
    mapTitle: "GLOBAL TRACK TELEMETRY MATRIX",
    closeBtn: "CERRAR_PANEL",
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
    metaTitle: "PaddockIntel Hub | Telemetría de F1 en Vivo y Analítica Global",
    metaDesc: "Arquitectura de datos programática de F1 de alta densidad. Mapa interactivo de telemetría global, límites históricos de vuelta y registro de red central.",
    subtitle: "NÚCLEO_SISTEMA // ÍNDICE_UNIFICADO",
    title: "ARQUITECTURA DE DATOS FLUIDOS PADDOCKINTEL",
    circuitsLabel: "REGISTRO_DE_CIRCUITOS (2025-2026)",
    driversLabel: "TELEMETRÍA_DE_PILOTOS",
    seasonsLabel: "LINAJE_CRONOLÓGICO",
    eeatBadge: "LINAJE_DE_DATOS_VERIFICADO",
    mapSubtitle: "NODOS_GEOGRÁFICOS // MAPA_EN_VIVO",
    mapTitle: "MATRIZ DE TELEMETRÍA GLOBAL DE PISTAS",
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
    metaTitle: "PaddockIntel Hub | Telemetria de F1 ao Vivo e Análise Global",
    metaDesc: "Arquitetura de datos programática de F1 de alta densidad. Mapa interativo de telemetria global, recordes históricos de volta e registro de red central.",
    subtitle: "NÚCLEO_SISTEMA // ÍNDICE_UNIFICADO",
    title: "ARQUITETURA DE DADOS FLUIDOS PADDOCKINTEL",
    circuitsLabel: "REGISTRO_DE_CIRCUITOS (2025-2026)",
    driversLabel: "TELEMETRIA_DE_PILOTOS",
    seasonsLabel: "LINHAGEM_CRONOLÓGICA",
    eeatBadge: "LINHAGEM_DE_DADOS_VERIFICADA",
    mapSubtitle: "NODOS_GEOGRÁFICOS // MAPA_AO_VIVO",
    mapTitle: "MATRIZ DE TELEMETRIA GLOBAL DE PISTAS",
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
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        en: `${baseUrl}/en`,
        es: `${baseUrl}/es`,
        pt: `${baseUrl}/pt`,
      },
    },
    robots: { index: true, follow: true },
  };
}

export default async function IndexPage({ params }: PageProps) {
  const { locale } = await params;

  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  const t = DICTIONARY[locale];

  // Inyección explícita de campos nominales (name, location, country) para resolver la filtración de IDs
  const { data: racesRelation, error: rError } = await supabase
    .from("races")
    .select("circuit_id, circuits!inner(id, name, location, country, alt, lat, lng)")
    .in("year", [2025, 2026]);

  if (rError) {
    console.error("DATABASE_FETCH_EXCEPTION // RACES:", rError);
  }

  const uniqueCircuitsMap = new Map();
  if (racesRelation) {
    racesRelation.forEach((race: any) => {
      if (race.circuits) {
        uniqueCircuitsMap.set(race.circuits.id, race.circuits);
      }
    });
  }
  const activeCircuits = Array.from(uniqueCircuitsMap.values()).sort((a: any, b: any) => a.id - b.id);

  const { data: activeDrivers } = await supabase
    .from("drivers")
    .select("id, number, forename, surname, code")
    .limit(15);

  const { data: activeSeasons } = await supabase
    .from("seasons")
    .select("year")
    .in("year", [2025, 2026])
    .order("year", { ascending: false });

  return (
    <main className="min-h-screen w-full bg-zinc-950 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] text-zinc-100 p-4 md:p-8 flex flex-col justify-start items-center overflow-x-hidden">
      <div className="w-full max-w-7xl flex flex-col gap-8">
        
        <div className="border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <p className="font-mono text-xs uppercase tracking-wider font-bold text-emerald-400">
                {t.subtitle} // {t.eeatBadge}
              </p>
            </div>
            <h1 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tighter text-zinc-50 mt-1">
              {t.title}
            </h1>
          </div>
          
          <div className="flex flex-col sm:items-end gap-2 self-stretch sm:self-auto">
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest block font-bold">
              // SELECT_LOCALE_FREQUENCY
            </span>
            <div className="flex bg-zinc-900/90 border border-zinc-100/10 p-1 font-mono text-xs gap-1">
              {SUPPORTED_LOCALES.map((loc) => {
                const isActive = loc === locale;
                return (
                  <Link
                    key={loc}
                    href={`/${loc}`}
                    className={`px-3 py-1 uppercase font-bold transition-all duration-150 ${
                      isActive ? "bg-zinc-50 text-zinc-950" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    }`}
                  >
                    {loc}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <UnifiedIndexDashboard 
          circuits={activeCircuits}
          drivers={activeDrivers || []}
          seasons={activeSeasons || []}
          dictionary={t}
          locale={locale}
        />

      </div>
    </main>
  );
}