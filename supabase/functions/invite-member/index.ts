// Edge Function: invita a un miembro a una familia ya existente. Solo el
// principal de esa familia o el administrador pueden hacerlo (ver doc de
// contexto: "Miembro" no gestiona membresía, solo el principal).
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Payload {
  familyId: string
  nombre: string
  email: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Falta autenticación.' }, 401)

    const { familyId, nombre, email } = (await req.json()) as Partial<Payload>
    if (!familyId?.trim() || !nombre?.trim() || !email?.trim()) {
      return json({ error: 'Faltan campos requeridos.' }, 400)
    }

    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await asCaller.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Sesión inválida.' }, 401)

    const { data: callerProfile, error: profileError } = await asCaller
      .from('profiles')
      .select('rol, family_id')
      .eq('id', userData.user.id)
      .maybeSingle()
    if (profileError) throw profileError

    const isAuthorized =
      callerProfile?.rol === 'admin' || (callerProfile?.rol === 'principal' && callerProfile.family_id === familyId)
    if (!isAuthorized) {
      return json({ error: 'Solo el principal de la familia o un administrador pueden invitar miembros.' }, 403)
    }

    const asService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: existing, error: existingError } = await asService
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing) {
      return json({ error: 'Ese correo ya tiene una cuenta en la plataforma.' }, 409)
    }

    const { error: inviteError } = await asService.auth.admin.inviteUserByEmail(email, {
      data: { nombre, rol: 'miembro', family_id: familyId },
    })
    if (inviteError) {
      return json({ error: `No se pudo enviar la invitación: ${inviteError.message}` }, 400)
    }

    return json({ ok: true }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Error interno.' }, 500)
  }
})
