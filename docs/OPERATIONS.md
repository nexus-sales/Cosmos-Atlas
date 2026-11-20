# Operación de Cosmos Atlas

## Destino

El repositorio publica `main` en `https://github.com/nexus-sales/Cosmos-Atlas.git`. El código reconoce Vercel como runtime de producción; antes de publicar hay que confirmar que el proyecto Vercel enlazado corresponde a este repositorio.

## Variables obligatorias y recomendadas

- `OPENAI_API_KEY`: necesaria solo para respuestas del Astrónomo IA.
- `OPENAI_MODEL`: modelo principal; si falta se usa el valor documentado por la ruta.
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: catálogo enriquecido.
- `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`: recomendadas en Vercel para que los límites sean compartidos entre instancias. Sin ellas el límite es correcto en una sola instancia, pero no global.

No se deben guardar valores reales en GitHub. Se configuran en Vercel y, para CI si fueran necesarios, como GitHub Actions Secrets.

## Monitorización

- `GET /api/health`: comprueba que la aplicación responde y muestra si están configurados los servicios opcionales, sin revelar secretos.
- `GET /api/health?deep=1`: comprueba Starlink, CDS Sesame, JPL y Open-Meteo. Se limita por IP y conserva el resultado cinco minutos.
- Un monitor externo debe consultar `/api/health` cada cinco minutos y `/api/health?deep=1` cada quince minutos. Se considera caída un HTTP 5xx; HTTP 207 significa aplicación operativa con algún proveedor degradado.
- Las respuestas TLE incluyen `X-Astronomy-Source`, útil para saber si se empleó proveedor o caché.

## Publicación

1. `npm ci`
2. `npm run lint`
3. `npm run test`
4. `npm run build`
5. Comprobar `/api/health` y una navegación instalada como PWA.

La PWA elimina precachés obsoletos y usa nombres de caché versionados para catálogos y TLE. Al cambiar el formato de un catálogo, se debe incrementar otra vez el sufijo de su caché.

## Despliegue en Dokploy (sustituye a Vercel)

1. Application → Provider GitHub, rama `main`, Build Type **Dockerfile** (ruta `./Dockerfile`).
2. Variables de entorno (pestaña Environment) y, **además, como Build Args** (las `NEXT_PUBLIC_*` se incrustan en el bundle durante el build, si solo están en runtime llegan vacías):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_CELESTRAK_ISS_URL`, `NEXT_PUBLIC_CELESTRAK_STARLINK_URL`, `NEXT_PUBLIC_SESAME_URL`.
   Solo runtime: `OPENAI_API_KEY`, `OPENAI_MODEL`, `UPSTASH_REDIS_REST_URL`/`TOKEN` (opcionales; con una sola réplica el rate limit en memoria basta).
3. Dominio: puerto del contenedor `3000`, HTTPS con Let's Encrypt.
4. Healthcheck: `GET /api/health` (el Dockerfile ya lo define).
5. Rate limit: detrás de Traefik se usa `x-real-ip` / último valor de `x-forwarded-for`. No expongas el contenedor sin el proxy.
6. Supabase sigue siendo externo; el workflow `supabase-keepalive.yml` no cambia.
7. Cuando el dominio apunte a Dokploy, desactiva el proyecto en Vercel.
