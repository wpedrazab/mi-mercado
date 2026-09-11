import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../app/providers/AuthProvider'
import { createFamily, listFamiliesWithSummary, renameProfile, type FamilySummary } from '../../data/remote/admin'
import { sortByName } from '../../shared/lib/sortByName'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'

const schema = z.object({
  familyName: z.string().min(1, 'Ingresa el nombre de la familia'),
  principalName: z.string().min(1, 'Ingresa el nombre del usuario principal'),
  principalEmail: z.string().email('Correo inválido'),
})
type FormValues = z.infer<typeof schema>

export function AdminPanelPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()

  const familiesQuery = useQuery({ queryKey: ['admin', 'families'], queryFn: listFamiliesWithSummary })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const [formError, setFormError] = useState<string | null>(null)

  const createFamilyMutation = useMutation({
    mutationFn: createFamily,
    onSuccess: () => {
      reset()
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'families'] })
    },
    onError: (err: Error) => setFormError(err.message),
  })

  function onSubmit(values: FormValues) {
    setFormError(null)
    createFamilyMutation.mutate(values)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Panel de administrador</h1>
        <p className="text-text-secondary mt-1 mb-6">Crea grupos familiares y su usuario principal</p>

        <Card className="mb-8">
          <h2 className="font-heading font-semibold text-lg text-text mb-4">Crear grupo familiar</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Nombre de la familia"
              placeholder="Ej: Familia Pedraza"
              error={errors.familyName?.message}
              {...register('familyName')}
            />
            <Input
              label="Nombre del usuario principal"
              placeholder="Ej: William Pedraza"
              error={errors.principalName?.message}
              {...register('principalName')}
            />
            <Input
              label="Correo del usuario principal"
              type="email"
              placeholder="correo@ejemplo.com"
              error={errors.principalEmail?.message}
              {...register('principalEmail')}
            />

            {formError && (
              <p className="text-sm text-alert text-center" role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" disabled={createFamilyMutation.isPending} className="w-full">
              {createFamilyMutation.isPending ? 'Creando…' : 'Crear e invitar'}
            </Button>
            <p className="text-xs text-text-secondary text-center">
              Le enviamos un correo para que cree su contraseña.
            </p>
          </form>
        </Card>

        <h2 className="font-heading font-semibold text-lg text-text mb-3">
          Grupos familiares {familiesQuery.data ? `(${familiesQuery.data.length})` : ''}
        </h2>

        {familiesQuery.isLoading && <p className="text-text-secondary">Cargando…</p>}
        {familiesQuery.isError && <p className="text-alert">No se pudieron cargar las familias.</p>}

        <div className="space-y-3">
          {sortByName(familiesQuery.data ?? [], (s) => s.family.nombre).map((summary) => (
            <FamilyCard key={summary.family.id} summary={summary} />
          ))}
        </div>

        <Link to="/" className="block mt-8">
          <Button variant="ghost" className="w-full">
            Volver
          </Button>
        </Link>
        <Button variant="ghost" className="w-full mt-2" onClick={auth.signOut}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

function FamilyCard({ summary }: { summary: FamilySummary }) {
  const { family, memberCount, principal } = summary
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [nombre, setNombre] = useState(principal?.nombre ?? '')

  const renameMutation = useMutation({
    mutationFn: () => renameProfile(principal!.id, nombre),
    onSuccess: () => {
      setEditing(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'families'] })
    },
  })

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-text">{family.nombre}</h3>
        <span className="text-sm text-text-secondary">{memberCount} miembros</span>
      </div>
      {principal && (
        <p className="text-sm text-text-secondary mt-1">
          Principal: {principal.nombre} · {principal.email}
        </p>
      )}

      {editing ? (
        <div className="mt-3 space-y-2">
          <Input label="Nombre del principal" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <div className="flex gap-2">
            <Button className="flex-1" disabled={renameMutation.isPending} onClick={() => renameMutation.mutate()}>
              Guardar
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 mt-3">
          <Button variant="ghost" className="flex-1 px-2" disabled={!principal} onClick={() => setEditing(true)}>
            Editar / cambiar perfil
          </Button>
          <Link to={`/admin/familias/${family.id}`} className="flex-1">
            <Button variant="ghost" className="w-full px-2">
              Acceder (soporte)
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
