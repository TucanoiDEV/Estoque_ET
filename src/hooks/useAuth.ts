import { useState, useEffect, createContext, useContext } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, db } from '../services/supabase'
import type { Usuario, AuthContextType } from '../types'

export const AuthContext = createContext<AuthContextType>({
  usuario: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}

function perfilFallback(authUser: User): Usuario {
  return {
    id: authUser.id,
    nome: authUser.user_metadata?.full_name ?? authUser.email?.split('@')[0] ?? 'Usuário',
    email: authUser.email ?? '',
    cargo: 'operador',
    created_at: authUser.created_at,
  }
}

export function useAuthProvider(): AuthContextType {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  // Busca o perfil completo do usuário (cargo etc.) na tabela usuarios
  async function buscarPerfil(authUser: User): Promise<void> {
    try {
      const { data, error } = await db
        .usuarios()
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (data) {
        setUsuario(data as Usuario)
      } else {
        // Usuário autenticado mas sem linha em public.usuarios — usa dados do auth como fallback
        if (error) console.warn('[EstoqueSync] Perfil não encontrado:', error.message)
        setUsuario(perfilFallback(authUser))
      }
    } catch {
      // Mantém acesso usando dados do auth para não bloquear o usuário autenticado
      setUsuario(perfilFallback(authUser))
    }
  }

  useEffect(() => {
    let cancelado = false

    // Timeout de segurança: se getSession demorar > 8s, libera o loading
    const timeout = setTimeout(() => {
      if (!cancelado) {
        console.warn('[EstoqueSync] Auth timeout — redirecionando para login')
        setLoading(false)
      }
    }, 5000)

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (cancelado) return
        if (session?.user) {
          buscarPerfil(session.user).finally(() => {
            if (!cancelado) setLoading(false)
          })
        } else {
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[EstoqueSync] Falha ao verificar sessão:', err)
        if (!cancelado) setLoading(false)
      })
      .finally(() => clearTimeout(timeout))

    // Escuta mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelado) return
      if (session?.user) {
        buscarPerfil(session.user).finally(() => {
          if (!cancelado) setLoading(false)
        })
      } else {
        setUsuario(null)
        setLoading(false)
      }
    })

    return () => {
      cancelado = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function login(email: string, senha: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(error.message)
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  return { usuario, loading, login, logout }
}
