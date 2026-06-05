import { useState, useEffect, useMemo } from 'react'
import { IconDiscount2, IconLoader2, IconSearch, IconCheck, IconTrash } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import { normalizarBusca } from '../../utils/texto'
import { formatarData } from '../../utils/data'

interface ProdutoCusto {
  id: string
  codigo: string
  nome: string
  custo_unitario: number | null
  desconto: number | null
  desconto_inicio: string | null
  desconto_fim: string | null
}

type TipoDesconto = 'pct' | 'valor'

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Percentual a gravar (0–100). "Valor fixo" vira % do custo de cada produto.
function descontoPercentual(custo: number, tipo: TipoDesconto, valor: number): number {
  if (custo <= 0) return 0
  const pct = tipo === 'pct' ? valor : (valor / custo) * 100
  return Math.max(0, Math.min(100, Math.round(pct * 100) / 100))
}

function precoFinal(custo: number, pct: number): number {
  return Math.max(0, Math.round(custo * (1 - pct / 100) * 100) / 100)
}

function periodoLabel(ini: string | null, fim: string | null): string | null {
  if (ini && fim) return `${formatarData(ini)} – ${formatarData(fim)}`
  if (fim) return `até ${formatarData(fim)}`
  if (ini) return `a partir de ${formatarData(ini)}`
  return null
}

