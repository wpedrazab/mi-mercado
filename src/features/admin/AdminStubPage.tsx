import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { Button } from '../../shared/ui/Button'

/** Placeholder: el panel de administrador real es el próximo paso del roadmap. */
export function AdminStubPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Panel de administrador</h1>
        <p className="text-text-secondary mt-1">Crear familias y gestionar usuarios llega en el próximo paso.</p>

        <div className="mt-8 space-y-3">
          <Link to="/" className="block">
            <Button variant="ghost" className="w-full">
              Volver
            </Button>
          </Link>
          <Button variant="ghost" className="w-full" onClick={auth.signOut}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
