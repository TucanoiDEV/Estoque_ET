import {
  IconLayoutDashboard,
  IconPackage,
  IconSettings,
} from '@tabler/icons-react'

type Aba = 'dashboard' | 'estoque' | 'configuracoes'

interface Props {
  abaAtiva: Aba
  onMudarAba: (aba: Aba) => void
}

const abas: { id: Aba; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={20} /> },
  { id: 'estoque', label: 'Estoque', icon: <IconPackage size={20} /> },
  { id: 'configuracoes', label: 'Configurações', icon: <IconSettings size={20} /> },
]

export function Sidebar({ abaAtiva, onMudarAba }: Props) {
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-dark-card border-r border-dark-border flex flex-col py-4 z-30">
      <nav className="flex flex-col gap-1 px-3">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => onMudarAba(aba.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              abaAtiva === aba.id
                ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20'
                : 'text-gray-400 hover:text-white hover:bg-dark-hover'
            }`}
          >
            {aba.icon}
            {aba.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-2">
        <div className="text-xs text-gray-600 text-center">EstoqueSync v1.0</div>
      </div>
    </aside>
  )
}

export type { Aba }
