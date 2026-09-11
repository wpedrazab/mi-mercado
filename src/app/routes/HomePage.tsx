import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { initSync } from '../../data/sync/engine'
import { Button } from '../../shared/ui/Button'

/**
 * Punto de aterrizaje temporal tras el login. El flujo real (lista de
 * mercado, compra en vivo) llega en el próximo paso del roadmap; esta
 * pantalla solo confirma sesión/rol/familia y arranca la sincronización
 * local-first para quien tenga family_id activo.
 */
export function HomePage() {
  const auth = useAuth()

  useEffect(() => {
    if (auth.status === 'ready' && auth.profile.rol !== 'admin' && auth.family) {
      return initSync()
    }
  }, [auth])

  if (auth.status !== 'ready') return null
  const { profile, family } = auth

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Hola, {profile.nombre}</h1>
        <p className="text-text-secondary mt-1">
          {profile.rol === 'admin'
            ? 'Administrador de la plataforma'
            : family
              ? `Familia ${family.nombre}`
              : 'Sin familia asignada'}
        </p>

        <div className="mt-8 space-y-3">
          {profile.rol === 'admin' && (
            <Link to="/admin" className="block">
              <Button variant="ghost" className="w-full">
                Panel de administrador
              </Button>
            </Link>
          )}
          <Button variant="ghost" className="w-full" onClick={auth.signOut}>
            Cerrar sesión
          </Button>
        </div>

        <p className="text-text-muted text-sm mt-10">Lista de mercado y compra en vivo llegan en el próximo paso.</p>
      </div>
    </div>
  )
}
