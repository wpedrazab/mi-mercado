import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Deliberadamente NO se lanza un throw acá: cuando faltan en build time,
// Vite reemplaza estas env vars por `undefined` como literal, así que
// Rollup puede probar que un `throw` incondicional siempre se ejecuta y
// elimina como código muerto todo lo que corre después — en la práctica,
// toda la app (visto de verdad: build sin .env -> bundle final vacío,
// página en blanco sin ningún error visible salvo en la consola). Mejor
// degradar con un cliente inválido: la UI carga igual y solo las llamadas
// reales a Supabase fallan, con un error claro.
if (!envUrl || !envAnonKey) {
  console.error(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el entorno (.env). ' +
      'La app va a cargar, pero cualquier llamada a Supabase va a fallar.',
  )
}

export const supabase = createClient(envUrl || 'https://misconfigured.invalid', envAnonKey || 'misconfigured-anon-key')
