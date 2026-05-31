import { useState, FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const { login, usuario, loading } = useAuth()
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
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('Invalid login credentials')) setErro('Email ou senha incorretos.')
      else if (msg.includes('Email not confirmed')) setErro('Confirme seu email antes de fazer login.')
      else setErro('Falha ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (!loading && usuario) return <Navigate to="/" replace />

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            background: '#3b82f6',
            borderRadius: '16px',
            marginBottom: '16px',
            fontSize: '28px',
          }}>📦</div>
          <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 700, margin: '0 0 8px' }}>
            Armazém Machado
          </h1>
          <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
            Gestão de estoque em tempo real
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '20px',
          padding: '32px',
        }}>
          <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, margin: '0 0 24px' }}>
            Entrar na sua conta
          </h2>

          {erro && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '14px',
            }}>
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label htmlFor="email" style={{ display: 'block', color: '#d1d5db', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label htmlFor="senha" style={{ display: 'block', color: '#d1d5db', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: '100%',
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={carregando}
              style={{
                width: '100%',
                background: carregando ? '#1d4ed8' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: carregando ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #30363d', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>
              Configure os usuários no Supabase conforme o README.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
