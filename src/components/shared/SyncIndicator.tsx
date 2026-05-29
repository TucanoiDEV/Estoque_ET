// Indicador de status de sincronizaÃ§Ã£o no header

import { IconCloud, IconCloudOff, IconLoader2, IconCloudCheck } from '@tabler/icons-react';
import type { StatusSync } from '../../services/sync';

interface SyncIndicatorProps {
  status: StatusSync;
  conectado: boolean;
  onClick?: () => void;
}

export function SyncIndicator({ status, conectado, onClick }: SyncIndicatorProps) {
  const configs = {
    ocioso: {
      icone: <IconCloud size={16} />,
      cor: 'text-neutral-500',
      label: 'Aguardando sync',
    },
    sincronizando: {
      icone: <IconLoader2 size={16} className="animate-spin" />,
      cor: 'text-teal-400 sync-pulse',
      label: 'Sincronizando...',
    },
    sincronizado: {
      icone: <IconCloudCheck size={16} />,
      cor: 'text-teal-400',
      label: 'Sincronizado',
    },
    erro: {
      icone: <IconCloudOff size={16} />,
      cor: 'text-red-400',
      label: 'Erro de sync',
    },
    offline: {
      icone: <IconCloudOff size={16} />,
      cor: 'text-neutral-500',
      label: 'Offline',
    },
  };

  if (!conectado && status !== 'sincronizando') {
    return (
      <button
        onClick={onClick}
        title="Sem conexÃ£o com Supabase"
        className="flex items-center gap-1.5 px-2 py-1 rounded text-neutral-500 hover:text-neutral-400 transition-colors"
      >
        <IconCloudOff size={16} />
        <span className="text-xs hidden sm:inline">Offline</span>
      </button>
    );
  }

  const cfg = configs[status];

  return (
    <button
      onClick={onClick}
      title={cfg.label}
      className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors hover:opacity-80 ${cfg.cor}`}
    >
      {cfg.icone}
      <span className="text-xs hidden sm:inline">{cfg.label}</span>
    </button>
  );
}

