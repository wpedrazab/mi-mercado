import { supabase } from './supabaseClient'

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/actualizar-password`,
  })
}

export function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword })
}
