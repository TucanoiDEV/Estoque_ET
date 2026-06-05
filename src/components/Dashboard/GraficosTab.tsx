import { useState, useRef, useEffect } from 'react'
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
  entradas: { data_recebimento: string; quantidade: number; produto?: { nome: string } | null }[]
  saidas: { data_saida: string; quantidade: number; produto?: { nome: string } | null }[]
  topProdutos: DadoProdutoMovimentado[]
  topVendidos: DadoProdutoMovimentado[]
  loading: boolean
}

// Registro normalizado para os gráficos: usa a DATA da movimentação (campo DATE,
// sem fuso) — não o created_at (timestamp UTC de inserção), que jogava a
// movimentação para o dia seguinte quando cadastrada à noite no Brasil (UTC-3).
interface RegistroData {
  data: string // 'YYYY-MM-DD'
  quantidade: number
  produto: string
}

export interface TopProduto {
  nome: string
  quantidade: number
}

// Top N produtos (por quantidade) de um conjunto de registros do mesmo período.
function topProdutosDe(registros: RegistroData[], n = 5): TopProduto[] {
  const mapa = new Map<string, number>()
  registros.forEach((r) => mapa.set(r.produto, (mapa.get(r.produto) ?? 0) + r.quantidade))
  return [...mapa.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, n)
}

// Chaves de agrupamento sempre no fuso LOCAL (evita o off-by-one do toISOString).
function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function chaveMes(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export type ModoGrafico = 'periodo' | 'mes' | 'intervalo'

const OPCOES_PERIODO = [
  { label: '3M', meses: 3, descricao: 'Exibe os últimos 3 meses' },
  { label: '6M', meses: 6, descricao: 'Exibe os últimos 6 meses' },
  { label: '12M', meses: 12, descricao: 'Exibe os últimos 12 meses' },
  { label: '24M', meses: 24, descricao: 'Exibe os últimos 24 meses' },
]

const LABELS_MODO: Record<ModoGrafico, string> = { periodo: 'Período', mes: 'Mês', intervalo: 'Intervalo' }

function serieMensal(registros: RegistroData[], meses: number): DadoGrafico[] {
  const resultado: DadoGrafico[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const chave = chaveMes(d)
    const nomeMes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    const doMes = registros.filter((r) => r.data?.startsWith(chave))
    resultado.push({ mes: nomeMes, quantidade: doMes.reduce((acc, r) => acc + r.quantidade, 0), total: 0, top: topProdutosDe(doMes) })
  }
  return resultado
}

function serieDiaria(registros: RegistroData[], anoMes: string): DadoGrafico[] {
  const [ano, mes] = anoMes.split('-').map(Number)
  const diasNoMes = new Date(ano, mes, 0).getDate()
  const resultado: DadoGrafico[] = []
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const chave = `${anoMes}-${String(dia).padStart(2, '0')}`
    const doDia = registros.filter((r) => r.data?.startsWith(chave))
    resultado.push({ mes: String(dia).padStart(2, '0'), quantidade: doDia.reduce((acc, r) => acc + r.quantidade, 0), total: 0, top: topProdutosDe(doDia) })
  }
  return resultado
}

function serieIntervalo(
  registros: RegistroData[],
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
      const chave = chaveDia(d)
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const doDia = registros.filter((r) => r.data?.startsWith(chave))
      resultado.push({ mes: label, quantidade: doDia.reduce((acc, r) => acc + r.quantidade, 0), total: 0, top: topProdutosDe(doDia) })
    }
  } else {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    const endMes = new Date(end.getFullYear(), end.getMonth(), 1)
    while (cur <= endMes) {
      const chave = chaveMes(cur)
      const label = cur.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const doMes = registros.filter((r) => r.data?.startsWith(chave))
      resultado.push({ mes: label, quantidade: doMes.reduce((acc, r) => acc + r.quantidade, 0), total: 0, top: topProdutosDe(doMes) })
      cur.setMonth(cur.getMonth() + 1)
    }
  }
  return resultado
}

export function hojeStr() { return chaveDia(new Date()) }
export function mesAtualStr() { return chaveMes(new Date()) }
export function trintaDiasAtras() {
  const d = new Date(); d.setDate(d.getDate() - 29); return chaveDia(d)
}

const NOMES_MES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const NOMES_MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const ICONE_PREV = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 12L6 8l4-4" />
  </svg>
)
const ICONE_NEXT = (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4l4 4-4 4" />
  </svg>
)

