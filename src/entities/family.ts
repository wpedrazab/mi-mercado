export type FamilyStatus = 'activa' | 'inactiva'

export interface Family {
  id: string
  nombre: string
  estado: FamilyStatus
  created_at: string
}
