// Header principal com navegaÃ§Ã£o, indicador de sync e botÃ£o Nova Entrada

import { IconPlus, IconSun, IconMoon } from '@tabler/icons-react';
import type { AbaAtiva } from '../../types';
import type { StatusSync } from '../../services/sync';
import { SyncIndicator } from './SyncIndicator';

interface HeaderProps {
  abaAtiva: AbaAtiva;
  onAbaChange: (aba: AbaAtiva) => void;
  onNovaEntrada: () => void;
  tema: 'claro' | 'escuro';
  onAlternarTema: () => void;
  statusSync: StatusSync;
  conectado: boolean;
  onSyncManual: () => void;
}

const abas: { id: AbaAtiva; label: string }[] = [
  { id: 'dashboard',     label: 'Dashboard' },
  { id: 'estoque',       label: 'Estoque' },
  { id: 'configuracoes', label: 'Configuracoes' },
];

export function Header({
  abaAtiva, onAbaChange, onNovaEntrada,
  tema, onAlternarTema,
  statusSync, conectado, onSyncManual,
}: HeaderProps) {
  return (
    <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-40">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo + tÃ­tulo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-black font-bold text-sm select-none">
            ES
          </div>
          <span className="font-semibold text-white text-base hidden sm:block">
            EstoqueSync
          </span>
        </div>

        {/* AÃ§Ãµes direitas */}
        <div className="flex items-center gap-2">
          <SyncIndicator
            status={statusSync}
            conectado={conectado}
            onClick={onSyncManual}
          />

          {/* Toggle de tema */}
          <button
            onClick={onAlternarTema}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-[var(--color-card)] transition-colors"
            title={tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
          >
            {tema === 'escuro' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </button>

          {/* BotÃ£o Nova Entrada */}
          <button
            onClick={onNovaEntrada}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#222] border border-[#333]
              text-white text-sm font-medium hover:bg-[#2a2a2a] hover:border-teal-500 transition-all"
          >
            <IconPlus size={16} />
            <span className="hidden sm:inline">Nova Entrada</span>
          </button>
        </div>
      </div>

      {/* Abas de navegaÃ§Ã£o */}
      <nav className="flex px-6 gap-6">
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => onAbaChange(aba.id)}
            className={`pb-3 pt-1 text-sm font-medium border-b-2 transition-all ${
              abaAtiva === aba.id
                ? 'text-teal-400 border-teal-400'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

