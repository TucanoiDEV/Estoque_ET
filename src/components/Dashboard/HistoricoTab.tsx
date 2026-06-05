import { useState, useMemo } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconFilter,
  IconX,
} from '@tabler/icons-react'
import { formatarData } from '../../utils/data'
import type { Entrada, Produto, Saida } from '../../types'

interface Props {
  entradas: Entrada[]
  saidas: Saida[]
  produtos: Produto[]
  loading: boolean
}

type TipoRegistro = 'entrada' | 'saida' | 'cadastro'

interface RegistroUnificado {
  id: string
  tipo: TipoRegistro
  data: string
  criadoEm: string // created_at completo — desempate por hora da ação no mesmo dia
  produto: string
  fornecedor: string
  motivo: string
  quantidade: number | null
  unidade: string // unidade de medida do produto (UN, KG, L...)
  total: number | null
}

interface Filtros {
  tipo: 'todos' | TipoRegistro
  dataInicio: string
  dataFim: string
  produto: string
  fornecedor: string
  motivo: string
}

type ColOrdem = 'tipo' | 'data' | 'produto' | 'fornecedor' | 'motivo' | 'quantidade' | 'total'
type DirOrdem = 'asc' | 'desc'

interface FiltroPopover {
  col: ColOrdem
  top: number
  left: number
}

const ITENS_POR_PAGINA = 10

// Marca a entrada gerada pelo estoque inicial do cadastro (ver NovoProdutoModal).
// No histórico ela não vira uma linha de "Entrada" separada: a quantidade é
// dobrada na própria linha de "Cadastro" do produto.
const MARCADOR_ESTOQUE_INICIAL = 'Estoque inicial do cadastro'

const badgeTipo: Record<TipoRegistro, string> = {
  entrada: 'bg-brand-green/15 text-brand-green',
  saida: 'bg-brand-red/15 text-brand-red',
  cadastro: 'bg-brand-blue/15 text-brand-blue',
}

const labelTipo: Record<TipoRegistro, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  cadastro: 'Cadastro',
}

const corFiltroTipo: Record<Filtros['tipo'], string> = {
  todos: 'bg-brand-blue/20 text-brand-blue',
  entrada: 'bg-brand-green/20 text-brand-green',
  saida: 'bg-brand-red/20 text-brand-red',
  cadastro: 'bg-brand-blue/20 text-brand-blue',
}

const inputCls =
  'w-full text-xs bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-brand-blue/50'

const COLUNAS_FILTRAVELIS: ColOrdem[] = ['data', 'produto', 'fornecedor', 'motivo']
const COLUNAS_ORDENAVEIS: ColOrdem[] = ['data', 'fornecedor', 'quantidade', 'total']

