import { useState, FormEvent } from 'react'
import { IconPackage, IconMail, IconLock, IconLoader2 } from '@tabler/icons-react'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setCarregando(true)

    try {
      await login(email, senha)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg.includes('Invalid login credentials')) {
        setErro('Email ou senha incorretos.')
      } else if (msg.includes('Email not confirmed')) {
        setErro('Confirme seu email antes de fazer login.')
      } else {
        setErro('Falha ao conectar. Tente novamente.')
      }
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue rounded-2xl mb-4 shadow-lg shadow-brand-blue/30">
            <IconPackage size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EstoqueSync</h1>
          <p className="text-gray-400 mt-2">Gestão de estoque em tempo real</p>
        </div>

        {/* Card de login */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-6">Entrar na sua conta</h2>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <IconMail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
              <div className="relative">
                <IconLock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-brand-blue hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {carregando ? (
                <>
                  <IconLoader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-border">
            <p className="text-xs text-gray-500 text-center">
              Contas de demonstração configuradas no Supabase.<br />
              Consulte o README para obter as credenciais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
