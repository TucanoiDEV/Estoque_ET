// Serviço de sincronização offline-first entre SQLite local e Supabase

import type { ProdutoComEstoque, Entrada } from '../types';
import { sincronizarProdutos, sincronizarEntradas, getSupabase } from './supabase';

export type StatusSync = 'ocioso' | 'sincronizando' | 'sincronizado' | 'erro' | 'offline';

let statusAtual: StatusSync = 'ocioso';
let ultimaSincronizacao: Date | null = null;
let onStatusChange: ((status: StatusSync) => void) | null = null;
let syncTimer: ReturnType<typeof setInterval> | null = null;

export function registrarCallbackStatus(fn: (status: StatusSync) => void): void {
  onStatusChange = fn;
}

function setStatus(status: StatusSync): void {
  statusAtual = status;
  onStatusChange?.(status);
}

export function getStatusSync(): StatusSync {
  return statusAtual;
}

export function getUltimaSincronizacao(): Date | null {
  return ultimaSincronizacao;
}

export async function sincronizar(
  produtos: ProdutoComEstoque[],
  entradas: Entrada[]
): Promise<boolean> {
  if (!getSupabase()) {
    setStatus('offline');
    return false;
  }

  setStatus('sincronizando');

  try {
    const [okProdutos, okEntradas] = await Promise.all([
      sincronizarProdutos(produtos),
      sincronizarEntradas(entradas),
    ]);

    if (okProdutos && okEntradas) {
      setStatus('sincronizado');
      ultimaSincronizacao = new Date();
      return true;
    }

    setStatus('erro');
    return false;
  } catch {
    setStatus('erro');
    return false;
  }
}

// Agenda sincronização automática periódica (a cada 30 segundos)
export function iniciarSyncAutomatico(
  getProdutos: () => ProdutoComEstoque[],
  getEntradas: () => Entrada[]
): void {
  if (syncTimer) clearInterval(syncTimer);

  syncTimer = setInterval(async () => {
    if (getSupabase()) {
      await sincronizar(getProdutos(), getEntradas());
    }
  }, 30_000);
}

export function pararSyncAutomatico(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export function verificarConexao(): boolean {
  return navigator.onLine && getSupabase() !== null;
}
