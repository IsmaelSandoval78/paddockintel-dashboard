import { ReactNode } from "react";
import { notFound } from "next/navigation";
import "@/app/globals.css";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

const SUPPORTED_LOCALES = ["en", "es", "pt"];

export default async function RootLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  // Validación de seguridad de la ruta dinámica idiomática
  if (!SUPPORTED_LOCALES.includes(locale)) {
    notFound();
  }

  return (
    <html 
      lang={locale} 
      className="h-full antialiased"
      suppressHydrationWarning={true} 
      /* suppressHydrationWarning={true} es obligatorio aquí.
        Evita que extensiones como Grammarly o Google Translate rompan la reconciliación 
        del DOM al inyectar atributos dinámicos (data-gr-ext-installed, etc.) en el cliente.
      */
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-400">
        {children}
      </body>
    </html>
  );
}