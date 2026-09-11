import { supabase } from './supabaseClient'
import type { Family } from '../../entities/family'

/**
 * Si la familia está inactiva, RLS la esconde de cualquiera que no sea admin
 * y esto devuelve null sin error — así es como AuthProvider distingue
 * "familia inactiva" de "sin familia asignada".
 */
export async function fetchFamily(familyId: string): Promise<Family | null> {
  const { data, error } = await supabase.from('families').select('*').eq('id', familyId).maybeSingle()
  if (error) throw error
  return data
}
