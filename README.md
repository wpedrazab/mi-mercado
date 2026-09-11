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
- `npm run test` — Vitest en modo watch
- `npm run test:run` — Vitest una sola pasada (CI)

## Estructura

```
src/
  app/              # rutas, providers
  features/         # auth, admin, family, shopping-list, purchase, history
  entities/         # tipos de dominio
  shared/           # ui, lib, hooks
  data/
    local/          # Dexie: esquema (db.ts), tipos, y createLocalRepo (CRUD + outbox)
    remote/         # cliente Supabase (auth/admin/familia/historial, online-only)
    sync/           # outbox (push), pull (reconciliación) y el motor que los orquesta
supabase/
  migrations/       # esquema SQL, funciones, RLS y plantillas semilla (ver supabase/README.md)
```

### Capa local-first (flujo de compra)

Las pantallas de lista/compra (`categories`, `products`, `stores`, `shopping_lists`,
`list_items`, `purchases`, `purchase_items`) nunca llaman a Supabase directo: usan
los repos de `src/data/local/repos.ts` (`categoriesRepo`, `productsRepo`, etc.), que
escriben primero en Dexie (optimista, con id generado en el cliente) y encolan la
mutación en `outbox`. `initSync()` (se llama una vez con sesión activa) dispara un
push+pull al arrancar y cada vez que vuelve la conexión. Conflictos: gana la última
escritura — una fila local con cambios sin enviar nunca se pisa con un pull, y un
push exitoso siempre sobrescribe lo que hubiera en el servidor.
