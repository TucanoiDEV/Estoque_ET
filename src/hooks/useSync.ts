// Hook para gerenciar sincronização com Supabase

import { useState, useEffect, useCallback } from 'react';
import type { ProdutoComEstoque, Entrada } from '../types';
import {
  sincronizar, iniciarSyncAutomatico, pararSyncAutomatico,
  verificarConexao, registrarCallbackStatus, type StatusSync,
} from '../services/sync';
import { initSupabase, assinarAtualizacoes } from '../services/supabase';

interface UseSyncOpcoes {
  supabaseUrl: string;
  supabaseKey: string;
  syncAutomatico: boolean;
  getProdutos: () => ProdutoComEstoque[];
  getEntradas: () => Entrada[];
  onProdutoAtualizado: (produto: ProdutoComEstoque) => void;
  onEntradaCriada: (entrada: Entrada) => void;
}

export function useSync(opcoes: UseSyncOpcoes) {
  const [statusSync, setStatusSync] = useState<StatusSync>('ocioso');
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    registrarCallbackStatus(setStatusSync);

    // Verifica conexão online periodicamente
    const timer = setInterval(() => {
      setConectado(verificarConexao());
    }, 5000);
    setConectado(verificarConexao());

    return () => clearInterval(timer);
  }, []);

  // Inicializa Supabase quando URL e key são fornecidos
  useEffect(() => {
    if (!opcoes.supabaseUrl || !opcoes.supabaseKey) return;

    const ok = initSupabase(opcoes.supabaseUrl, opcoes.supabaseKey);
    if (!ok) return;

    setConectado(true);

    // Inscreve em atualizações em tempo real
    const cancelar = assinarAtualizacoes(
      opcoes.onProdutoAtualizado,
      opcoes.onEntradaCriada
    );

    // Inicia sync automático se habilitado
    if (opcoes.syncAutomatico) {
      iniciarSyncAutomatico(opcoes.getProdutos, opcoes.getEntradas);
    }

    return () => {
      cancelar();
      pararSyncAutomatico();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opcoes.supabaseUrl, opcoes.supabaseKey, opcoes.syncAutomatico]);

  const syncAgora = useCallback(async () => {
    return sincronizar(opcoes.getProdutos(), opcoes.getEntradas());
  }, [opcoes]);

  return { statusSync, conectado, syncAgora };
}
