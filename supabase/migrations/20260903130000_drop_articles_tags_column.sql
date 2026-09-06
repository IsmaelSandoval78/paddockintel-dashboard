-- Paso 2 de 2. NO CORRER hasta:
-- 1) haber corrido 20260903120000_article_tags_position.sql
-- 2) haber deployado el codigo de esta sesion (lib/blog/tags.ts + los 3
--    consumidores migrados: app/[locale]/(blog)/[slug]/page.tsx,
--    app/[locale]/(blog)/magazine-home/{page,data}.tsx)
-- 3) haber verificado en el sitio real (o `npm run dev` local) que el
--    articulo individual, la home de magazine y el filtro ?tag= siguen
--    mostrando tags correctamente
--
-- `articles.tags` (text[]) queda reemplazada por completo por
-- `article_tags`/`tags`. scripts/ingest-article.ts ya no la escribe.

alter table public.articles drop column if exists tags;
