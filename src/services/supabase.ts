import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Sinaliza configuração incompleta sem quebrar a inicialização do módulo
export const supabaseConfigurado = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
  {
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
  }
)

// Helpers tipados para as tabelas
export const db = {
  usuarios: () => supabase.from('usuarios'),
  produtos: () => supabase.from('produtos'),
  estoque: () => supabase.from('estoque'),
  fornecedores: () => supabase.from('fornecedores'),
  fornecedorProdutos: () => supabase.from('fornecedor_produtos'),
  entradas: () => supabase.from('entradas'),
  saidas: () => supabase.from('saidas'),
  configuracoes: () => supabase.from('configuracoes'),
}
