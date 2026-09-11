// Edge Function: crea una familia + invita a su usuario principal.
// Es la única pieza que necesita la service-role key (auth.admin.inviteUserByEmail
// no se puede llamar desde el cliente). Todo lo demás corre con el JWT de quien
// llama, para que RLS y las políticas normales sigan aplicando.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface Payload {
  familyName: string
  principalName: string
  principalEmail: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Falta autenticación.' }, 401)

    const { familyName, principalName, principalEmail } = (await req.json()) as Partial<Payload>
    if (!familyName?.trim() || !principalName?.trim() || !principalEmail?.trim()) {
      return json({ error: 'Faltan campos requeridos.' }, 400)
    }

    // Actúa como quien llama: RLS decide si puede crear familias (solo admin).
    const asCaller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await asCaller.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Sesión inválida.' }, 401)

    const { data: callerProfile, error: profileError } = await asCaller
      .from('profiles')
      .select('rol')
      .eq('id', userData.user.id)
      .maybeSingle()
    if (profileError) throw profileError
    if (callerProfile?.rol !== 'admin') {
      return json({ error: 'Solo el administrador puede crear familias.' }, 403)
    }

    // Service role: solo para lo que exige la Admin API (crear el auth.user)
    // y para chequear de antemano si ese correo ya tiene cuenta (profiles no
    // es visible entre familias para nadie más que el admin, pero acá igual
    // usamos el cliente de servicio para no depender de esa visibilidad).
    const asService = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    const { data: existing, error: existingError } = await asService
      .from('profiles')
      .select('id')
      .eq('email', principalEmail)
      .maybeSingle()
    if (existingError) throw existingError
    if (existing) {
      return json({ error: 'Ese correo ya tiene una cuenta en la plataforma.' }, 409)
    }

    const { data: family, error: familyError } = await asCaller
      .from('families')
      .insert({ nombre: familyName })
      .select()
      .single()
    if (familyError) throw familyError

    const { error: inviteError } = await asService.auth.admin.inviteUserByEmail(principalEmail, {
      data: { nombre: principalName, rol: 'principal', family_id: family.id },
    })
    if (inviteError) {
      // No dejar la familia huérfana si la invitación falló.
      await asCaller.from('families').delete().eq('id', family.id)
      return json({ error: `No se pudo enviar la invitación: ${inviteError.message}` }, 400)
    }

    const { error: seedError } = await asCaller.rpc('seed_family_catalog', { p_family_id: family.id })
    if (seedError) throw seedError

    return json({ family }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: 'Error interno.' }, 500)
  }
})
