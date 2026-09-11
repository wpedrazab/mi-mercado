import { supabase } from './supabaseClient'
import { extractFunctionErrorMessage } from './functionError'
import type { Family } from '../../entities/family'
import type { Profile } from '../../entities/profile'

export interface FamilySummary {
  family: Family
  memberCount: number
  principal: Profile | null
}

/** Solo la ve el admin: RLS ya limita families/profiles a "todo" para ese rol. */
export async function listFamiliesWithSummary(): Promise<FamilySummary[]> {
  const [{ data: families, error: familiesError }, { data: profiles, error: profilesError }] = await Promise.all([
    supabase.from('families').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*'),
  ])
  if (familiesError) throw familiesError
  if (profilesError) throw profilesError

  return (families ?? []).map((family) => {
    const members = (profiles ?? []).filter((p) => p.family_id === family.id)
    return {
      family,
      memberCount: members.length,
      principal: members.find((p) => p.rol === 'principal') ?? null,
    }
  })
}

export async function createFamily(input: { familyName: string; principalName: string; principalEmail: string }) {
  const { data, error } = await supabase.functions.invoke('create-family', { body: input })
  if (error) throw new Error(await extractFunctionErrorMessage(error))
  return data as { family: Family }
}

export async function renameProfile(profileId: string, nombre: string) {
  const { error } = await supabase.from('profiles').update({ nombre }).eq('id', profileId)
  if (error) throw error
}
