# Mi Mercado

PWA para armar la lista de mercado y llevar el control en vivo de la compra (precios, cantidades, totales), multi-familia. Ver [`docs/CONTEXTO-PARA-CLAUDE-CODE.md`](docs/CONTEXTO-PARA-CLAUDE-CODE.md) para el contexto completo (funcionalidad, modelo de datos, roles, paleta) y [`docs/mockups`](docs/mockups) para las pantallas de referencia.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, TanStack Query + Supabase (online-only: auth, admin, familia, historial), Dexie/IndexedDB + sync propio (local-first: lista y compra en vivo), Tesseract.js (OCR de precios), vite-plugin-pwa.

No se usa Next.js: el build es 100% estático para poder empaquetarse más adelante con Capacitor (Android/iOS) sin depender de funciones de servidor.

## Desarrollo

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

- `npm run build` — type-check + build de producción
- `npm run lint` — ESLint
- `npm run test` — Vitest

## Estructura

```
src/
  app/              # rutas, providers
  features/         # auth, admin, family, shopping-list, purchase, history
  entities/         # tipos de dominio
  shared/           # ui, lib, hooks
  data/
    local/          # Dexie (flujo de compra, local-first)
    remote/         # cliente Supabase (auth/admin/familia/historial, online-only)
    sync/           # motor de sincronización (outbox)
supabase/
  migrations/       # esquema SQL, funciones, RLS y plantillas semilla (ver supabase/README.md)
```
