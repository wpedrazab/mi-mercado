import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../data/remote/supabaseClient'
import { resolveAuthState, type AuthState } from './authState'

type AuthContextValue = AuthState & {
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load(session: Session | null) {
      const next = await resolveAuthState(session)
      if (!cancelled) setState(next)
    }

    supabase.auth.getSession().then(({ data }) => load(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session)
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextValue = {
    ...state,
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
