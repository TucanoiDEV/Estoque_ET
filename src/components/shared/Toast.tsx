import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconInfoCircle,
  IconCircleX,
} from '@tabler/icons-react'
import type { ToastItem, ToastContextType, TipoToast } from '../../types'

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  mostrarToast: () => {},
  removerToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removerToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const mostrarToast = useCallback(
    (mensagem: string, tipo: TipoToast = 'info') => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, mensagem, tipo }])
      setTimeout(() => removerToast(id), 4000)
    },
    [removerToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, mostrarToast, removerToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemover={removerToast} />
    </ToastContext.Provider>
  )
}

// Container com todos os toasts visíveis
function ToastContainer({ toasts, onRemover }: { toasts: ToastItem[]; onRemover: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemover={onRemover} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onRemover }: { toast: ToastItem; onRemover: (id: string) => void }) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    // Anima entrada
    const t = setTimeout(() => setVisivel(true), 10)
    return () => clearTimeout(t)
  }, [])

  const estilos: Record<TipoToast, { bg: string; icon: React.ReactNode }> = {
    sucesso: {
      bg: 'bg-brand-green/10 border-brand-green/30 text-brand-green',
      icon: <IconCheck size={18} />,
    },
    erro: {
      bg: 'bg-brand-red/10 border-brand-red/30 text-brand-red',
      icon: <IconCircleX size={18} />,
    },
    aviso: {
      bg: 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow',
      icon: <IconAlertTriangle size={18} />,
    },
    info: {
      bg: 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue',
      icon: <IconInfoCircle size={18} />,
    },
  }

  const estilo = estilos[toast.tipo]

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg transition-all duration-300 ${estilo.bg} ${
        visivel ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="mt-0.5 shrink-0">{estilo.icon}</span>
      <p className="text-sm font-medium text-white flex-1">{toast.mensagem}</p>
      <button
        onClick={() => onRemover(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <IconX size={16} />
      </button>
    </div>
  )
}
