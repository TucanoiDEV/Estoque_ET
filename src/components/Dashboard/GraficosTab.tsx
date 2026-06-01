import { useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DadoGrafico, DadoProdutoMovimentado } from '../../types'

interface Props {
  entradas: { created_at: string; quantidade: number }[]
  saidas: { created_at: string; quantidade: number }[]
  topProdutos: DadoProdutoMovimentado[]
  topVendidos: DadoProdutoMovimentado[]
  loading: boolean
}

const OPCOES_PERIODO = [
  { label: '3M', meses: 3 },
  { label: '6M', meses: 6 },
  { label: '12M', meses: 12 },
  { label: '24M', meses: 24 },
]

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

function serieDiaria(
  registros: { created_at: string; quantidade: number }[],
  anoMes: string, // "YYYY-MM"
): DadoGrafico[] {
  const [ano, mes] = anoMes.split('-').map(Number)
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const resultado: DadoGrafico[] = []
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const chave = `${anoMes}-${String(dia).padStart(2, '0')}`
    const doDia = registros.filter((r) => r.created_at?.startsWith(chave))
    resultado.push({
      mes: String(dia).padStart(2, '0'),
      quantidade: doDia.reduce((acc, r) => acc + r.quantidade, 0),
      total: 0,
    })
  }
  return resultado
}

function serieIntervalo(
  registros: { created_at: string; quantidade: number }[],
  inicio: string,
  fim: string,
): DadoGrafico[] {
  if (!inicio || !fim || inicio > fim) return []
  const start = new Date(inicio + 'T00:00:00')
  const end = new Date(fim + 'T00:00:00')
  const diffDias = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
  const resultado: DadoGrafico[] = []

  if (diffDias <= 62) {
    for (let i = 0; i < diffDias; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const chave = d.toISOString().slice(0, 10)
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const doDia = registros.filter((r) => r.created_at?.startsWith(chave))
      resultado.push({
        mes: label,
        quantidade: doDia.reduce((acc, r) => acc + r.quantidade, 0),
        total: 0,
      })
    }
  } else {
    // Agrupamento mensal para intervalos longos
    const meses = new Map<string, number>()
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    const endMes = new Date(end.getFullYear(), end.getMonth(), 1)
    while (cur <= endMes) {
      const chave = cur.toISOString().slice(0, 7)
      const label = cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const qty = registros
        .filter((r) => r.created_at?.startsWith(chave))
        .reduce((acc, r) => acc + r.quantidade, 0)
      meses.set(label, qty)
      cur.setMonth(cur.getMonth() + 1)
    }
    meses.forEach((quantidade, mes) => resultado.push({ mes, quantidade, total: 0 }))
  }
  return resultado
}

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

type ModoSaidas = 'periodo' | 'mes' | 'intervalo'

function hojeStr() {
  return new Date().toISOString().slice(0, 10)
}

function mesAtualStr() {
  return new Date().toISOString().slice(0, 7)
}

function trintaDiasAtras() {
  const d = new Date()
  d.setDate(d.getDate() - 29)
  return d.toISOString().slice(0, 10)
}

