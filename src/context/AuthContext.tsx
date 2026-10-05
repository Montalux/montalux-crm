import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  isAuthenticated: boolean
  // RLS only grants data with app_metadata.crm = true; without it every table is empty
  hasCrmAccess: boolean
  email: string | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const rememberMe = localStorage.getItem('rememberMe')
        const currentSession = sessionStorage.getItem('currentSession')
        if (rememberMe === 'false' && !currentSession) {
          await supabase.auth.signOut()
          setSession(null)
          setLoading(false)
          return
        }
      }
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session,
      hasCrmAccess: session?.user.app_metadata?.crm === true,
      email: session?.user.email ?? null,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
