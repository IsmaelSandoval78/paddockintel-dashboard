# DNS rollback — Cloudflare Worker cutover

**Usar este doc solo el día del corte, si algo sale mal después de apuntar el DNS al
Worker de Cloudflare.** El objetivo es volver a exactamente el estado de hoy (100% del
tráfico real servido por Vercel), sin tener que pensar ni investigar bajo presión —
copiar y pegar los valores de abajo en el dashboard de DNS de Cloudflare
(`dash.cloudflare.com` → zona `paddockintel.com` → DNS → Records).

Valores confirmados en vivo el 8 sep 2026, consultando directo contra los nameservers
autoritativos de la zona (`dig @lisa.ns.cloudflare.com <nombre> <tipo>`) — no un
resolver cacheado, no supuestos.

## Los 3 registros a restaurar

| Nombre | Tipo | Valor | TTL | Proxy |
|---|---|---|---|---|
| `hub.paddockintel.com` | CNAME | `d878f4083bbdeec6.vercel-dns-017.com` | 300 (Auto) | **DNS only** (nube gris) |
| `paddockintel.com` (apex, `@`) | A | `216.150.1.1` | 300 (Auto) | **DNS only** (nube gris) |
| `www.paddockintel.com` | CNAME | `d878f4083bbdeec6.vercel-dns-017.com` | 300 (Auto) | **DNS only** (nube gris) |

**Los tres tienen que quedar con la nube gris (DNS only), no naranja (Proxied).**
Confirmado indirectamente el 8 sep: consultando directo contra los nameservers de
Cloudflare, los tres devolvieron el hostname/IP real de Vercel, no una IP de Cloudflare
— eso solo pasa si el registro está sin proxy. Si durante el corte alguno de los tres
quedó en naranja (proxied, apuntando al Worker), el rollback tiene que volver a ponerlo
en gris, no solo cambiar el valor.

## ⚠️ Antes de aplicar el valor del apex, verificarlo de nuevo

El A record del apex (`216.150.1.1`) es un valor **fijo**, no un CNAME que se actualiza
solo. Las IPs de borde de Vercel rotan — el 8 sep, en la misma sesión que estos valores,
el propio target de Vercel (`d878f4083bbdeec6.vercel-dns-017.com`) ya había cambiado de
resolver a `216.150.1.1`/`216.150.16.1` a resolver a `216.150.1.193`/`216.150.16.193`
unos minutos después. Si pasó mucho tiempo entre hoy y el día real del corte, correr esto
primero para confirmar que `216.150.1.1` sigue siendo válido antes de pegarlo a ciegas:

```
dig d878f4083bbdeec6.vercel-dns-017.com A +short
```

Si el resultado no incluye `216.150.1.1`, no usar ese valor — entrar al dashboard de
Vercel (Project → Settings → Domains → `paddockintel.com`) y usar el valor de A record
que Vercel muestre ahí en ese momento; es la fuente autoritativa real, este doc es un
respaldo rápido, no reemplaza confirmar contra Vercel el día del corte si hay dudas.

## Pasos para aplicar el rollback

1. `dash.cloudflare.com` → cuenta `sandoval.ismael@gmail.com` → zona `paddockintel.com`
   → **DNS** → **Records**.
2. Para cada uno de los 3 registros de la tabla: editar (no borrar y recrear, para no
   perder el TTL bajo ya configurado) → confirmar que el valor coincide con la tabla →
   confirmar que el proxy status es **DNS only** (nube gris, click para apagarlo si
   quedó naranja) → Save.
3. Si el corte había agregado un **Route** de Workers (`*/*` o similar patrón atado a
   `paddockintel-dashboard`) en Workers & Pages → el Worker → Settings → Domains &
   Routes: eliminar ese Route también. Un registro DNS en gris con un Route de Worker
   todavía activo puede seguir mandando tráfico al Worker según el patrón — hay que
   sacar ambas cosas, no alcanza con solo el DNS.

## Verificar que el rollback funcionó

```
dig @lisa.ns.cloudflare.com hub.paddockintel.com CNAME +noall +answer
dig @lisa.ns.cloudflare.com paddockintel.com A +noall +answer
dig @lisa.ns.cloudflare.com www.paddockintel.com CNAME +noall +answer

curl -sI https://hub.paddockintel.com/ | grep -i "^server"
curl -sI https://paddockintel.com/ | grep -i "^server"
```

Los 3 `dig` tienen que devolver exactamente los valores de la tabla de arriba. Los 2
`curl` tienen que devolver `server: Vercel` — si alguno devuelve `server: cloudflare`,
ese host todavía está sirviendo desde el Worker, el rollback no se aplicó del todo ahí
(o el TTL viejo de un resolver intermedio todavía no expiró — con TTL 300 ya
configurado hace días, esto no debería tardar más de 5 minutos desde que se guardó el
cambio).

## Qué NO hace falta tocar en un rollback

- El Worker de Cloudflare en sí (`paddockintel-dashboard`) — no hace falta borrarlo ni
  pausarlo, con que el DNS/Route ya no le manden tráfico alcanza. Queda ahí, deployado,
  para un próximo intento.
- El cron de Cloudflare (`wrangler.jsonc` → `triggers.crons`) — ver el riesgo de envío
  duplicado ya documentado en `docs/CLOUDFLARE-MIGRATION.md` (sección "Cron Triggers"):
  `/api/digest/send` ya se auto-protege por `sent_at IS NULL`, así que dejar ambos
  crons corriendo un rato durante/después del rollback no manda emails duplicados.
- Los secrets del Worker (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
  `RESEND_API_KEY`, `DRAFT_SECRET`) — no hay necesidad de rotarlos por hacer un
  rollback de DNS.

Ver `docs/CLOUDFLARE-MIGRATION.md` para el resto del historial de la migración y el
contexto de por qué se está evaluando este corte.
