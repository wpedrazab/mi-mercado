import type { BlockedReason } from '../../app/providers/authState'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'

const MESSAGES: Record<BlockedReason, { title: string; body: string }> = {
  cuenta_inactiva: {
    title: 'Tu cuenta está desactivada',
    body: 'Contacta al usuario principal de tu familia o al administrador para reactivarla.',
  },
  familia_inactiva: {
    title: 'Esta familia ya no está activa',
    body: 'Contacta al administrador si crees que esto es un error.',
  },
}

export function BlockedScreen({ reason, onSignOut }: { reason: BlockedReason; onSignOut: () => void }) {
  const { title, body } = MESSAGES[reason]
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-sm w-full text-center">
        <h1 className="font-heading font-bold text-xl text-text mb-2">{title}</h1>
        <p className="text-text-secondary mb-6">{body}</p>
        <Button variant="ghost" className="w-full" onClick={onSignOut}>
          Cerrar sesión
        </Button>
      </Card>
    </div>
  )
}
