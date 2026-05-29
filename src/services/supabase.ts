import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias. Crie um arquivo .env com base no .env.example'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helpers tipados para as tabelas
export const db = {
  usuarios: () => supabase.from('usuarios'),
  produtos: () => supabase.from('produtos'),
  estoque: () => supabase.from('estoque'),
  fornecedores: () => supabase.from('fornecedores'),
  entradas: () => supabase.from('entradas'),
  configuracoes: () => supabase.from('configuracoes'),
}
