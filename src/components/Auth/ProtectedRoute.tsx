import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface Props {
  children: React.ReactNode
}

// Redireciona para /login se o usuário não estiver autenticado
export function ProtectedRoute({ children }: Props) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0d1117',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              background: '#3b82f6',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            📦
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>EstoqueSync</span>
        </div>

        {/* Spinner SVG */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#30363d" strokeWidth="4" />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeDasharray="25 75"
            strokeLinecap="round"
          />
        </svg>

        <p style={{ color: '#8b949e', fontSize: 14, margin: 0 }}>Verificando autenticação...</p>

        {/* Barra de progresso animada */}
        <div style={{ width: 200, height: 3, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
              borderRadius: 2,
              animation: 'progress 1.5s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes progress {
              0% { width: 0%; margin-left: 0%; }
              50% { width: 60%; margin-left: 20%; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
