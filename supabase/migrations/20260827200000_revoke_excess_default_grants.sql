-- Corrige el hallazgo de seguridad documentado en docs/ROADMAP-SEMANA.md
-- ("Hallazgo de seguridad pendiente: GRANT excesivo a nivel de schema completo").
--
-- Origen del problema: baseline_schema.sql tiene
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO anon/authenticated;
-- que le da esos 4 privilegios automáticamente a cualquier tabla nueva. TRUNCATE
-- ignora RLS por completo -- no importa que una tabla tenga policies de solo lectura,
-- TRUNCATE es una puerta aparte. anon = la key pública que vive en el bundle de
-- cliente del sitio, visible por cualquiera.
--
-- Auditoría de esta sesión (31 tablas/vistas de public) confirmó que NINGUNA
-- necesita REFERENCES/TRIGGER/TRUNCATE/MAINTAIN para anon/authenticated -- el
-- sitio solo lee. Caso especial: subscribers. Se verificó en el código
-- (app/api/subscribe, app/api/unsubscribe, app/api/digest/send) que las tres
-- únicas operaciones de escritura/lectura sobre subscribers corren con
-- SUPABASE_SERVICE_ROLE_KEY server-side (lib/supabase/server.ts), nunca con la
-- anon key ni con un JWT de authenticated -- los formularios del sitio hacen
-- POST a rutas de API, no tocan Supabase directo desde el browser. Además,
-- subscribers tiene RLS habilitado sin ninguna policy, así que su SELECT/INSERT/
-- DELETE ya estaban bloqueados en la práctica por RLS; TRUNCATE/MAINTAIN no lo
-- estaban, siendo la única tabla de todo el schema donde ese hallazgo es
-- explotable hoy tal cual. subscribers queda sin ningún grant para
-- anon/authenticated, a diferencia del resto de las tablas (que conservan
-- SELECT -- eso sí lo usa el sitio).
--
-- No se toca ninguna policy de RLS ni ningún grant de service_role.

-- 1) Quitar el exceso ya otorgado en las tablas/vistas existentes.
--    REVOKE sobre un privilegio que una tabla no tiene es un no-op seguro en
--    Postgres (no falla), así que esto es seguro de correr aunque algunas
--    tablas (authors, tags, article_tags, article_sources, delta_ribbon_*) ya
--    hayan sido creadas sin este exceso en sesiones anteriores.
revoke references, trigger, truncate, maintain
    on all tables in schema public
    from anon, authenticated;

-- 2) subscribers: además del REVOKE de arriba, quitar SELECT/INSERT/DELETE --
--    confirmado que ningún cliente (anon ni authenticated) los necesita.
revoke select, insert, delete
    on table public.subscribers
    from anon, authenticated;

-- 3) Fix para tablas futuras: cancelar el ALTER DEFAULT PRIVILEGES original.
--    A partir de acá, CREATE TABLE nuevo del rol postgres en public NO le da
--    nada a anon/authenticated por default -- cada migración futura debe
--    otorgar explícitamente lo que corresponda (mismo patrón ya usado en
--    authors/article_sources/tags/article_tags/delta_ribbon: "grant select ...
--    to anon" a mano, nunca depender del default).
alter default privileges for role postgres in schema public
    revoke references, trigger, truncate, maintain
    on tables from anon;

alter default privileges for role postgres in schema public
    revoke references, trigger, truncate, maintain
    on tables from authenticated;
