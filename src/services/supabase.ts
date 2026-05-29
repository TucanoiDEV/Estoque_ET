// Serviço Supabase — sincronização em nuvem com Realtime

import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import type { ProdutoComEstoque, Entrada } from '../types';

let supabase: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

// Inicializa o cliente com URL e chave fornecidos pelo usuário
export function initSupabase(url: string, key: string): boolean {
  if (!url || !key) return false;
  try {
    supabase = createClient(url, key);
    return true;
  } catch {
    return false;
  }
}

export function getSupabase(): SupabaseClient | null {
  return supabase;
}

export async function testarConexao(url: string, key: string): Promise<boolean> {
  if (!url || !key) return false;
  try {
    const client = createClient(url, key);
    const { error } = await client.from('produtos').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

// ——— Sincronização de produtos ———
export async function sincronizarProdutos(
  produtos: ProdutoComEstoque[]
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('produtos').upsert(
      produtos.map(({ status, fornecedor_nome, ...p }) => p),
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

// ——— Sincronização de entradas ———
export async function sincronizarEntradas(
  entradas: Entrada[]
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const naoSincronizadas = entradas.filter(e => !e.sincronizado);
    if (naoSincronizadas.length === 0) return true;

    const { error } = await supabase.from('entradas').upsert(
      naoSincronizadas,
      { onConflict: 'id' }
    );
    return !error;
  } catch {
    return false;
  }
}

// ——— Realtime Subscriptions ———
export function assinarAtualizacoes(
  onProdutoAtualizado: (produto: ProdutoComEstoque) => void,
  onEntradaCriada: (entrada: Entrada) => void
): () => void {
  if (!supabase) return () => {};

  realtimeChannel = supabase
    .channel('estoque-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'produtos' },
      (payload) => {
        if (payload.new) {
          onProdutoAtualizado(payload.new as ProdutoComEstoque);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'entradas' },
      (payload) => {
        if (payload.new) {
          onEntradaCriada(payload.new as Entrada);
        }
      }
    )
    .subscribe();

  // Retorna função para cancelar a assinatura
  return () => {
    realtimeChannel?.unsubscribe();
    realtimeChannel = null;
  };
}

// ——— Buscar dados da nuvem ———
export async function buscarProdutosNuvem(): Promise<ProdutoComEstoque[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('codigo');
    if (error) return [];
    return (data ?? []) as ProdutoComEstoque[];
  } catch {
    return [];
  }
}

export async function buscarEntradasNuvem(limite = 100): Promise<Entrada[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('entradas')
      .select('*')
      .order('data_recebimento', { ascending: false })
      .limit(limite);
    if (error) return [];
    return (data ?? []) as Entrada[];
  } catch {
    return [];
  }
}