function SeletorMes({
  value,
  max,
  onChange,
  cor,
}: {
  value: string
  max: string
  onChange: (v: string) => void
  cor: 'blue' | 'red'
}) {
  const [aberto, setAberto] = useState(false)
  const [modoAno, setModoAno] = useState(false)
  const [anoVista, setAnoVista] = useState(() => parseInt(value.split('-')[0]))
  const [decadaBase, setDecadaBase] = useState(() => Math.floor(parseInt(value.split('-')[0]) / 12) * 12)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false)
        setModoAno(false)
      }
    }
    if (aberto) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [aberto])

  const [maxAno, maxMes] = max.split('-').map(Number)
  const [selAno, selMes] = value.split('-').map(Number)

  const ativoCls = cor === 'blue' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
  const label = `${NOMES_MES_LONGO[selMes - 1]} de ${selAno}`
  const anos = Array.from({ length: 12 }, (_, i) => decadaBase + i)

  function abrir() {
    setAnoVista(selAno)
    setDecadaBase(Math.floor(selAno / 12) * 12)
    setModoAno(false)
    setAberto((v) => !v)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrir}
        className="flex items-center gap-1.5 bg-dark-hover border border-dark-border text-gray-300 text-xs rounded-md px-2.5 py-1 hover:text-white transition-colors"
      >
        {label}
        <svg className="w-3 h-3 opacity-60" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-3 w-52">
          {modoAno ? (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={() => setDecadaBase((b) => b - 12)} className="text-gray-400 hover:text-white transition-colors p-1 rounded">
                  {ICONE_PREV}
                </button>
                <span className="text-sm font-semibold text-white">{decadaBase} – {decadaBase + 11}</span>
                <button
                  onClick={() => setDecadaBase((b) => b + 12)}
                  disabled={decadaBase + 12 > maxAno}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {ICONE_NEXT}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {anos.map((ano) => {
                  const futuro = ano > maxAno
                  const selecionado = ano === selAno || ano === anoVista
                  return (
                    <button
                      key={ano}
                      disabled={futuro}
                      onClick={() => { setAnoVista(ano); setModoAno(false) }}
                      className={`py-1.5 text-xs rounded-md font-medium transition-colors ${
                        futuro
                          ? 'text-gray-600 cursor-not-allowed'
                          : selecionado
                            ? ativoCls
                            : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                      }`}
                    >
                      {ano}
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={() => setAnoVista((a) => a - 1)} className="text-gray-400 hover:text-white transition-colors p-1 rounded">
                  {ICONE_PREV}
                </button>
                <button
                  onClick={() => { setDecadaBase(Math.floor(anoVista / 12) * 12); setModoAno(true) }}
                  className="text-sm font-semibold text-white hover:opacity-70 transition-opacity px-1"
                >
                  {anoVista}
                </button>
                <button
                  onClick={() => setAnoVista((a) => a + 1)}
                  disabled={anoVista >= maxAno}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {ICONE_NEXT}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {NOMES_MES_CURTO.map((m, idx) => {
                  const mesNum = idx + 1
                  const futuro = anoVista > maxAno || (anoVista === maxAno && mesNum > maxMes)
                  const selecionado = anoVista === selAno && mesNum === selMes
                  return (
                    <button
                      key={m}
                      disabled={futuro}
                      onClick={() => {
                        onChange(`${anoVista}-${String(mesNum).padStart(2, '0')}`)
                        setAberto(false)
                        setModoAno(false)
                      }}
                      className={`py-1.5 text-xs rounded-md font-medium transition-colors ${
                        futuro
                          ? 'text-gray-600 cursor-not-allowed'
                          : selecionado
                            ? ativoCls
                            : 'text-gray-400 hover:bg-dark-hover hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipPersonalizado({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const top: TopProduto[] = payload[0]?.payload?.top ?? []
  return (
    <div className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 shadow-xl text-sm max-w-[240px]">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0]?.value?.toLocaleString('pt-BR')} unidades</p>
      {top.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dark-border">
          <p className="text-[11px] text-gray-500 mb-1">Top 5 produtos do período</p>
          <ul className="space-y-0.5">
            {top.map((p, i) => (
              <li key={p.nome} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-gray-300 truncate">{i + 1}. {p.nome}</span>
                <span className="text-white font-semibold shrink-0">{p.quantidade.toLocaleString('pt-BR')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const CORES_ENTRADA = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b', '#ef4444']
const CORES_SAIDA = ['#ef4444', '#f97316', '#f59e0b', '#fb7185', '#e11d48']

function Ranking({ itens, cores, vazio }: { itens: DadoProdutoMovimentado[]; cores: string[]; vazio: string }) {
  if (itens.length === 0)
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">{vazio}</div>
  const max = itens[0]?.movimentacoes ?? 1
  return (
    <div className="space-y-3">
      {itens.map((produto, idx) => {
        const pct = Math.round((produto.movimentacoes / max) * 100)
        return (
          <div key={produto.nome}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300 truncate max-w-[180px]">{produto.nome}</span>
              <span className="text-sm font-semibold text-white">{produto.movimentacoes.toLocaleString('pt-BR')}</span>
            </div>
            <div className="h-2 bg-dark-hover rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cores[idx % cores.length] }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const eixoX = { dataKey: 'mes', tick: { fill: '#6b7280', fontSize: 12 }, axisLine: false, tickLine: false }
const eixoY = { tick: { fill: '#6b7280', fontSize: 11 }, axisLine: false, tickLine: false, width: 40 }

export interface GraficoState {
  modo: ModoGrafico
  periodo: number
  mes: string
  inicio: string
  fim: string
}

function usarBarrasParaModo(modo: ModoGrafico, inicio: string, fim: string): boolean {
  if (modo === 'mes') return true
  if (modo === 'intervalo') {
    if (!inicio || !fim) return false
    const diff = Math.ceil((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000) + 1
    return diff <= 62
  }
  return false
}

function calcularDados(
  registros: RegistroData[],
  state: GraficoState,
): DadoGrafico[] {
  if (state.modo === 'periodo') return serieMensal(registros, state.periodo)
  if (state.modo === 'mes') return serieDiaria(registros, state.mes)
  return serieIntervalo(registros, state.inicio, state.fim)
}

function subtitulo(state: GraficoState, tipo: 'entradas' | 'saidas'): string {
  const unidade = tipo === 'entradas' ? 'unidades recebidas' : 'unidades que saíram'
  if (state.modo === 'periodo') return `Últimos ${state.periodo} meses — ${unidade}`
  if (state.modo === 'mes') {
    const label = new Date(state.mes + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return `${tipo === 'entradas' ? 'Entradas' : 'Saídas'} diárias — ${label}`
  }
  const ini = state.inicio ? new Date(state.inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const fim = state.fim ? new Date(state.fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'
  return `De ${ini} até ${fim}`
}

export function BotoesModo({
  state,
  cor,
  onChange,
}: {
  state: GraficoState
  cor: 'blue' | 'red'
  onChange: (patch: Partial<GraficoState>) => void
}) {
  const ativo = cor === 'blue' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
  return (
    <div className="flex gap-1">
      {(['periodo', 'mes', 'intervalo'] as ModoGrafico[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange({ modo: m })}
          className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${state.modo === m ? ativo : 'bg-dark-hover text-gray-400 hover:text-white'}`}
        >
          {LABELS_MODO[m]}
        </button>
      ))}
    </div>
  )
}

export function ControleSecundario({
  state,
  cor,
  onChange,
}: {
  state: GraficoState
  cor: 'blue' | 'red'
  onChange: (patch: Partial<GraficoState>) => void
}) {
  const ativo = cor === 'blue' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
  const foco = cor === 'blue' ? 'focus:border-blue-500' : 'focus:border-red-500'
  const inputCls = `bg-dark-hover border border-dark-border text-gray-300 text-xs rounded-md px-2.5 py-1 focus:outline-none ${foco}`

  if (state.modo === 'periodo') {
    return (
      <div className="flex gap-1">
        {OPCOES_PERIODO.map((op) => (
          <div key={op.meses} className="relative group">
            <button
              onClick={() => onChange({ periodo: op.meses })}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${state.periodo === op.meses ? ativo : 'bg-dark-hover text-gray-400 hover:text-white'}`}
            >
              {op.label}
            </button>
            <div
              role="tooltip"
              className="pointer-events-none absolute top-full right-0 mt-2 z-50 whitespace-nowrap rounded-md border border-dark-border bg-dark-card px-2.5 py-1.5 text-xs text-gray-300 shadow-xl opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0"
            >
              {op.descricao}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (state.modo === 'mes') {
    return (
      <SeletorMes
        value={state.mes}
        max={mesAtualStr()}
        onChange={(v) => onChange({ mes: v })}
        cor={cor}
      />
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={state.inicio}
        max={state.fim}
        onChange={(e) => onChange({ inicio: e.target.value })}
        className={inputCls}
      />
      <span className="text-gray-500 text-xs">até</span>
      <input
        type="date"
        value={state.fim}
        min={state.inicio}
        max={hojeStr()}
        onChange={(e) => onChange({ fim: e.target.value })}
        className={inputCls}
      />
    </div>
  )
}

function GraficoArea({ dados, cor, gradId }: { dados: DadoGrafico[]; cor: string; gradId: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={dados}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={cor} stopOpacity={0.4} />
            <stop offset="95%" stopColor={cor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
        <XAxis {...eixoX} />
        <YAxis {...eixoY} />
        <Tooltip content={<TooltipPersonalizado />} cursor={{ stroke: '#30363d' }} />
        <Area type="monotone" dataKey="quantidade" stroke={cor} strokeWidth={2} fill={`url(#${gradId})`} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function GraficoBarras({ dados, cor, barSize }: { dados: DadoGrafico[]; cor: string; barSize: number }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} barSize={barSize}>
        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
        <XAxis {...eixoX} />
        <YAxis {...eixoY} />
        <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: '#21262d' }} />
        <Bar dataKey="quantidade" fill={cor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function GraficosTab({ entradas, saidas, topProdutos, topVendidos, loading }: Props) {
  const [stateEntradas, setStateEntradas] = useState<GraficoState>({
    modo: 'periodo', periodo: 12, mes: mesAtualStr(), inicio: trintaDiasAtras(), fim: hojeStr(),
  })
  const [stateSaidas, setStateSaidas] = useState<GraficoState>({
    modo: 'periodo', periodo: 12, mes: mesAtualStr(), inicio: trintaDiasAtras(), fim: hojeStr(),
  })

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

  // Normaliza para a data da movimentação (entrada = recebimento, saída = saída)
  const dadosEntradas = calcularDados(entradas.map((e) => ({ data: e.data_recebimento, quantidade: e.quantidade, produto: e.produto?.nome ?? 'Desconhecido' })), stateEntradas)
  const dadosSaidas = calcularDados(saidas.map((s) => ({ data: s.data_saida, quantidade: s.quantidade, produto: s.produto?.nome ?? 'Desconhecido' })), stateSaidas)
  const barrasEntradas = usarBarrasParaModo(stateEntradas.modo, stateEntradas.inicio, stateEntradas.fim)
  const barrasSaidas = usarBarrasParaModo(stateSaidas.modo, stateSaidas.inicio, stateSaidas.fim)
  const semEntradas = dadosEntradas.every((d) => d.quantidade === 0)
  const semSaidas = dadosSaidas.every((d) => d.quantidade === 0)

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Entradas por Período */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Entradas por Período</h3>
            <BotoesModo state={stateEntradas} cor="blue" onChange={(p) => setStateEntradas((s) => ({ ...s, ...p }))} />
          </div>
          <ControleSecundario state={stateEntradas} cor="blue" onChange={(p) => setStateEntradas((s) => ({ ...s, ...p }))} />
        </div>
        <p className="text-xs text-gray-500 mb-5">{subtitulo(stateEntradas, 'entradas')}</p>
        {semEntradas ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm text-center px-4">
            Nenhuma entrada registrada neste período.
          </div>
        ) : barrasEntradas ? (
          <GraficoBarras dados={dadosEntradas} cor="#3b82f6" barSize={stateEntradas.modo === 'mes' ? 14 : 18} />
        ) : (
          <GraficoArea dados={dadosEntradas} cor="#3b82f6" gradId="gradEntradas" />
        )}
      </div>

      {/* Saídas por Período */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3 justify-between mb-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-white">Saídas por Período</h3>
            <BotoesModo state={stateSaidas} cor="red" onChange={(p) => setStateSaidas((s) => ({ ...s, ...p }))} />
          </div>
          <ControleSecundario state={stateSaidas} cor="red" onChange={(p) => setStateSaidas((s) => ({ ...s, ...p }))} />
        </div>
        <p className="text-xs text-gray-500 mb-5">{subtitulo(stateSaidas, 'saidas')}</p>
        {semSaidas ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm text-center px-4">
            Nenhuma saída registrada neste período.
          </div>
        ) : barrasSaidas ? (
          <GraficoBarras dados={dadosSaidas} cor="#ef4444" barSize={stateSaidas.modo === 'mes' ? 14 : 18} />
        ) : (
          <GraficoArea dados={dadosSaidas} cor="#ef4444" gradId="gradSaidas" />
        )}
      </div>

      {/* Top 5 produtos por entrada */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Top 5 produtos</h3>
        <p className="text-xs text-gray-500 mb-5">Mais movimentados por entrada (quantidade)</p>
        <Ranking itens={topProdutos} cores={CORES_ENTRADA} vazio="Nenhuma movimentação registrada" />
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