export function HistoricoTab({ entradas, saidas, produtos, loading }: Props) {
  const [filtros, setFiltros] = useState<Filtros>({
    tipo: 'todos',
    dataInicio: '',
    dataFim: '',
    produto: '',
    fornecedor: '',
    motivo: '',
  })
  const [ordemCol, setOrdemCol] = useState<ColOrdem>('data')
  const [ordemDir, setOrdemDir] = useState<DirOrdem>('desc')
  const [pagina, setPagina] = useState(1)
  const [filtroPopover, setFiltroPopover] = useState<FiltroPopover | null>(null)

  function atualizar<K extends keyof Filtros>(chave: K, valor: Filtros[K]) {
    setFiltros((f) => ({ ...f, [chave]: valor }))
    setPagina(1)
  }

  function ordenarPor(col: ColOrdem) {
    if (ordemCol === col) {
      setOrdemDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOrdemCol(col)
      setOrdemDir('asc')
    }
    setPagina(1)
  }

  function abrirFiltro(e: React.MouseEvent<HTMLButtonElement>, col: ColOrdem) {
    e.stopPropagation()
    if (filtroPopover?.col === col) {
      setFiltroPopover(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setFiltroPopover({ col, top: rect.bottom + 6, left: rect.left })
  }

  function temFiltroAtivo(col: ColOrdem): boolean {
    switch (col) {
      case 'data': return !!(filtros.dataInicio || filtros.dataFim)
      case 'produto': return !!filtros.produto
      case 'fornecedor': return !!filtros.fornecedor
      case 'motivo': return !!filtros.motivo
      default: return false
    }
  }

  function limparFiltro(col: ColOrdem) {
    switch (col) {
      case 'data':
        atualizar('dataInicio', '')
        atualizar('dataFim', '')
        break
      case 'produto': atualizar('produto', ''); break
      case 'fornecedor': atualizar('fornecedor', ''); break
      case 'motivo': atualizar('motivo', ''); break
    }
  }

  const registros: RegistroUnificado[] = useMemo(() => {
    // Fornecedor por produto (a partir do cadastro do produto) — usado como
    // fallback nas entradas/saídas, cujo registro pode não ter fornecedor próprio
    const fornecedorPorProduto = new Map<string, string>()
    produtos.forEach((p) => {
      if (p.fornecedor?.nome) fornecedorPorProduto.set(p.id, p.fornecedor.nome)
    })

    // Entradas de "estoque inicial" (do cadastro): mapeadas por produto para
    // serem mostradas na linha de Cadastro, e excluídas das linhas de Entrada.
    const inicialPorProduto = new Map<string, { quantidade: number; total: number | null }>()
    entradas.forEach((en) => {
      if (en.observacoes === MARCADOR_ESTOQUE_INICIAL) {
        inicialPorProduto.set(en.produto_id, { quantidade: en.quantidade, total: en.total })
      }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e: RegistroUnificado[] = entradas
      .filter((en) => en.observacoes !== MARCADOR_ESTOQUE_INICIAL)
      .map((en) => ({
        id: en.id,
        tipo: 'entrada' as const,
        data: en.data_recebimento.slice(0, 10),
        criadoEm: en.created_at,
        produto: (en.produto as any)?.nome ?? '—',
        // Só o fornecedor escolhido na própria entrada; sem fallback para o
        // fornecedor cadastrado no produto (senão aparece um "aleatório").
        fornecedor: (en.fornecedor as any)?.nome ?? '—',
        motivo: '—',
        quantidade: en.quantidade,
        unidade: (en.produto as any)?.unidade ?? '',
        total: en.total,
      }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s: RegistroUnificado[] = saidas.map((sa) => ({
      id: sa.id,
      tipo: 'saida' as const,
      data: sa.data_saida.slice(0, 10),
      criadoEm: sa.created_at,
      produto: (sa.produto as any)?.nome ?? '—',
      fornecedor: fornecedorPorProduto.get(sa.produto_id) ?? '—',
      motivo: sa.motivo ?? '—',
      quantidade: sa.quantidade,
      unidade: (sa.produto as any)?.unidade ?? '',
      total: sa.total ?? null,
    }))
    const c: RegistroUnificado[] = produtos.map((p) => {
      const inicial = inicialPorProduto.get(p.id)
      return {
        id: p.id,
        tipo: 'cadastro' as const,
        data: p.created_at.slice(0, 10),
        criadoEm: p.created_at,
        produto: p.nome,
        fornecedor: p.fornecedor?.nome ?? '—',
        motivo: '—',
        quantidade: inicial?.quantidade ?? null,
        unidade: p.unidade ?? '',
        total: inicial?.total ?? null,
      }
    })
    // Mais recente primeiro: por data e, no mesmo dia, pela hora da ação (created_at)
    return [...e, ...s, ...c].sort(
      (a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm),
    )
  }, [entradas, saidas, produtos])

  // Opções distintas para os filtros suspensos (ignora o placeholder "—")
  const fornecedoresDisponiveis = useMemo(
    () => [...new Set(registros.map((r) => r.fornecedor).filter((f) => f && f !== '—'))].sort(),
    [registros]
  )
  const motivosDisponiveis = useMemo(
    () => [...new Set(registros.map((r) => r.motivo).filter((m) => m && m !== '—'))].sort(),
    [registros]
  )

  const filtrados = useMemo(() => {
    const lista = registros.filter((r) => {
      if (filtros.tipo !== 'todos' && r.tipo !== filtros.tipo) return false
      if (filtros.dataInicio && r.data < filtros.dataInicio) return false
      if (filtros.dataFim && r.data > filtros.dataFim) return false
      if (filtros.produto && !r.produto.toLowerCase().includes(filtros.produto.toLowerCase())) return false
      if (filtros.fornecedor && r.fornecedor !== filtros.fornecedor) return false
      if (filtros.motivo && r.motivo !== filtros.motivo) return false
      return true
    })

    const mult = ordemDir === 'asc' ? 1 : -1
    lista.sort((a, b) => {
      switch (ordemCol) {
        case 'tipo': return mult * a.tipo.localeCompare(b.tipo)
        case 'data': return mult * (a.data.localeCompare(b.data) || a.criadoEm.localeCompare(b.criadoEm))
        case 'produto': return mult * a.produto.localeCompare(b.produto)
        case 'fornecedor': return mult * a.fornecedor.localeCompare(b.fornecedor)
        case 'motivo': return mult * a.motivo.localeCompare(b.motivo)
        case 'quantidade': return mult * ((a.quantidade ?? 0) - (b.quantidade ?? 0))
        case 'total': return mult * ((a.total ?? 0) - (b.total ?? 0))
        default: return 0
      }
    })
    return lista
  }, [registros, filtros, ordemCol, ordemDir])

  const totalPaginas = Math.ceil(filtrados.length / ITENS_POR_PAGINA)
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const itensPagina = filtrados.slice(inicio, inicio + ITENS_POR_PAGINA)

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden animate-pulse">
        <div className="h-14 bg-dark-hover" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-t border-dark-border px-5 flex items-center gap-4">
            <div className="h-3 bg-dark-hover rounded flex-1" />
            <div className="h-3 bg-dark-hover rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        {/* Cabeçalho com filtro de tipo */}
        <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-white">Histórico de movimentações</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {filtrados.length} de {registros.length} registros
            </p>
          </div>
          <div className="flex gap-1">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'entrada', label: 'Entradas' },
                { id: 'saida', label: 'Saídas' },
                { id: 'cadastro', label: 'Cadastros' },
              ] as { id: Filtros['tipo']; label: string }[]
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => atualizar('tipo', id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                  filtros.tipo === id
                    ? corFiltroTipo[id]
                    : 'text-gray-400 hover:text-white bg-dark-hover'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {(
                  [
                    { id: 'tipo', label: 'Tipo' },
                    { id: 'data', label: 'Data' },
                    { id: 'produto', label: 'Produto' },
                    { id: 'fornecedor', label: 'Fornecedor' },
                    { id: 'motivo', label: 'Motivo' },
                    { id: 'quantidade', label: 'Qtd.' },
                    { id: 'total', label: 'Total' },
                  ] as { id: ColOrdem; label: string }[]
                ).map(({ id, label }) => {
                  const ativo = ordemCol === id
                  const ordenavel = COLUNAS_ORDENAVEIS.includes(id)
                  const filtravel = COLUNAS_FILTRAVELIS.includes(id)
                  const filtroAtivo = temFiltroAtivo(id)
                  const popoverAberto = filtroPopover?.col === id

                  return (
                    <th key={id} className="px-5 py-3 text-left whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {ordenavel ? (
                          <button
                            onClick={() => ordenarPor(id)}
                            className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                              ativo ? 'text-brand-blue' : 'text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            {label}
                            {ativo ? (
                              ordemDir === 'asc' ? (
                                <IconArrowUp size={12} />
                              ) : (
                                <IconArrowDown size={12} />
                              )
                            ) : (
                              <IconArrowsSort size={12} className="opacity-40" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {label}
                          </span>
                        )}
                        {filtravel && (
                          <button
                            onClick={(e) => abrirFiltro(e, id)}
                            title="Filtrar"
                            className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${
                              filtroAtivo || popoverAberto
                                ? 'text-brand-blue bg-brand-blue/15'
                                : 'text-gray-600 hover:text-gray-300 hover:bg-dark-hover'
                            }`}
                          >
                            <IconFilter size={11} />
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {itensPagina.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-500 text-sm">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                itensPagina.map((r) => (
                  <tr
                    key={`${r.tipo}-${r.id}`}
                    className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeTipo[r.tipo]}`}
                      >
                        {labelTipo[r.tipo]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">
                      {formatarData(r.data)}
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">{r.produto}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{r.fornecedor}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{r.motivo}</td>
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">
                      {r.quantidade != null ? (
                        <>
                          {r.quantidade.toLocaleString('pt-BR')}
                          {r.unidade && <span className="text-gray-500 text-xs ml-1">{r.unidade}</span>}
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-white font-semibold">
                      {r.total
                        ? r.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-dark-border">
            <span className="text-xs text-gray-500">
              Página {pagina} de {totalPaginas}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagina) <= 2)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      p === pagina
                        ? 'bg-brand-blue text-white'
                        : 'text-gray-400 hover:text-white hover:bg-dark-hover'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <IconChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Overlay para fechar o popover clicando fora */}
      {filtroPopover && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setFiltroPopover(null)}
        />
      )}

      {/* Popover de filtro flutuante */}
      {filtroPopover && (
        <div
          className="fixed z-20 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-3 min-w-[200px]"
          style={{ top: filtroPopover.top, left: filtroPopover.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {filtroPopover.col === 'data' && 'Filtrar por data'}
              {filtroPopover.col === 'produto' && 'Filtrar produto'}
              {filtroPopover.col === 'fornecedor' && 'Filtrar fornecedor'}
              {filtroPopover.col === 'motivo' && 'Filtrar motivo'}
            </span>
            <div className="flex gap-1">
              {temFiltroAtivo(filtroPopover.col) && (
                <button
                  onClick={() => limparFiltro(filtroPopover.col)}
                  className="text-xs text-gray-500 hover:text-brand-red transition-colors px-1"
                  title="Limpar filtro"
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => setFiltroPopover(null)}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-500 hover:text-white hover:bg-dark-hover transition-colors"
              >
                <IconX size={12} />
              </button>
            </div>
          </div>

          {filtroPopover.col === 'data' && (
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-xs text-gray-600 block mb-1">De</label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => atualizar('dataInicio', e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Até</label>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => atualizar('dataFim', e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          )}

          {filtroPopover.col === 'produto' && (
            <input
              type="text"
              value={filtros.produto}
              onChange={(e) => atualizar('produto', e.target.value)}
              placeholder="Buscar produto..."
              className={inputCls}
              autoFocus
            />
          )}

          {filtroPopover.col === 'fornecedor' && (
            <select
              value={filtros.fornecedor}
              onChange={(e) => atualizar('fornecedor', e.target.value)}
              className={inputCls}
              autoFocus
            >
              <option value="">Todos</option>
              {fornecedoresDisponiveis.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          )}

          {filtroPopover.col === 'motivo' && (
            <select
              value={filtros.motivo}
              onChange={(e) => atualizar('motivo', e.target.value)}
              className={inputCls}
              autoFocus
            >
              <option value="">Todos</option>
              {motivosDisponiveis.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  )
}
