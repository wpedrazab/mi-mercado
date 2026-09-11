import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { requestPasswordReset } from '../../data/remote/auth'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { ArrowLeftIcon, CheckIcon } from '../../shared/ui/icons'

const schema = z.object({ email: z.string().email('Correo inválido') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    // Por seguridad no distinguimos si el correo existe o no en la respuesta.
    await requestPasswordReset(values.email)
    setSentTo(values.email)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/login" aria-label="Volver a iniciar sesión" className="text-text-secondary hover:text-text">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-text">Recuperar contraseña</h1>
        </div>

        <p className="text-text-secondary mb-6">
          Ingresa el correo con el que inicias sesión y te enviaremos un enlace para crear una nueva contraseña.
        </p>

        {!sentTo ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Correo"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-pending-border bg-pending-bg p-4 text-center">
            <div className="mx-auto mb-2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center">
              <CheckIcon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-text">Revisa tu correo</p>
            <p className="text-sm text-text-secondary mt-1">
              Te enviamos un enlace a {sentTo}. Si no lo ves, revisa la carpeta de spam.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
