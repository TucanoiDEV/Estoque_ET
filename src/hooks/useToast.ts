// Hook para notificações toast

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ToastNotificacao } from '../types';

export function useToast() {
  const [toasts, setToasts] = useState<ToastNotificacao[]>([]);

  const adicionarToast = useCallback((
    tipo: ToastNotificacao['tipo'],
    mensagem: string,
    duracao = 4000
  ) => {
    const id = uuidv4();
    const toast: ToastNotificacao = { id, tipo, mensagem, duracao };
    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duracao);

    return id;
  }, []);

  const removerToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toasts,
    sucesso: (msg: string) => adicionarToast('sucesso', msg),
    erro: (msg: string) => adicionarToast('erro', msg, 6000),
    aviso: (msg: string) => adicionarToast('aviso', msg),
    info: (msg: string) => adicionarToast('info', msg),
    removerToast,
  };
}
