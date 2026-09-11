import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../../app/providers/AuthProvider'
import { signIn } from '../../data/remote/auth'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { CartIcon } from '../../shared/ui/icons'

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (auth.status === 'ready') {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
    return <Navigate to={from} replace />
  }

  async function onSubmit(values: FormValues) {
    setFormError(null)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setFormError('Correo o contraseña incorrectos.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-3">
            <CartIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-text">Mi Mercado</h1>
          <p className="text-text-secondary mt-1">Inicia sesión para ver las compras de tu familia</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Correo"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="text-right">
            <Link to="/recuperar-password" className="text-sm text-accent-dark hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {formError && (
            <p className="text-sm text-alert text-center" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          ¿No tienes cuenta? Pídele acceso al usuario principal de tu familia.
        </p>
      </Card>
    </div>
  )
}
