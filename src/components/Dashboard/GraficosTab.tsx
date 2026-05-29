import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as HBarChart,
  Cell,
} from 'recharts'
import type { DadoGrafico, DadoProdutoMovimentado } from '../../types'

interface Props {
  dadosMensais: DadoGrafico[]
  topProdutos: DadoProdutoMovimentado[]
  loading: boolean
}

// Tooltip personalizado para o gráfico de barras
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

const CORES_TOP = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']

export function GraficosTab({ dadosMensais, topProdutos, loading }: Props) {
  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5 h-72 animate-pulse">
            <div className="h-4 bg-dark-hover rounded w-1/3 mb-6" />
            <div className="h-48 bg-dark-hover rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Gráfico de entradas mensais */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Entradas mensais</h3>
        <p className="text-xs text-gray-500 mb-5">Últimos 6 meses — unidades recebidas</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dadosMensais} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#21262d' }} />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 produtos mais movimentados */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Top 5 produtos</h3>
        <p className="text-xs text-gray-500 mb-5">Mais movimentados (quantidade total)</p>

        {topProdutos.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Nenhuma movimentação registrada
          </div>
        ) : (
          <div className="space-y-3">
            {topProdutos.map((produto, idx) => {
              const max = topProdutos[0]?.movimentacoes ?? 1
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
                      style={{ width: `${pct}%`, backgroundColor: CORES_TOP[idx] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
