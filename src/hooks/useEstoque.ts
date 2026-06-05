import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/supabase'
import type {
  ProdutoComEstoque,
  Produto,
  Fornecedor,
  Entrada,
  Saida,
  MetricasDashboard,
  DadoGrafico,
  DadoProdutoMovimentado,
  StatusEstoque,
} from '../types'

// Determina o status com base na quantidade e no mínimo
function calcularStatus(quantidade: number, minimo: number): StatusEstoque {
  if (quantidade <= minimo) return 'critico'
  if (quantidade <= minimo * 1.5) return 'baixo'
  return 'normal'
}

// Soma a quantidade por mês ao longo dos últimos N meses
function serieMensal(registros: { created_at: string; quantidade: number }[], meses: number): DadoGrafico[] {
  const resultado: DadoGrafico[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const chave = d.toISOString().slice(0, 7)
    const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const doMes = registros.filter((r) => r.created_at?.startsWith(chave))
    resultado.push({
      mes: nomeMes,
      quantidade: doMes.reduce((acc, r) => acc + r.quantidade, 0),
      total: 0,
    })
  }
  return resultado
}

export function useEstoque() {
  const [produtos, setProdutos] = useState<ProdutoComEstoque[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarProdutos = useCallback(async () => {
    setLoading(true)
    setErro(null)

    const campos = (nivel: 'completo' | 'desconto' | 'nenhum') => {
      const extra = nivel === 'completo' ? ' desconto, desconto_inicio, desconto_fim,' : nivel === 'desconto' ? ' desconto,' : ''
      return `
        quantidade,
        updated_at,
        produto:produto_id (
          id, codigo, nome, categoria, unidade, cor,
          custo_unitario,${extra} estoque_minimo, local_armazenamento, created_at,
          fornecedor_id,
          fornecedor:fornecedor_id (id, nome)
        )
      `
    }

    // Fallback em níveis: com datas → só desconto → nenhum (conforme as colunas já criadas)
    let resposta = await db.estoque().select(campos('completo'))
    if (resposta.error) resposta = await db.estoque().select(campos('desconto'))
    if (resposta.error) resposta = await db.estoque().select(campos('nenhum'))

    if (resposta.error) {
      setErro('Falha ao carregar o estoque. Verifique sua conexão.')
      setLoading(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itens: ProdutoComEstoque[] = (resposta.data ?? []).map((item: any) => ({
      ...item.produto,
      desconto: item.produto?.desconto ?? 0,
      desconto_inicio: item.produto?.desconto_inicio ?? null,
      desconto_fim: item.produto?.desconto_fim ?? null,
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
        produto:produto_id (id, codigo, nome, unidade),
        fornecedor:fornecedor_id (id, nome),
        usuario:usuario_id (id, nome, email)
      `)
      .order('created_at', { ascending: false })

    setEntradas((data as Entrada[]) ?? [])
  }, [])

  const carregarSaidas = useCallback(async () => {
    // Se a tabela ainda não existir (saidas.sql não rodado), data vem null
    const { data } = await db
      .saidas()
      .select(`
        *,
        produto:produto_id (id, codigo, nome, unidade)
      `)
      .order('created_at', { ascending: false })

    setSaidas((data as Saida[]) ?? [])
  }, [])

  useEffect(() => {
    Promise.all([carregarProdutos(), carregarFornecedores(), carregarEntradas(), carregarSaidas()])
  }, [carregarProdutos, carregarFornecedores, carregarEntradas, carregarSaidas])

  // Métricas calculadas do dashboard
  const mesAtual = new Date().toISOString().slice(0, 7)
  const metricas: MetricasDashboard = {
    totalItens: produtos.reduce((acc, p) => acc + p.quantidade, 0),
    valorTotal: produtos.reduce((acc, p) => acc + (p.custo_unitario ?? 0) * p.quantidade, 0),
    itensCriticos: produtos.filter((p) => p.status === 'critico').length,
    entradasMes: entradas.filter((e) => e.created_at.startsWith(mesAtual)).length,
    saidasMes: saidas.filter((s) => s.created_at.startsWith(mesAtual)).length,
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

  // Top 5 produtos mais movimentados (por entradas)
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

  // Entradas ao longo do ano (12 meses) — gráfico de área
  const dadosEntradasAnual: DadoGrafico[] = serieMensal(entradas, 12)

  // Saídas mensais (12 meses) — gráfico de barras
  const dadosSaidasMensal: DadoGrafico[] = serieMensal(saidas, 12)

  // Top 5 produtos mais vendidos (por saídas)
  const topProdutosVendidos: DadoProdutoMovimentado[] = (() => {
    const contagem: Record<string, { nome: string; movimentacoes: number }> = {}
    saidas.forEach((s) => {
      const nome = (s.produto as Produto | undefined)?.nome ?? 'Desconhecido'
      contagem[s.produto_id] = {
        nome,
        movimentacoes: (contagem[s.produto_id]?.movimentacoes ?? 0) + s.quantidade,
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
    saidas,
    loading,
    erro,
    metricas,
    dadosGraficoMensal,
    topProdutos,
    dadosEntradasAnual,
    dadosSaidasMensal,
    topProdutosVendidos,
    recarregar: () => Promise.all([carregarProdutos(), carregarFornecedores(), carregarEntradas(), carregarSaidas()]),
    recarregarProdutos: carregarProdutos,
    recarregarEntradas: carregarEntradas,
    recarregarSaidas: carregarSaidas,
  }
}
