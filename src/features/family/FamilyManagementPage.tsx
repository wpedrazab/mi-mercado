import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../app/providers/AuthProvider'
import {
  fetchFamily,
  inviteMember,
  listFamilyMembers,
  removeFamilyMember,
  transferPrincipal,
} from '../../data/remote/family'
import type { Profile } from '../../entities/profile'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'

const schema = z.object({
  nombre: z.string().min(1, 'Ingresa el nombre'),
  email: z.string().email('Correo inválido'),
})
type FormValues = z.infer<typeof schema>

/**
 * Sirve dos rutas: /familia (la propia, para principal/miembro) y
 * /admin/familias/:familyId (soporte del admin sobre cualquier familia).
 * Sin :familyId en la URL, usa la familia del usuario logueado.
 */
export function FamilyManagementPage() {
  const auth = useAuth()
  const params = useParams<{ familyId?: string }>()

  if (auth.status !== 'ready') return null

  const familyId = params.familyId ?? auth.profile.family_id
  if (!familyId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-sm mx-auto">
          <p className="text-text-secondary">No tienes una familia asignada.</p>
        </div>
      </div>
    )
  }

  const canManage = auth.profile.rol === 'admin' || (auth.profile.rol === 'principal' && auth.profile.family_id === familyId)

  return <FamilyManagement familyId={familyId} viewerId={auth.profile.id} canManage={canManage} />
}

function FamilyManagement({ familyId, viewerId, canManage }: { familyId: string; viewerId: string; canManage: boolean }) {
  const queryClient = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const familyQuery = useQuery({ queryKey: ['family', familyId], queryFn: () => fetchFamily(familyId) })
  const membersQuery = useQuery({ queryKey: ['family', familyId, 'members'], queryFn: () => listFamilyMembers(familyId) })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ['family', familyId] })
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const inviteMutation = useMutation({
    mutationFn: (values: FormValues) => inviteMember({ familyId, ...values }),
    onSuccess: () => {
      reset()
      setActionError(null)
      invalidate()
    },
    onError: (err: Error) => setActionError(err.message),
  })

  const transferMutation = useMutation({
    mutationFn: (newPrincipalId: string) => transferPrincipal(familyId, newPrincipalId),
    onSuccess: invalidate,
    onError: (err: Error) => setActionError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (profileId: string) => removeFamilyMember(profileId),
    onSuccess: invalidate,
    onError: (err: Error) => setActionError(err.message),
  })

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">{familyQuery.data?.nombre ?? 'Familia'}</h1>
        <p className="text-text-secondary mt-1 mb-6">Gestiona quién tiene acceso</p>

        {canManage && (
          <Card className="mb-6">
            <h2 className="font-heading font-semibold text-lg text-text mb-4">Invitar nuevo miembro</h2>
            <form onSubmit={handleSubmit((v) => inviteMutation.mutate(v))} className="space-y-4" noValidate>
              <Input label="Nombre" placeholder="Ej: Sofía Pedraza" error={errors.nombre?.message} {...register('nombre')} />
              <Input
                label="Correo"
                type="email"
                placeholder="correo@ejemplo.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" disabled={inviteMutation.isPending} className="w-full">
                {inviteMutation.isPending ? 'Enviando…' : 'Enviar invitación'}
              </Button>
            </form>
          </Card>
        )}

        {actionError && (
          <p className="text-sm text-alert text-center mb-4" role="alert">
            {actionError}
          </p>
        )}

        <h2 className="font-heading font-semibold text-lg text-text mb-3">
          Miembros {membersQuery.data ? `(${membersQuery.data.length})` : ''}
        </h2>

        {membersQuery.isLoading && <p className="text-text-secondary">Cargando…</p>}

        <div className="space-y-3">
          {membersQuery.data?.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isSelf={member.id === viewerId}
              canManage={canManage}
              onRemove={() => {
                if (confirm(`¿Quitar a ${member.nombre} de la familia?`)) removeMutation.mutate(member.id)
              }}
              onTransfer={() => {
                if (confirm(`¿Pasarle el rol de principal a ${member.nombre}?`)) transferMutation.mutate(member.id)
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MemberRow({
  member,
  isSelf,
  canManage,
  onRemove,
  onTransfer,
}: {
  member: Profile
  isSelf: boolean
  canManage: boolean
  onRemove: () => void
  onTransfer: () => void
}) {
  const isPrincipal = member.rol === 'principal'

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-text">
            {member.nombre}
            {isPrincipal && (
              <span className="ml-2 text-xs font-semibold text-accent-dark bg-subtle rounded-full px-2 py-0.5 align-middle">
                Principal{isSelf ? ' · Tú' : ''}
              </span>
            )}
          </p>
          <p className="text-sm text-text-secondary">{member.email}</p>
        </div>
        {canManage && !isPrincipal && (
          <button onClick={onRemove} aria-label={`Quitar a ${member.nombre}`} className="text-text-muted hover:text-alert text-lg leading-none">
            ×
          </button>
        )}
      </div>

      {canManage && !isPrincipal && (
        <button onClick={onTransfer} className="text-sm text-accent-dark hover:underline mt-2">
          Pasarle el rol de principal
        </button>
      )}
    </Card>
  )
}
