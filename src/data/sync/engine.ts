import { flushOutbox } from './outbox'
import { pullAll } from './pull'

let running = false

/**
 * Empuja el outbox y después trae el estado remoto. En ese orden: si se
 * jalara primero, una fila local dirty igual se respeta (pull no la pisa),
 * pero empujar antes evita una vuelta de sync extra para verla confirmada.
 */
export async function syncNow(): Promise<void> {
  if (running || !navigator.onLine) return
  running = true
  try {
    await flushOutbox()
    await pullAll()
  } finally {
    running = false
  }
}

let initialized = false

/**
 * Se llama una vez que hay sesión activa (la sync solo tiene sentido con un
 * family_id resuelto vía RLS). Dispara un sync al arrancar y cada vez que
 * el dispositivo recupera conexión.
 */
export function initSync(): () => void {
  if (initialized) return () => {}
  initialized = true

  void syncNow()
  const onOnline = () => void syncNow()
  window.addEventListener('online', onOnline)

  return () => {
    window.removeEventListener('online', onOnline)
    initialized = false
  }
}
