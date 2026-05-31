import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/supabase'
import type {
  ProdutoComEstoque,
  Produto,
  Fornecedor,
  Entrada,
  MetricasDashboard,
  DadoGrafico,
  StatusEstoque,
} from '../types'

// Determina o status com base na quantidade e no mínimo
function calcularStatus(quantidade: number, minimo: number): StatusEstoque {
  if (quantidade <= minimo) return 'critico'
  if (quantidade <= minimo * 1.5) return 'baixo'
  return 'normal'
}

export function useEstoque() {
  const [produtos, setProdutos] = useState<ProdutoComEstoque[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarProdutos = useCallback(async () => {
    setLoading(true)
    setErro(null)

    const { data, error } = await db
      .estoque()
      .select(`
        quantidade,
        updated_at,
        produto:produto_id (
          id, codigo, nome, categoria, unidade, cor,
          custo_unitario, estoque_minimo, local_armazenamento, created_at
        )
      `)

    if (error) {
      setErro('Falha ao carregar o estoque. Verifique sua conexão.')
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itens: ProdutoComEstoque[] = (data ?? []).map((item: any) => ({
      ...item.produto,
      quantidade: item.quantidade,
      status: calcularStatus(item.quantidade, item.produto?.estoque_minimo ?? 10),
    }))

    setProdutos(itens)
    setLoading(false)
  }, [])

  const carregarFornecedores = useCallback(async () => {
    const { data } = await db.fornecedores().select('*').order('nome')
    setFornecedores((data as Fornecedor[]) ?? [])
  }, [])

  const carregarEntradas = useCallback(async () => {
    const { data } = await db
      .entradas()
      .select(`
        *,
        produto:produto_id (id, codigo, nome),
        fornecedor:fornecedor_id (id, nome),
        usuario:usuario_id (id, nome, email)
      `)
      .order('created_at', { ascending: false })

    setEntradas((data as Entrada[]) ?? [])
  }, [])

  useEffect(() => {
    Promise.all([carregarProdutos(), carregarFornecedores(), carregarEntradas()])
  }, [carregarProdutos, carregarFornecedores, carregarEntradas])

  // Métricas calculadas do dashboard
  const metricas: MetricasDashboard = {
    totalItens: produtos.reduce((acc, p) => acc + p.quantidade, 0),
    valorTotal: produtos.reduce((acc, p) => acc + (p.custo_unitario ?? 0) * p.quantidade, 0),
    itensCriticos: produtos.filter((p) => p.status === 'critico').length,
    entradasMes: entradas.filter((e) => {
      const mesAtual = new Date().toISOString().slice(0, 7)
      return e.created_at.startsWith(mesAtual)
    }).length,
  }

  // Dados para gráfico de entradas mensais dos últimos 6 meses
  const dadosGraficoMensal: DadoGrafico[] = (() => {
    const meses: DadoGrafico[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const chave = d.toISOString().slice(0, 7)
      const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const entradasDoMes = entradas.filter((e) => e.created_at.startsWith(chave))
      meses.push({
        mes: nomeMes,
        quantidade: entradasDoMes.reduce((acc, e) => acc + e.quantidade, 0),
        total: entradasDoMes.reduce((acc, e) => acc + (e.total ?? 0), 0),
      })
    }
    return meses
  })()

  // Top 5 produtos mais movimentados
  const topProdutos = (() => {
    const contagem: Record<string, { nome: string; movimentacoes: number }> = {}
    entradas.forEach((e) => {
      const nome = (e.produto as Produto | undefined)?.nome ?? 'Desconhecido'
      contagem[e.produto_id] = {
        nome,
        movimentacoes: (contagem[e.produto_id]?.movimentacoes ?? 0) + e.quantidade,
      }
    })
    return Object.values(contagem)
      .sort((a, b) => b.movimentacoes - a.movimentacoes)
      .slice(0, 5)
  })()

  return {
    produtos,
    fornecedores,
    entradas,
    loading,
    erro,
    metricas,
    dadosGraficoMensal,
    topProdutos,
    recarregar: () => Promise.all([carregarProdutos(), carregarFornecedores(), carregarEntradas()]),
    recarregarProdutos: carregarProdutos,
    recarregarEntradas: carregarEntradas,
  }
}
