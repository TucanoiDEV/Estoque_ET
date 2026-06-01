import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DadoGrafico, DadoProdutoMovimentado } from '../../types'

interface Props {
  dadosMensais: DadoGrafico[]
  topProdutos: DadoProdutoMovimentado[]
  dadosAnuais: DadoGrafico[]
  dadosSaidas: DadoGrafico[]
  topVendidos: DadoProdutoMovimentado[]
  loading: boolean
}

// Tooltip personalizado para os gráficos de quantidade
function TooltipPersonalizado({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 shadow-xl text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">
        {payload[0]?.value?.toLocaleString('pt-BR')} unidades
      </p>
    </div>
  )
}

const CORES_ENTRADA = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']
const CORES_SAIDA = ['#ef4444', '#f97316', '#f59e0b', '#fb7185', '#e11d48']

// Lista de ranking em barras horizontais
function Ranking({ itens, cores, vazio }: { itens: DadoProdutoMovimentado[]; cores: string[]; vazio: string }) {
  if (itens.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">{vazio}</div>
  }
  const max = itens[0]?.movimentacoes ?? 1
  return (
    <div className="space-y-3">
      {itens.map((produto, idx) => {
        const pct = Math.round((produto.movimentacoes / max) * 100)
        return (
          <div key={produto.nome}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300 truncate max-w-[180px]">{produto.nome}</span>
              <span className="text-sm font-semibold text-white">
                {produto.movimentacoes.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: cores[idx % cores.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const eixoX = { dataKey: 'mes', tick: { fill: '#6b7280', fontSize: 12 }, axisLine: false, tickLine: false }
const eixoY = { tick: { fill: '#6b7280', fontSize: 11 }, axisLine: false, tickLine: false, width: 40 }

export function GraficosTab({ dadosMensais, topProdutos, dadosAnuais, dadosSaidas, topVendidos, loading }: Props) {
  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5 h-72 animate-pulse">
            <div className="h-4 bg-dark-hover rounded w-1/3 mb-6" />
            <div className="h-48 bg-dark-hover rounded" />
          </div>
        ))}
      </div>
    )
  }

  const semSaidas = dadosSaidas.every((d) => d.quantidade === 0)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Entradas mensais (6 meses) */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Entradas mensais</h3>
        <p className="text-xs text-gray-500 mb-5">Últimos 6 meses — unidades recebidas</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dadosMensais} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis {...eixoX} />
            <YAxis {...eixoY} />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#21262d' }} />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 produtos por entrada */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Top 5 produtos</h3>
        <p className="text-xs text-gray-500 mb-5">Mais movimentados por entrada (quantidade)</p>
        <Ranking itens={topProdutos} cores={CORES_ENTRADA} vazio="Nenhuma movimentação registrada" />
      </div>

      {/* Entradas anuais (12 meses) — gráfico de área, ocupa a linha toda */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2">
        <h3 className="text-sm font-semibold text-white mb-1">Entradas anuais</h3>
        <p className="text-xs text-gray-500 mb-5">Tendência dos últimos 12 meses — unidades recebidas</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dadosAnuais}>
            <defs>
              <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis {...eixoX} />
            <YAxis {...eixoY} />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#30363d' }} />
            <Area type="monotone" dataKey="quantidade" stroke="#3b82f6" strokeWidth={2} fill="url(#gradEntradas)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Saídas mensais (12 meses) — barras vermelhas */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Saídas mensais</h3>
        <p className="text-xs text-gray-500 mb-5">Últimos 12 meses — unidades que saíram</p>
        {semSaidas ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm text-center px-4">
            Nenhuma saída registrada ainda.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosSaidas} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis {...eixoX} />
              <YAxis {...eixoY} />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#21262d' }} />
              <Bar dataKey="quantidade" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Produtos mais vendidos (por saída) — barras horizontais */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Produtos mais vendidos</h3>
        <p className="text-xs text-gray-500 mb-5">Ranking por quantidade de saída</p>
        <Ranking itens={topVendidos} cores={CORES_SAIDA} vazio="Nenhuma saída registrada ainda" />
      </div>
    </div>
  )
}
