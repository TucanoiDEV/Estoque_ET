import { useState, useRef, useEffect } from 'react'
import { IconPackage, IconPlus, IconMinus, IconSquarePlus, IconSun, IconMoon, IconLogout, IconUser, IconUserEdit, IconMenu2, IconChevronDown } from '@tabler/icons-react'
import { SyncIndicator } from './SyncIndicator'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import { EditarPerfilModal } from '../Perfil/EditarPerfilModal'

interface Props {
  temaEscuro: boolean
  onToggleTema: () => void
  sincronizando: boolean
  onNovaEntrada: () => void
  onNovaSaida: () => void
  onNovoProduto: () => void
  onToggleSidebar: () => void
}

export function Header({ temaEscuro, onToggleTema, sincronizando, onNovaEntrada, onNovaSaida, onNovoProduto, onToggleSidebar }: Props) {
  const { usuario, logout } = useAuth()
  const { canRegisterEntrada, canRegisterSaida, canEdit, cargo } = usePermissions()

  const [menuAberto, setMenuAberto] = useState(false)
  const [perfilAberto, setPerfilAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!menuAberto) return
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAberto(false)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  }, [menuAberto])

  const badgeCargo: Record<string, string> = {
    admin: 'bg-brand-purple/20 text-brand-purple',
    operador: 'bg-brand-blue/20 text-brand-blue',
    visualizador: 'bg-gray-500/20 text-gray-400',
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-dark-card/80 backdrop-blur-md border-b border-dark-border flex items-center px-4 gap-2">
      {/* Botão de menu (apenas mobile) */}
      <button
        onClick={onToggleSidebar}
        title="Menu"
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors shrink-0"
      >
        <IconMenu2 size={20} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-auto min-w-0">
        <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center shadow-lg shadow-brand-blue/30 shrink-0">
          <IconPackage size={18} className="text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight truncate hidden sm:inline">Armazém Machado</span>
      </div>

      {/* Indicador de sync */}
      <SyncIndicator sincronizando={sincronizando} />

      {/* Botão novo produto */}
      {canEdit() && (
        <button
          onClick={onNovoProduto}
          title="Cadastrar novo produto"
          className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-brand-blue/20"
        >
          <IconSquarePlus size={16} />
          <span className="hidden md:inline">Novo produto</span>
        </button>
      )}

      {/* Botão nova entrada */}
      {canRegisterEntrada() && (
        <button
          onClick={onNovaEntrada}
          title="Registrar entrada de estoque"
          className="flex items-center gap-1.5 bg-brand-green hover:bg-green-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-brand-green/20"
        >
          <IconPlus size={16} />
          <span className="hidden md:inline">Nova entrada</span>
        </button>
      )}

      {/* Botão saída */}
      {canRegisterSaida() && (
        <button
          onClick={onNovaSaida}
          title="Registrar saída de estoque"
          className="flex items-center gap-1.5 bg-brand-red hover:bg-red-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-brand-red/20"
        >
          <IconMinus size={16} />
          <span className="hidden md:inline">Saída</span>
        </button>
      )}

      {/* Toggle tema */}
      <button
        onClick={onToggleTema}
        title={temaEscuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
      >
        {temaEscuro ? <IconSun size={18} /> : <IconMoon size={18} />}
      </button>

      {/* Perfil do usuário (clique abre o menu) */}
      <div ref={menuRef} className="relative pl-2 border-l border-dark-border">
        <button
          onClick={() => setMenuAberto((v) => !v)}
          title="Perfil"
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-dark-hover transition-colors"
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-medium text-white leading-none">{usuario?.nome}</span>
            <span className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded-full font-medium ${badgeCargo[cargo ?? 'visualizador']}`}>
              {cargo}
            </span>
          </div>
          <div className="w-7 h-7 bg-dark-border rounded-full flex items-center justify-center overflow-hidden shrink-0">
            {usuario?.avatar_url ? (
              <img src={usuario.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <IconUser size={14} className="text-gray-400" />
            )}
          </div>
          <IconChevronDown size={14} className={`text-gray-400 transition-transform ${menuAberto ? 'rotate-180' : ''}`} />
        </button>

        {menuAberto && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-1.5 z-50"
          >
            <button
              role="menuitem"
              onClick={() => { setMenuAberto(false); setPerfilAberto(true) }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-dark-hover transition-colors"
            >
              <IconUserEdit size={16} className="text-brand-blue" />
              Editar Perfil
            </button>
            <button
              role="menuitem"
              onClick={() => { setMenuAberto(false); logout() }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-300 hover:text-brand-red hover:bg-brand-red/10 transition-colors"
            >
              <IconLogout size={16} />
              Sair
            </button>
          </div>
        )}
      </div>

      {perfilAberto && <EditarPerfilModal onFechar={() => setPerfilAberto(false)} />}
    </header>
  )
}
