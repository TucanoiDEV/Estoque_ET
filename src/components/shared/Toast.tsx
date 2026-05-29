// Componente de notificaÃ§Ãµes toast

import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import type { ToastNotificacao } from '../../types';

interface ToastContainerProps {
  toasts: ToastNotificacao[];
  onFechar: (id: string) => void;
}

function iconeToast(tipo: ToastNotificacao['tipo']) {
  switch (tipo) {
    case 'sucesso': return <IconCheck size={18} />;
    case 'erro':    return <IconX size={18} />;
    case 'aviso':   return <IconAlertTriangle size={18} />;
    case 'info':    return <IconInfoCircle size={18} />;
  }
}

function corToast(tipo: ToastNotificacao['tipo']) {
  switch (tipo) {
    case 'sucesso': return 'border-teal-500 text-teal-400';
    case 'erro':    return 'border-red-500 text-red-400';
    case 'aviso':   return 'border-yellow-500 text-yellow-400';
    case 'info':    return 'border-blue-500 text-blue-400';
  }
}

export function ToastContainer({ toasts, onFechar }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border
            bg-[#1c1c1c] shadow-lg animate-slide-up
            ${corToast(toast.tipo)}`}
        >
          <span className="shrink-0">{iconeToast(toast.tipo)}</span>
          <span className="flex-1 text-sm text-white">{toast.mensagem}</span>
          <button
            onClick={() => onFechar(toast.id)}
            className="shrink-0 text-neutral-400 hover:text-white transition-colors"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