export function GraficosTab({ entradas, saidas, topProdutos, topVendidos, loading }: Props) {
  const [periodoEntradas, setPeriodoEntradas] = useState(12)

  const [modoSaidas, setModoSaidas] = useState<ModoSaidas>('periodo')
  const [periodoSaidas, setPeriodoSaidas] = useState(12)
  const [mesSaidas, setMesSaidas] = useState(mesAtualStr)
  const [intervaloInicio, setIntervaloInicio] = useState(trintaDiasAtras)
  const [intervaloFim, setIntervaloFim] = useState(hojeStr)

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

  const dadosEntradaPeriodo = serieMensal(entradas, periodoEntradas)

  let dadosSaidasAtual: DadoGrafico[]
  let usarBarras = false
  if (modoSaidas === 'periodo') {
    dadosSaidasAtual = serieMensal(saidas, periodoSaidas)
  } else if (modoSaidas === 'mes') {
    dadosSaidasAtual = serieDiaria(saidas, mesSaidas)
    usarBarras = true
  } else {
    dadosSaidasAtual = serieIntervalo(saidas, intervaloInicio, intervaloFim)
    const diffDias = intervaloInicio && intervaloFim
      ? Math.ceil((new Date(intervaloFim).getTime() - new Date(intervaloInicio).getTime()) / 86400000) + 1
      : 0
    usarBarras = diffDias <= 62
  }

  const semSaidas = dadosSaidasAtual.every((d) => d.quantidade === 0)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Entradas por Período */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">Entradas por Período</h3>
          <div className="flex gap-1">
            {OPCOES_PERIODO.map((op) => (
              <button
                key={op.meses}
                onClick={() => setPeriodoEntradas(op.meses)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  periodoEntradas === op.meses
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-hover text-gray-400 hover:text-white'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Últimos {periodoEntradas} meses — unidades recebidas
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dadosEntradaPeriodo}>
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

      {/* Top 5 produtos por entrada */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Top 5 produtos</h3>
        <p className="text-xs text-gray-500 mb-5">Mais movimentados por entrada (quantidade)</p>
        <Ranking itens={topProdutos} cores={CORES_ENTRADA} vazio="Nenhuma movimentação registrada" />
      </div>

      {/* Saídas por Período */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2">
        <div className="flex flex-wrap items-start gap-3 justify-between mb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Saídas por Período</h3>
            {/* Seletor de modo */}
            <div className="flex gap-1">
              {(['periodo', 'mes', 'intervalo'] as ModoSaidas[]).map((modo) => {
                const labels: Record<ModoSaidas, string> = { periodo: 'Período', mes: 'Mês', intervalo: 'Intervalo' }
                return (
                  <button
                    key={modo}
                    onClick={() => setModoSaidas(modo)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                      modoSaidas === modo
                        ? 'bg-red-600 text-white'
                        : 'bg-dark-hover text-gray-400 hover:text-white'
                    }`}
                  >
                    {labels[modo]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Controles por modo */}
          {modoSaidas === 'periodo' && (
            <div className="flex gap-1">
              {OPCOES_PERIODO.map((op) => (
                <button
                  key={op.meses}
                  onClick={() => setPeriodoSaidas(op.meses)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    periodoSaidas === op.meses
                      ? 'bg-red-600 text-white'
                      : 'bg-dark-hover text-gray-400 hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          )}

          {modoSaidas === 'mes' && (
            <input
              type="month"
              value={mesSaidas}
              max={mesAtualStr()}
              onChange={(e) => setMesSaidas(e.target.value)}
              className="bg-dark-hover border border-dark-border text-gray-300 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-red-500"
            />
          )}

          {modoSaidas === 'intervalo' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={intervaloInicio}
                max={intervaloFim}
                onChange={(e) => setIntervaloInicio(e.target.value)}
                className="bg-dark-hover border border-dark-border text-gray-300 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-red-500"
              />
              <span className="text-gray-500 text-xs">até</span>
              <input
                type="date"
                value={intervaloFim}
                min={intervaloInicio}
                max={hojeStr()}
                onChange={(e) => setIntervaloFim(e.target.value)}
                className="bg-dark-hover border border-dark-border text-gray-300 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-red-500"
              />
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 mb-5">
          {modoSaidas === 'periodo' && `Últimos ${periodoSaidas} meses — unidades que saíram`}
          {modoSaidas === 'mes' && `Saídas diárias — ${new Date(mesSaidas + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`}
          {modoSaidas === 'intervalo' && `De ${intervaloInicio ? new Date(intervaloInicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'} até ${intervaloFim ? new Date(intervaloFim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}`}
        </p>

        {semSaidas ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm text-center px-4">
            Nenhuma saída registrada neste período.
          </div>
        ) : usarBarras ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dadosSaidasAtual} barSize={modoSaidas === 'mes' ? 14 : 18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis {...eixoX} />
              <YAxis {...eixoY} />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#21262d' }} />
              <Bar dataKey="quantidade" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dadosSaidasAtual}>
              <defs>
                <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis {...eixoX} />
              <YAxis {...eixoY} />
              <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#30363d' }} />
              <Area type="monotone" dataKey="quantidade" stroke="#ef4444" strokeWidth={2} fill="url(#gradSaidas)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Produtos mais vendidos (por saída) */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Produtos mais vendidos</h3>
        <p className="text-xs text-gray-500 mb-5">Ranking por quantidade de saída</p>
        <Ranking itens={topVendidos} cores={CORES_SAIDA} vazio="Nenhuma saída registrada ainda" />
      </div>
    </div>
  )
}
