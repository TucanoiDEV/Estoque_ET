// Hook principal — gerencia todo o estado do estoque

import { useState, useEffect, useCallback } from 'react';
import type {
  ProdutoComEstoque, Entrada, Fornecedor, Categoria,
  ConfiguracaoApp, MetricasDashboard, Usuario,
} from '../types';
import * as db from '../services/db';
import { relatoriosSeed, usuariosSeed } from '../data/seedData';

interface EstoqueState {
  produtos: ProdutoComEstoque[];
  entradas: Entrada[];
  fornecedores: Fornecedor[];
  categorias: Categoria[];
  usuarios: Usuario[];
  config: ConfiguracaoApp | null;
  metricas: MetricasDashboard | null;
  carregando: boolean;
  erro: string | null;
  pronto: boolean;
}

const estadoInicial: EstoqueState = {
  produtos: [],
  entradas: [],
  fornecedores: [],
  categorias: [],
  usuarios: usuariosSeed,
  config: null,
  metricas: null,
  carregando: true,
  erro: null,
  pronto: false,
};

export function useEstoque() {
  const [estado, setEstado] = useState<EstoqueState>(estadoInicial);

  const carregarTudo = useCallback(async () => {
    try {
      setEstado(s => ({ ...s, carregando: true, erro: null }));

      const [produtos, entradas, fornecedores, categorias, config, metricas] = await Promise.all([
        db.getProdutos(),
        db.getEntradas(),
        db.getFornecedores(),
        db.getCategorias(),
        db.getConfig(),
        db.getMetricas(),
      ]);

      setEstado(s => ({
        ...s,
        produtos,
        entradas,
        fornecedores,
        categorias,
        config,
        metricas,
        carregando: false,
        pronto: true,
      }));
    } catch (err) {
      setEstado(s => ({
        ...s,
        carregando: false,
        erro: 'Erro ao carregar dados: ' + String(err),
        pronto: true,
      }));
    }
  }, []);

  // Inicialização
  useEffect(() => {
    db.initDB().then(carregarTudo);
  }, [carregarTudo]);

  // ——— Ações de produto ———
  const criarProduto = useCallback(async (
    dados: Omit<ProdutoComEstoque, 'id' | 'created_at' | 'status'>
  ) => {
    const novo = await db.criarProduto(dados);
    setEstado(s => ({
      ...s,
      produtos: [...s.produtos, novo],
      metricas: s.metricas
        ? { ...s.metricas, total_itens: s.metricas.total_itens + dados.quantidade }
        : null,
    }));
    return novo;
  }, []);

  const atualizarProduto = useCallback(async (
    id: string,
    dados: Partial<Omit<ProdutoComEstoque, 'id' | 'created_at'>>
  ) => {
    await db.atualizarProduto(id, dados);
    setEstado(s => ({
      ...s,
      produtos: s.produtos.map(p =>
        p.id === id ? { ...p, ...dados } : p
      ),
    }));
  }, []);

  const deletarProduto = useCallback(async (id: string) => {
    await db.deletarProduto(id);
    setEstado(s => ({
      ...s,
      produtos: s.produtos.filter(p => p.id !== id),
    }));
  }, []);

  // ——— Ações de entrada ———
  const registrarEntrada = useCallback(async (
    dados: Omit<Entrada, 'id' | 'created_at' | 'sincronizado'>
  ) => {
    const nova = await db.criarEntrada(dados);

    setEstado(s => {
      const produtos = s.produtos.map(p => {
        if (p.id !== dados.produto_id) return p;
        const novaQtd = p.quantidade + dados.quantidade;
        const status = novaQtd <= p.estoque_minimo * 0.5 ? 'critico'
          : novaQtd <= p.estoque_minimo ? 'baixo' : 'normal';
        return { ...p, quantidade: novaQtd, status } as ProdutoComEstoque;
      });

      return {
        ...s,
        entradas: [nova, ...s.entradas],
        produtos,
        metricas: s.metricas
          ? {
              ...s.metricas,
              entradas_mes: s.metricas.entradas_mes + 1,
              total_itens: s.metricas.total_itens + dados.quantidade,
              valor_total: s.metricas.valor_total + dados.total,
            }
          : null,
      };
    });

    return nova;
  }, []);

  // ——— Ações de fornecedor ———
  const criarFornecedor = useCallback(async (
    dados: Omit<Fornecedor, 'id' | 'created_at'>
  ) => {
    const novo = await db.criarFornecedor(dados);
    setEstado(s => ({ ...s, fornecedores: [...s.fornecedores, novo] }));
    return novo;
  }, []);

  const deletarFornecedor = useCallback(async (id: string) => {
    await db.deletarFornecedor(id);
    setEstado(s => ({ ...s, fornecedores: s.fornecedores.filter(f => f.id !== id) }));
  }, []);

  // ——— Ações de categoria ———
  const criarCategoria = useCallback(async (nome: string) => {
    const nova = await db.criarCategoria(nome);
    setEstado(s => ({ ...s, categorias: [...s.categorias, nova] }));
    return nova;
  }, []);

  const deletarCategoria = useCallback(async (id: string) => {
    await db.deletarCategoria(id);
    setEstado(s => ({ ...s, categorias: s.categorias.filter(c => c.id !== id) }));
  }, []);

  // ——— Configurações ———
  const salvarConfig = useCallback(async (config: ConfiguracaoApp) => {
    await db.salvarConfig(config);
    setEstado(s => ({ ...s, config }));
  }, []);

  // Atualiza produto no estado (p/ realtime)
  const atualizarProdutoEstado = useCallback((produto: ProdutoComEstoque) => {
    setEstado(s => ({
      ...s,
      produtos: s.produtos.map(p => p.id === produto.id ? produto : p),
    }));
  }, []);

  return {
    ...estado,
    relatorios: relatoriosSeed,
    criarProduto,
    atualizarProduto,
    deletarProduto,
    registrarEntrada,
    criarFornecedor,
    deletarFornecedor,
    criarCategoria,
    deletarCategoria,
    salvarConfig,
    atualizarProdutoEstado,
    recarregar: carregarTudo,
  };
}
