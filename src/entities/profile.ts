export type UserRole = 'admin' | 'principal' | 'miembro'

export interface Profile {
  id: string
  email: string
  nombre: string
  rol: UserRole
  family_id: string | null
  activo: boolean
  created_at: string
}
