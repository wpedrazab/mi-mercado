import { supabase } from './supabaseClient'
import type { Profile } from '../../entities/profile'

export async function fetchOwnProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}
