import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Link from 'next/link';

interface Props {
  params: Promise<{ locale: 'en' | 'es' | 'pt'; driverId: string }>;
}

// 1. Programmatic SEO: Indexación masiva automatizada con Hreflang por piloto
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, driverId } = await params;
  const baseUrl = 'https://paddockintel.com';

  const { data: driver } = await supabase
    .from('drivers')
    .select('forename, surname')
    .eq('driver_id', driverId)
    .single();

  if (!driver) return {};

  const fullName = `${driver.forename} ${driver.surname}`;
  const titles = {
    en: `${fullName} F1 Career Telemetry & Historical Stats | PaddockIntel`,
    es: `Telemetría de Carrera e Historial de ${fullName} F1 | PaddockIntel`,
    pt: `Histórico e Telemetria de Carreira de ${fullName} F1 | PaddockIntel`
  };

  return {
    title: titles[locale] || titles['en'],
    description: `Deep analysis, career metrics, and real-time AI insight for ${fullName}.`,
    alternates: {
      languages: {
        'en': `${baseUrl}/en/pilotos/${driverId}`,
        'es': `${baseUrl}/es/pilotos/${driverId}`,
        'pt': `${baseUrl}/pt/pilotos/${driverId}`,
      },
    },
  };
}

// 2. IA Engine: Perfil biográfico ultra-específico cacheado
async function getDriverAiInsight(driverId: string, name: string, locale: string) {
  const { data: cached } = await supabase
    .from('gemini_insights')
    .select('content')
    .eq('entity_type', 'driver')
    .eq('entity_id', driverId)
    .eq('locale', locale)
    .maybeSingle();

  if (cached?.content) return cached.content;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a legendary Formula 1 team principal. Write a brilliant, aggressive, and highly technical profile (max 4 sentences) for the driver ${name} (ID: ${driverId}). 
    Focus on their driving style, key career turning point, and aerodynamic adaptability.
    CRITICAL: Write the response entirely in "${locale}". Use professional paddock vocabulary. Do not output markdown lists, just prose.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    await supabase.from('gemini_insights').insert({
      entity_type: 'driver',
      entity_id: driverId,
      locale,
      content: text
    });

    return text;
  } catch (error) {
    return '// DETECTED CORRUPTED DATASTREAM: Gemini engine is offline.';
  }
}

export default async function DriverProfilePage({ params }: Props) {
  const { locale, driverId } = await params;
  if (!['en', 'es', 'pt'].includes(locale)) notFound();

  const dict = await import(`../../../../locales/${locale}.json`).then((m) => m.default);

  // 3. Query Relacional Avanzada en Supabase (Agregando resultados históricos)
  const [driverResponse, resultsResponse] = await Promise.all([
    supabase
      .from('drivers')
      .select('forename, surname, permanent_number, code, nationality, dob')
      .eq('driver_id', driverId)
      .single(),
    supabase
      .from('results')
      .select('position_order, points, grid, fastest_lap')
      .eq('driver_id', driverId)
  ]);

  const driver = driverResponse.data;
  if (!driver) notFound();

  const results = resultsResponse.data || [];
  
  // Procesamiento de métricas en caliente (Server-Side Crunching)
  const totalRaces = results.length;
  const wins = results.filter(r => r.position_order === 1).length;
  const podiums = results.filter(r => r.position_order <= 3).length;
  const totalPoints = results.reduce((acc, curr) => acc + (curr.points || 0), 0);

  const fullName = `${driver.forename} ${driver.surname}`;
  const aiInsight = await getDriverAiInsight(driverId, fullName, locale);

  return (
    <main className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 font-mono">
      {/* Breadcrumb de Telemetría */}
      <nav className="max-w-6xl mx-auto mb-6 text-xs text-zinc-500 uppercase tracking-widest">
        <Link href={`/${locale}/pilotos`} className="hover:text-red-500 transition-colors">
          &lt; [BACK_TO_GRID]
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL IZQUIERDO: Tarjeta de Identidad Futurista */}
        <div className="bg-zinc-950 border border-zinc-900 p-6 relative flex flex-col justify-between overflow-hidden lg:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-6xl font-black text-zinc-800 italic">#{driver.permanent_number || 'XX'}</span>
              <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-1 border border-zinc-800 rounded-sm">
                {driver.code || 'UNK'}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic text-white">{driver.forename} <span className="block text-red-600">{driver.surname}</span></h1>
            
            <div className="mt-6 space-y-2 border-t border-zinc-900 pt-4 text-xs">
              <div className="flex justify-between"><span className="text-zinc-500">ORIGIN:</span><span className="text-zinc-300 uppercase">{driver.nationality}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">BORN:</span><span className="text-zinc-300">{driver.dob}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">UUID:</span><span className="text-zinc-600 font-sans text-[10px]">{driverId}</span></div>
            </div>
          </div>
        </div>

        {/* PANEL CENTRAL Y DERECHO: Telemetría de Rendimiento & IA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Grid de Contadores Críticos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'RACES', val: totalRaces, color: 'text-zinc-300' },
              { label: dict.drivers.wins || 'WINS', val: wins, color: 'text-amber-500' },
              { label: 'PODIUMS', val: podiums, color: 'text-cyan-400' },
              { label: 'CAREER PTS', val: totalPoints.toFixed(0), color: 'text-emerald-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 p-4 rounded-sm">
                <span className="text-[10px] text-zinc-500 block tracking-wider uppercase">{stat.label}</span>
                <span className={`text-2xl font-black ${stat.color}`}>{stat.val}</span>
              </div>
            ))}
          </div>

          {/* Caja de Análisis Generativo Avanzado */}
          <div className="bg-zinc-950 border border-zinc-900 p-6 relative">
            <div className="absolute top-0 right-4 transform -translate-y-1/2 bg-red-600 text-white font-bold text-[9px] px-2 py-0.5 tracking-widest uppercase">
              {dict.drivers.biography}
            </div>
            <div className="font-sans text-sm text-zinc-400 leading-relaxed space-y-4">
              <p className="border-l-2 border-zinc-800 pl-4 italic text-zinc-300">
                {aiInsight}
              </p>
            </div>
          </div>

          {/* Consola de Diagnóstico Simulada */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-sm font-mono text-[11px] text-zinc-500 space-y-1">
            <p className="text-emerald-500">// TELEMETRY DOWNLOAD COMPLETE // SYSTEM STABLE</p>
            <p>&gt; PARSING SENSOR DATA FOR CONSTRUCTOR AGGREGATION...</p>
            <p>&gt; CORE WEB VITALS OPTIMIZATION: RENDERED AT SERVER SIDE (SSR)</p>
          </div>

        </div>
      </div>
    </main>
  );
}