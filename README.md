# AWS Student Community Day México 2026

Sitio web del AWS Student Community Day México (Ciudad de México, 4 de noviembre de 2026): landing pública bilingüe (ES/EN), formularios de registro, speakers y voluntarios, y panel de administración para operar el evento (check-in, escáneres, pasaportes, correos, impresión de escarapelas).

Repositorio privado. Ver [Licencia](#licencia).

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | >= 20.9 (probado en 22 y 24) |
| Framework | Next.js (App Router) | 16.2 |
| UI | React | 19.2 |
| Estilos | Tailwind CSS | 4 |
| Lenguaje | TypeScript | 5 |
| i18n | next-intl | 4 |
| Base de datos | MongoDB (Mongoose) | Mongoose 9 |
| Archivos | AWS S3 (URLs prefirmadas) | SDK v3 |
| Correo | Resend + React Email | |
| PDF | PDFKit, pdf-lib | |
| Captcha | Cloudflare Turnstile | |
| Animaciones | Motion | 12 |
| Proceso en producción | pm2 detrás de nginx | |

Next.js 16 tiene cambios respecto a versiones anteriores: el middleware vive en `src/proxy.ts` y la documentación de la versión instalada está en `node_modules/next/dist/docs/`.

## Puesta en marcha local

```bash
npm ci
cp .env.example .env.local   # completar los valores
npm run dev                  # http://localhost:3000
```

Para crear el primer usuario del panel (`/admin`), completar `ADMIN_EMAIL`, `ADMIN_NAME` y `ADMIN_PASSWORD` en `.env.local` y correr una vez:

```bash
npm run create-admin
npm run seed:faq             # opcional: carga el FAQ por defecto en la base
```

Los scripts se conectan directo a MongoDB: la IP de la máquina tiene que estar en la lista de acceso de Atlas.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm run create-admin` | Crea o actualiza el admin inicial desde `.env.local` |
| `npm run seed:faq` | Carga las preguntas del FAQ en la base |

## Variables de entorno

Plantilla completa en `.env.example`. Las `NEXT_PUBLIC_*` se incrustan en el build: tienen que existir antes de `npm run build`.

| Variable | Requerida | Uso |
|---|---|---|
| `MONGODB_URI` | Sí | Conexión a MongoDB Atlas |
| `JWT_SECRET` | Sí | Firma de sesiones del panel |
| `NEXT_PUBLIC_APP_URL` | Sí | Dominio público (correos, QR, SEO, remitente) |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Sí | Credenciales de S3 |
| `AWS_S3_BUCKET`, `AWS_S3_PUBLIC_URL` | Sí | Bucket de uploads y su URL pública |
| `S3_PREFIX` | No | Carpeta dentro del bucket si se comparte con otro país (ej. `mx`) |
| `RESEND_API_KEY` | Sí | Envío de correos |
| `EMAIL_FROM`, `MARKETING_EMAIL_FROM` | No | Remitentes; por defecto `noreply@<dominio>` |
| `RESEND_WEBHOOK_SECRET` | Sí | Webhook de entregas y rebotes |
| `GOOGLE_MAPS_KEY` | No | Mapa estático en los correos |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Sí en producción | Captcha de formularios y login |
| `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` | Sólo para `create-admin` | Admin inicial |

## Estructura

```
src/
  app/
    [locale]/          Páginas públicas y panel /admin (ES en la raíz, EN en /en)
    api/               Endpoints (registro, check-in, campañas, PDFs, OG images)
  components/
    sections/          Secciones del landing (hero, dónde, agenda, speakers...)
    effects/           Globo, figura 3D de CDMX, animaciones (canvas 2D, sin three.js)
    ui/, forms/, layout/, admin/
  data/                Catálogos estáticos (formularios por país, organizadores, CFP)
  emails/              Plantillas de correo (React Email)
  lib/                 Constantes del evento, DB, auth, S3, Resend, PDFs
  messages/            Textos ES/EN (next-intl)
  models/              Modelos de Mongoose
  proxy.ts             Middleware: sesión del panel + ruteo de idioma
deploy/nginx/          Configuración de nginx de referencia
ecosystem.config.cjs   Configuración de pm2
```

## Dónde se cambia cada cosa

Todo lo marcado como `POR CONFIRMAR` en el código es un placeholder pendiente.

| Qué | Dónde |
|---|---|
| Fecha, hora, sede, dirección, coordenadas, mapa | `src/lib/constants.ts` (`EVENT`) |
| Fechas de logística (montaje, reunión de voluntarios, escarapelas) | `src/lib/constants.ts` (`EVENT_OPS`) |
| Dominio por defecto y redes sociales | `src/lib/constants.ts` (`SITE_URL`, `SOCIAL`) |
| Fechas del Call for Speakers | `src/data/cfp.ts` y claves `CFP.*` en `src/messages/*.json` |
| Textos del sitio, sección "Dónde", FAQ, aviso de privacidad | `src/messages/es.json` y `en.json` |
| Organizadores, Student Builder Groups, keynotes, sponsors | `src/data/` |
| Documentos de identidad y niveles de estudio (CURP, INE, TSU...) | `src/data/attendee-form.ts`, bloque `MX` |
| Colores | Tokens en `src/app/globals.css` (`@theme`) |
| Figura 3D de la sección "Dónde" | `src/components/effects/wire-cdmx.tsx` |
| Buzones de contacto (contacto, privacidad, sponsors) | `src/components/ui/obfuscated-email.tsx` |

El país del evento (`EVENT.country = "México"`) selecciona los catálogos de México en formularios, validaciones y teléfonos. La zona horaria es `America/Mexico_City` (UTC-6 todo el año).

### Paleta

Definida en `src/app/globals.css`. Un solo acento sobre negro neutro; los nombres heredados (`aws-orange`, `hack-block`, `kiro-purple`) apuntan a ese acento.

| Token | Valor | Uso |
|---|---|---|
| `hack-block` / `aws-orange` | `#F2A6F0` | Acento: bloques, titulares, botones, globo. Encima va tinta negra |
| `hack-dim` / `*-dark` | `#C143BC` | Sombras y variantes oscuras (fucsia del design system SBG IPN CDMX) |
| `*-light` | `#F9D0F7` | Variante clara |
| `hack-deep` | `#5A1656` | Acento sobre los bloques de color |
| `hack-ink` / `surface-900` | `#000000` | Fondo de página y tinta |
| `surface-800` a `surface-50` | `#0A0A0F` a `#F5F5FA` | Superficies, bordes y textos |

## Despliegue

Cada push a `main` se despliega solo con GitHub Actions (`.github/workflows/deploy.yml`): entra por SSH al VPS, hace `git reset` a `origin/main`, `npm ci`, `npm run build` y recarga pm2. Los pull requests a `main` corren lint y typecheck (`.github/workflows/ci.yml`).

### Preparar el VPS (una vez)

1. Node.js 20.9 o superior, pm2 (`npm i -g pm2`) y nginx.
2. Clonar el repo en `/srv/scd-mexico`. Como el repo es privado, el VPS necesita una deploy key de solo lectura (Settings > Deploy keys).
3. Crear `/srv/scd-mexico/.env.local` con los valores de producción. No está en git y el deploy no lo toca.
4. Crear el directorio de logs: `sudo mkdir -p /var/log/scd-mexico && sudo chown ubuntu /var/log/scd-mexico`.
5. Primer arranque: `npm ci && npm run build && pm2 start ecosystem.config.cjs && pm2 save && pm2 startup`.
6. Copiar `deploy/nginx/scd-mexico.conf` a `/etc/nginx/sites-available/`, reemplazar `DOMINIO`, enlazarlo en `sites-enabled` y recargar nginx.

El puerto por defecto es 2000. Si el VPS ya tiene otro sitio en ese puerto, cambiarlo en `ecosystem.config.cjs` y en la config de nginx.

### Secrets del repositorio

Settings > Secrets and variables > Actions:

| Secret | Descripción |
|---|---|
| `VPS_HOST` | IP o dominio del servidor |
| `VPS_USER` | Usuario SSH (el mismo que corre pm2) |
| `VPS_PORT` | Puerto SSH, normalmente 22 |
| `VPS_SSH_KEY` | Llave privada SSH (recomendado) |
| `VPS_PASSWORD` | Alternativa a la llave, si no se usa `VPS_SSH_KEY` |

## Flujo de trabajo del equipo

- No se hace push directo a `main`: cada cambio va en una rama y entra por pull request. Se recomienda activar branch protection en `main` exigiendo el check de CI.
- Antes de abrir el PR: `npm run lint` y `npm run typecheck`.
- Un merge a `main` publica a producción en unos minutos.
- `.env.local` nunca se sube. Las credenciales se comparten por un canal privado.

## Licencia

Copyright (c) 2026 Sebastián Acuña. El equipo organizador puede usar, modificar y adaptar el código a su gusto para el sitio del evento; preferiblemente, conservar el crédito al autor en el pie de página. No se puede distribuir, publicar ni reutilizar para otros eventos o proyectos sin permiso del autor. Ver [LICENSE](LICENSE).
