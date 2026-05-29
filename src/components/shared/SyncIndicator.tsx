import { IconRefresh, IconCheck } from '@tabler/icons-react'

interface Props {
  sincronizando: boolean
}

// Indicador animado de sincronização no header
export function SyncIndicator({ sincronizando }: Props) {
  return (
    <div
      title={sincronizando ? 'Sincronizando...' : 'Sincronizado'}
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-300 ${
        sincronizando
          ? 'bg-brand-blue/20 text-brand-blue'
          : 'bg-brand-green/10 text-brand-green'
      }`}
    >
      {sincronizando ? (
        <>
          <IconRefresh size={13} className="animate-spin" />
          <span className="hidden sm:inline">Sincronizando</span>
        </>
      ) : (
        <>
          <IconCheck size={13} />
          <span className="hidden sm:inline">Sincronizado</span>
        </>
      )}
    </div>
  )
}
