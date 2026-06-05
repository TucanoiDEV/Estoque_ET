import { useState, useEffect, useMemo } from 'react'
import {
  IconHistory, IconList, IconChartLine, IconX,
} from '@tabler/icons-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatarMoeda } from '../../../utils/numero'
import { formatarData } from '../../../utils/data'
import type { Entrada, Fornecedor } from '../../../types'

interface Compra {
  data: string
  preco: number
  quantidade: number
  unidade: string
  produtoId: string
  produto: string
}

type Modo = 'lista' | 'grafico'

// "4 un", "2,5 kg" — quantidade com a unidade de medida do produto.
function formatarQuantidade(quantidade: number, unidade: string): string {
  const num = Number.isInteger(quantidade) ? quantidade.toString() : quantidade.toLocaleString('pt-BR')
  return `${num} ${unidade}`.trim()
}

// Tooltip do gráfico: mostra data, preço unitário e a quantidade comprada.
interface TooltipPayload {
  payload: { data: string; preco: number; quantidade: number; unidade: string }
}
function TooltipGrafico({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null
  const { data, preco, quantidade, unidade } = payload[0].payload
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs space-y-0.5">
      <p className="text-gray-400">{data}</p>
      <p className="text-brand-blue">Preço: {formatarMoeda(preco)}</p>
      <p className="text-white">Quantidade: {formatarQuantidade(quantidade, unidade)}</p>
    </div>
  )
}

interface Props {
  fornecedor: Fornecedor
  entradas: Entrada[]
  loading: boolean
  onFechar: () => void
}

export function FornecedorHistorico({ fornecedor, entradas, loading, onFechar }: Props) {
  const [modo, setModo] = useState<Modo>('lista')
  const [produtoFiltro, setProdutoFiltro] = useState<string>('') // '' = todos

  // Histórico derivado do estado central (useEstoque): filtra as entradas deste
  // fornecedor. Fonte única de verdade — acompanha o realtime e o histórico geral.
  const compras = useMemo<Compra[]>(
    () => entradas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((e) => (e.fornecedor as any)?.id === fornecedor.id || e.fornecedor_id === fornecedor.id)
      .map((e) => ({
        data: e.data_recebimento,
        preco: e.custo_unitario ?? (e.quantidade ? (e.total ?? 0) / e.quantidade : 0),
        quantidade: e.quantidade,
        unidade: e.produto?.unidade ?? 'un',
        produtoId: e.produto?.id ?? '',
        produto: e.produto?.nome ?? '—',
      })),
    [entradas, fornecedor.id],
  )

  // Produtos distintos presentes no histórico (para o filtro)
  const produtos = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const c of compras) if (c.produtoId) mapa.set(c.produtoId, c.produto)
    return [...mapa.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [compras])

  // No gráfico não há opção "todos": força um produto específico selecionado
  useEffect(() => {
    if (modo !== 'grafico' || produtos.length === 0) return
    if (!produtos.some(([id]) => id === produtoFiltro)) setProdutoFiltro(produtos[0][0])
  }, [modo, produtos, produtoFiltro])

  // Compras após aplicar o filtro de produto ('' = todos, só permitido na lista)
  const comprasFiltradas = useMemo(
    () => (produtoFiltro ? compras.filter((c) => c.produtoId === produtoFiltro) : compras),
    [compras, produtoFiltro],
  )

  // Série para o gráfico: ordem cronológica (mais antiga → mais recente)
  const serie = useMemo(
    () => [...comprasFiltradas]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((c) => ({ data: formatarData(c.data, 'dd/MM'), preco: c.preco, quantidade: c.quantidade, unidade: c.unidade })),
    [comprasFiltradas],
  )

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IconHistory size={18} className="text-brand-blue" />
          <div>
            <h3 className="text-sm font-semibold text-white">Histórico de compras</h3>
            <p className="text-xs text-gray-500">{fornecedor.nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro por produto */}
          {produtos.length > 0 && (
            <select
              value={produtoFiltro}
              onChange={(e) => setProdutoFiltro(e.target.value)}
              title="Filtrar por produto"
              className="bg-dark-bg border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-blue transition-colors max-w-[200px]"
            >
              {modo === 'lista' && <option value="">Todos os produtos</option>}
              {produtos.map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>
          )}
          {/* Toggle lista / gráfico */}
          <div className="flex items-center gap-1 bg-dark-bg border border-dark-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setModo('lista')}
              title="Ver em lista"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                modo === 'lista' ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <IconList size={14} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setModo('grafico')}
              title="Ver em gráfico"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                modo === 'grafico' ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <IconChartLine size={14} />
              Gráfico
            </button>
          </div>
          <button
            type="button"
            onClick={onFechar}
            title="Fechar histórico"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="h-40 bg-dark-hover rounded-xl animate-pulse" />
      ) : comprasFiltradas.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-2 text-gray-500 text-center">
          <IconHistory size={28} className="text-gray-600" />
          <p className="text-sm">
            {compras.length === 0 ? 'Nenhuma compra registrada para este fornecedor.' : 'Nenhuma compra para o produto selecionado.'}
          </p>
        </div>
      ) : modo === 'lista' ? (
        <div className="bg-dark-bg border border-dark-border rounded-xl divide-y divide-dark-border/60 max-h-72 overflow-y-auto">
          {comprasFiltradas.map((c, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{c.produto}</p>
                <p className="text-xs text-gray-500">{formatarData(c.data)} · {formatarQuantidade(c.quantidade, c.unidade)}</p>
              </div>
              <span className="text-sm font-semibold text-brand-green whitespace-nowrap">{formatarMoeda(c.preco)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={serie} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="data" stroke="#6b7280" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                width={60}
                tickFormatter={(v) => formatarMoeda(Number(v))}
              />
              <Tooltip content={<TooltipGrafico />} />
              <Line type="monotone" dataKey="preco" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
