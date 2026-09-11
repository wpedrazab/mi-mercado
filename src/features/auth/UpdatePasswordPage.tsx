import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { updatePassword } from '../../data/remote/auth'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })
type FormValues = z.infer<typeof schema>

/**
 * A esta pantalla se llega desde el enlace del correo de recuperación:
 * Supabase ya deja una sesión activa en modo "recovery" al abrirlo, así que
 * solo hace falta pedir la contraseña nueva y guardarla.
 */
export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setFormError(null)
    const { error } = await updatePassword(values.password)
    if (error) {
      setFormError('No se pudo actualizar la contraseña. Pide un nuevo enlace de recuperación.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full">
        <h1 className="font-heading font-bold text-xl text-text mb-1">Crear nueva contraseña</h1>
        <p className="text-text-secondary mb-6">Elige una contraseña nueva para tu cuenta.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirm?.message}
            {...register('confirm')}
          />

          {formError && (
            <p className="text-sm text-alert text-center" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
