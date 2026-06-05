import {
  IconLayoutDashboard,
  IconPackage,
  IconTruck,
  IconSettings,
} from '@tabler/icons-react'
import { usePermissions } from '../../hooks/usePermissions'

type Aba = 'dashboard' | 'estoque' | 'fornecedores' | 'configuracoes'

interface Props {
  abaAtiva: Aba
  onMudarAba: (aba: Aba) => void
  aberta: boolean
  onFechar: () => void
}

const abas: { id: Aba; label: string; icon: React.ReactNode; soAdmin?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IconLayoutDashboard size={20} /> },
  { id: 'estoque', label: 'Estoque', icon: <IconPackage size={20} /> },
  { id: 'fornecedores', label: 'Fornecedores', icon: <IconTruck size={20} />, soAdmin: true },
  { id: 'configuracoes', label: 'Configurações', icon: <IconSettings size={20} />, soAdmin: true },
]

export function Sidebar({ abaAtiva, onMudarAba, aberta, onFechar }: Props) {
  const { isAdmin } = usePermissions()
  // Configurações é exclusiva de admin — esconde a aba para operador/visualizador
  const abasVisiveis = abas.filter((aba) => !aba.soAdmin || isAdmin())

  return (
    <>
      {/* Overlay (apenas em mobile, quando aberta) */}
      {aberta && (
        <div
          onClick={onFechar}
          className="fixed inset-0 top-16 bg-black/60 z-20 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-16 bottom-0 w-56 bg-dark-card border-r border-dark-border flex flex-col py-4 z-30 transition-transform duration-200 lg:translate-x-0 ${
          aberta ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 px-3">
          {abasVisiveis.map((aba) => (
            <button
              key={aba.id}
              onClick={() => { onMudarAba(aba.id); onFechar() }}
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
          <div className="text-xs text-gray-600 text-center">Armazém Machado v1.0</div>
        </div>
      </aside>
    </>
  )
}

export type { Aba }
