import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'es', 'pt'];
const defaultLocale = 'en';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Comprobar si el pathname ya tiene un idioma soportado
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Si no tiene idioma, detectar el del navegador o usar el por defecto
  const acceptLanguage = request.headers.get('accept-language');
  let detectedLocale = defaultLocale;

  if (acceptLanguage) {
    if (acceptLanguage.includes('es')) detectedLocale = 'es';
    else if (acceptLanguage.includes('pt')) detectedLocale = 'pt';
  }

  // Redirigir a la versión con idioma (Ej: /pilotos -> /es/pilotos)
  request.nextUrl.pathname = `/${detectedLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Proteger y enrutar todo excepto archivos públicos, imágenes y api internas
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)'],
};