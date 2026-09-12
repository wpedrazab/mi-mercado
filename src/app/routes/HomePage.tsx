import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { initSync } from '../../data/sync/engine'
import { purchasesRepo } from '../../data/local/repos'
import type { Family } from '../../entities/family'
import type { Profile } from '../../entities/profile'
import { formatDateEs } from '../../shared/lib/date'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'

export function HomePage() {
  const auth = useAuth()

  useEffect(() => {
    if (auth.status === 'ready' && auth.profile.rol !== 'admin' && auth.family) {
      return initSync()
    }
  }, [auth])

  if (auth.status !== 'ready') return null

  return <HomeContent profile={auth.profile} family={auth.family} onSignOut={auth.signOut} />
}

function HomeContent({
  profile,
  family,
  onSignOut,
}: {
  profile: Profile
  family: Family | null
  onSignOut: () => Promise<void>
}) {
  const purchasesEnCurso =
    useLiveQuery(async () => {
      if (!family) return []
      const all = await purchasesRepo.list(family.id)
      return all.filter((p) => p.estado === 'en_curso')
    }, [family?.id]) ?? []

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Hola, {profile.nombre}</h1>
        <p className="text-text-secondary mt-1">
          {profile.rol === 'admin' ? 'Administrador de la plataforma' : (family?.nombre ?? 'Sin familia asignada')}
        </p>

        {purchasesEnCurso.length > 0 && (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-text-secondary">Compras en curso</p>
            {purchasesEnCurso.map((p) => (
              <Link key={p.id} to={`/compra/${p.id}`} className="block">
                <Card className="p-4 flex items-center justify-between">
                  <span className="text-text font-semibold">
                    Compra del {formatDateEs(p.fecha_compra, { day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-accent-dark text-sm">Retomar →</span>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 space-y-3">
          {profile.rol === 'admin' && (
            <Link to="/admin" className="block">
              <Button variant="ghost" className="w-full">
                Panel de administrador
              </Button>
            </Link>
          )}
          {family && (
            <>
              <Link to="/lista" className="block">
                <Button className="w-full">Lista de mercado</Button>
              </Link>
              <Link to="/familia" className="block">
                <Button variant="ghost" className="w-full">
                  Mi familia
                </Button>
              </Link>
              <Link to="/catalogos" className="block">
                <Button variant="ghost" className="w-full">
                  Catálogos
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" className="w-full" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
