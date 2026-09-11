import { supabase } from './supabaseClient'
import { extractFunctionErrorMessage } from './functionError'
import type { Family } from '../../entities/family'
import type { Profile } from '../../entities/profile'

export async function fetchFamily(familyId: string): Promise<Family | null> {
  const { data, error } = await supabase.from('families').select('*').eq('id', familyId).maybeSingle()
  if (error) throw error
  return data
}

export async function listFamilyMembers(familyId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function inviteMember(input: { familyId: string; nombre: string; email: string }) {
  const { data, error } = await supabase.functions.invoke('invite-member', {
    body: { ...input, redirectTo: `${window.location.origin}/actualizar-password` },
  })
  if (error) throw new Error(await extractFunctionErrorMessage(error))
  return data as { ok: true }
}

/** Traspaso atómico: ver transfer_principal() en las migraciones de RLS. */
export async function transferPrincipal(familyId: string, newPrincipalId: string) {
  const { error } = await supabase.rpc('transfer_principal', {
    p_family_id: familyId,
    p_new_principal_id: newPrincipalId,
  })
  if (error) throw error
}

/** No deja salir a quien tenga rol 'principal' (hay que traspasar antes). */
export async function removeFamilyMember(profileId: string) {
  const { error } = await supabase.rpc('remove_family_member', { p_profile_id: profileId })
  if (error) throw error
}
