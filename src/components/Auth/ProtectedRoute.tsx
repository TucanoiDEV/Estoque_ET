import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { IconLoader2 } from '@tabler/icons-react'

interface Props {
  children: React.ReactNode
}

// Redireciona para /login se o usuário não estiver autenticado
export function ProtectedRoute({ children }: Props) {
  const { usuario, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <IconLoader2 size={32} className="animate-spin text-brand-blue" />
          <span className="text-gray-400 text-sm">Verificando autenticação...</span>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
