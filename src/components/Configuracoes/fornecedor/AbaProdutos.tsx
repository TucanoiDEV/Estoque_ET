import { useState, useEffect, useMemo } from 'react'
import { IconPackage, IconSearch, IconPlus, IconTrash, IconLoader2, IconLink } from '@tabler/icons-react'
import { db } from '../../../services/supabase'
import { useToast } from '../../shared/Toast'
import { formatarMoeda } from '../../../utils/numero'
import { formatarData } from '../../../utils/data'

interface ProdutoBasico {
  id: string
  codigo: string
  nome: string
  unidade: string
}

interface Vinculo {
  id: string
  produto_id: string
  produto: ProdutoBasico | null
}

interface UltimaCompra {
  preco: number | null
  data: string
}

interface Props {
  fornecedorId: string | null
}

export function AbaProdutos({ fornecedorId }: Props) {
  const { mostrarToast } = useToast()
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [produtos, setProdutos] = useState<ProdutoBasico[]>([])
  const [historico, setHistorico] = useState<Record<string, UltimaCompra>>({})
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [acao, setAcao] = useState<string | null>(null) // id em operação (link/unlink)

  async function carregar(id: string) {
    setLoading(true)
    const [vinc, prods, ents] = await Promise.all([
      db.fornecedorProdutos().select('id, produto_id, produto:produtos(id, codigo, nome, unidade)').eq('fornecedor_id', id),
      db.produtos().select('id, codigo, nome, unidade').order('nome'),
      db.entradas().select('produto_id, custo_unitario, data_recebimento').eq('fornecedor_id', id).order('data_recebimento', { ascending: false }),
    ])

    setVinculos((vinc.data as unknown as Vinculo[]) ?? [])
    setProdutos((prods.data as ProdutoBasico[]) ?? [])

    // Último preço/data por produto = primeira ocorrência (já ordenado desc por data)
    const hist: Record<string, UltimaCompra> = {}
    for (const e of (ents.data as { produto_id: string; custo_unitario: number | null; data_recebimento: string }[]) ?? []) {
      if (!hist[e.produto_id]) hist[e.produto_id] = { preco: e.custo_unitario, data: e.data_recebimento }
    }
    setHistorico(hist)
    setLoading(false)
  }

  useEffect(() => {
    if (fornecedorId) carregar(fornecedorId)
    else setLoading(false)
  }, [fornecedorId])

  const idsVinculados = useMemo(() => new Set(vinculos.map((v) => v.produto_id)), [vinculos])

  // Resultados da busca: produtos ainda não vinculados que casam com o texto
  const resultados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return []
    return produtos
      .filter((p) => !idsVinculados.has(p.id))
      .filter((p) => p.nome.toLowerCase().includes(termo) || p.codigo.toLowerCase().includes(termo))
      .slice(0, 6)
  }, [busca, produtos, idsVinculados])

  async function vincular(produtoId: string) {
    if (!fornecedorId) return
    setAcao(produtoId)
    const { error } = await db.fornecedorProdutos().insert({ fornecedor_id: fornecedorId, produto_id: produtoId })
    if (error) mostrarToast(`Erro ao vincular: ${error.message}`, 'erro')
    else { setBusca(''); await carregar(fornecedorId) }
    setAcao(null)
  }

  async function remover(vinculo: Vinculo) {
    if (!fornecedorId) return
    setAcao(vinculo.id)
    const { error } = await db.fornecedorProdutos().delete().eq('id', vinculo.id)
    if (error) mostrarToast(`Erro ao remover: ${error.message}`, 'erro')
    else { mostrarToast('Vínculo removido.', 'sucesso'); await carregar(fornecedorId) }
    setAcao(null)
  }

  if (!fornecedorId) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-gray-500 text-center">
        <IconLink size={32} className="text-gray-600" />
        <p className="text-sm max-w-xs">Salve o cadastro do fornecedor para vincular produtos a ele.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca para vincular */}
      <div className="relative">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar produto para vincular..."
          className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
        />
        {resultados.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-dark-card border border-dark-border rounded-lg shadow-xl overflow-hidden">
            {resultados.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => vincular(p.id)}
                disabled={acao === p.id}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-dark-hover transition-colors disabled:opacity-50"
              >
                <span className="text-sm text-white">
                  {p.nome} <span className="font-mono text-xs text-gray-500">{p.codigo}</span>
                </span>
                {acao === p.id ? <IconLoader2 size={15} className="animate-spin text-brand-blue" /> : <IconPlus size={15} className="text-brand-blue" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de produtos vinculados */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-dark-hover rounded-lg" />)}
        </div>
      ) : vinculos.length === 0 ? (
        <div className="py-10 flex flex-col items-center gap-3 text-gray-500 text-center">
          <IconPackage size={30} className="text-gray-600" />
          <p className="text-sm">Nenhum produto vinculado a este fornecedor ainda.</p>
        </div>
      ) : (
        <div className="bg-dark-bg border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Produto', 'Último preço pago', 'Última compra', ''].map((c) => (
                  <th key={c} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vinculos.map((v) => {
                const h = historico[v.produto_id]
                return (
                  <tr key={v.id} className="border-b border-dark-border/50 last:border-0 hover:bg-dark-hover/40">
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{v.produto?.nome ?? '—'}</span>{' '}
                      <span className="font-mono text-xs text-gray-500">{v.produto?.codigo ?? ''}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{h?.preco != null ? formatarMoeda(h.preco) : <span className="text-gray-600">Sem compras</span>}</td>
                    <td className="px-4 py-3 text-gray-400">{h?.data ? formatarData(h.data) : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remover(v)}
                        disabled={acao === v.id}
                        title="Remover vínculo"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors disabled:opacity-40"
                      >
                        {acao === v.id ? <IconLoader2 size={15} className="animate-spin" /> : <IconTrash size={15} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