export function DescontosSection({ onAplicado }: { onAplicado?: () => void }) {
  const { mostrarToast } = useToast()
  const [produtos, setProdutos] = useState<ProdutoCusto[]>([])
  const [loading, setLoading] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState<TipoDesconto>('pct')
  const [valor, setValor] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [aplicando, setAplicando] = useState(false)

  async function carregar() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resp: { data: any[] | null; error: any } = await db
      .produtos()
      .select('id, codigo, nome, custo_unitario, desconto, desconto_inicio, desconto_fim')
      .order('nome')
    if (resp.error) resp = await db.produtos().select('id, codigo, nome, custo_unitario, desconto').order('nome')
    if (resp.error) resp = await db.produtos().select('id, codigo, nome, custo_unitario').order('nome')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lista = (resp.data ?? []).map((p: any) => ({
      ...p,
      desconto: p.desconto ?? 0,
      desconto_inicio: p.desconto_inicio ?? null,
      desconto_fim: p.desconto_fim ?? null,
    })) as ProdutoCusto[]
    setProdutos(lista)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const valorNum = paraNumero(valor)
  const temDesconto = valorNum > 0

  const filtrados = useMemo(() => {
    const q = normalizarBusca(busca.trim())
    if (!q) return produtos
    return produtos.filter((p) => normalizarBusca(`${p.codigo} ${p.nome}`).includes(q))
  }, [produtos, busca])

  const podeDescontar = (p: ProdutoCusto) => p.custo_unitario != null && p.custo_unitario > 0
  const alvos = produtos.filter((p) => selecionados.has(p.id) && podeDescontar(p))

  function alternar(id: string) {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  function selecionarFiltrados(marcar: boolean) {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      filtrados.forEach((p) => {
        if (!podeDescontar(p)) return
        if (marcar) novo.add(p.id)
        else novo.delete(p.id)
      })
      return novo
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function gravar(getUpdate: (p: ProdutoCusto) => Record<string, any>, msgOk: string) {
    setAplicando(true)
    const resultados = await Promise.all(
      alvos.map(async (p) => {
        const upd = getUpdate(p)
        let r = await db.produtos().update(upd).eq('id', p.id)
        // Se as colunas de data ainda não existem, grava só o percentual
        if (r.error && /desconto_(inicio|fim)/i.test(r.error.message)) {
          r = await db.produtos().update({ desconto: upd.desconto }).eq('id', p.id)
        }
        return r
      })
    )
    const erro = resultados.find((r) => r.error)?.error
    if (erro) {
      const msg = /column .*desconto/i.test(erro.message)
        ? 'A coluna de desconto não existe. Rode supabase/desconto.sql no Supabase.'
        : erro.message
      mostrarToast(`Erro: ${msg}`, 'erro')
    } else {
      mostrarToast(msgOk, 'sucesso')
      setSelecionados(new Set())
      setValor('')
      setDataInicio('')
      setDataFim('')
      carregar()
      onAplicado?.()
    }
    setAplicando(false)
  }

  async function aplicar() {
    if (alvos.length === 0) { mostrarToast('Selecione ao menos um produto com custo.', 'aviso'); return }
    if (!temDesconto) { mostrarToast('Informe um valor de desconto maior que zero.', 'aviso'); return }
    if (dataInicio && dataFim && dataInicio > dataFim) { mostrarToast('A data de início não pode ser depois do fim.', 'aviso'); return }
    const resumo = tipo === 'pct' ? `${valorNum}%` : formatBRL(valorNum)
    if (!confirm(`Aplicar desconto de ${resumo} a ${alvos.length} produto(s)?`)) return
    await gravar(
      (p) => ({
        desconto: descontoPercentual(p.custo_unitario!, tipo, valorNum),
        desconto_inicio: dataInicio || null,
        desconto_fim: dataFim || null,
      }),
      `Desconto aplicado a ${alvos.length} produto(s)!`
    )
  }

  async function remover() {
    if (alvos.length === 0) { mostrarToast('Selecione produtos para remover o desconto.', 'aviso'); return }
    if (!confirm(`Remover o desconto de ${alvos.length} produto(s)?`)) return
    await gravar(() => ({ desconto: 0, desconto_inicio: null, desconto_fim: null }), `Desconto removido de ${alvos.length} produto(s)!`)
  }

  const todosFiltradosMarcados =
    filtrados.filter(podeDescontar).every((p) => selecionados.has(p.id)) && filtrados.some(podeDescontar)

  const inputData = 'bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-purple'

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <IconDiscount2 size={20} className="text-brand-purple" />
        <div>
          <h3 className="text-base font-semibold text-white">Descontos</h3>
          <p className="text-xs text-gray-500">Aplique desconto a vários produtos — o custo original é preservado</p>
        </div>
      </div>

      {/* Tipo + valor + período */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo de desconto</label>
          <div className="flex items-center gap-1 bg-dark-bg border border-dark-border rounded-lg p-1">
            <button type="button" onClick={() => setTipo('pct')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tipo === 'pct' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-white'}`}>
              Porcentagem (%)
            </button>
            <button type="button" onClick={() => setTipo('valor')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tipo === 'valor' ? 'bg-brand-purple text-white' : 'text-gray-400 hover:text-white'}`}>
              Valor fixo (R$)
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            {tipo === 'pct' ? 'Percentual' : 'Valor'}
          </label>
          <div className="relative w-32">
            <input type="text" inputMode="decimal" value={valor}
              onChange={(e) => setValor(sanitizarNumero(e.target.value, true))}
              placeholder={tipo === 'pct' ? '10' : '0,00'}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-3 pr-10 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
              {tipo === 'pct' ? '%' : 'R$'}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Início <span className="text-gray-600">(opcional)</span></label>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className={inputData} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Fim <span className="text-gray-600">(opcional)</span></label>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className={inputData} />
        </div>
      </div>

      {/* Busca + selecionar todos */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <IconSearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple" />
        </div>
        <button type="button" onClick={() => selecionarFiltrados(!todosFiltradosMarcados)}
          className="text-xs font-semibold text-brand-purple hover:underline whitespace-nowrap">
          {todosFiltradosMarcados ? 'Limpar seleção' : 'Selecionar todos'}
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-11 bg-dark-hover rounded-lg" />)}
        </div>
      ) : (
        <div className="border border-dark-border rounded-xl divide-y divide-dark-border max-h-80 overflow-y-auto">
          {filtrados.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">Nenhum produto encontrado.</div>
          ) : (
            filtrados.map((p) => {
              const marcado = selecionados.has(p.id)
              const ok = podeDescontar(p)
              const custo = p.custo_unitario ?? 0
              const descAtual = p.desconto ?? 0
              const pctPrevia = ok && temDesconto ? descontoPercentual(custo, tipo, valorNum) : null
              const periodo = periodoLabel(p.desconto_inicio, p.desconto_fim)
              return (
                <label key={p.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${ok ? 'cursor-pointer hover:bg-dark-hover/40' : 'opacity-50 cursor-not-allowed'}`}>
                  <input type="checkbox" checked={marcado} disabled={!ok} onChange={() => alternar(p.id)}
                    className="w-4 h-4 accent-brand-purple shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{p.nome}</span>
                    <span className="text-xs text-gray-500 ml-2 font-mono">{p.codigo}</span>
                    {descAtual > 0 && (
                      <span className="ml-2 text-[10px] font-semibold text-brand-purple bg-brand-purple/15 px-1.5 py-0.5 rounded-full">−{descAtual}%</span>
                    )}
                    {periodo && <span className="ml-2 text-[10px] text-gray-500">{periodo}</span>}
                  </div>
                  <div className="text-right text-xs whitespace-nowrap">
                    {!ok ? (
                      <span className="text-gray-600">sem custo</span>
                    ) : descAtual > 0 ? (
                      <span>
                        <span className="text-gray-500 line-through mr-1.5">{formatBRL(custo)}</span>
                        <span className="text-gray-300">{formatBRL(precoFinal(custo, descAtual))}</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">{formatBRL(custo)}</span>
                    )}
                    {pctPrevia != null && marcado && (
                      <span className="text-brand-green font-semibold ml-2">→ {formatBRL(precoFinal(custo, pctPrevia))} (−{pctPrevia}%)</span>
                    )}
                  </div>
                </label>
              )
            })
          )}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500">{alvos.length} produto(s) selecionado(s)</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={remover} disabled={aplicando || alvos.length === 0}
            className="flex items-center gap-1.5 border border-dark-border text-gray-300 hover:text-white hover:bg-dark-hover text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <IconTrash size={15} />
            Remover desconto
          </button>
          <button type="button" onClick={aplicar} disabled={aplicando || alvos.length === 0 || !temDesconto}
            className="flex items-center gap-2 bg-brand-purple hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {aplicando ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />}
            Aplicar desconto
          </button>
        </div>
      </div>
    </div>
  )
}
