import { useState, useMemo } from 'react'
import { IconEdit, IconTrash, IconLoader2, IconPackageOff } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../shared/Toast'
import { FiltrosEstoque } from './FiltrosEstoque'
import type { ProdutoComEstoque, StatusEstoque, FiltrosEstoque as FiltrosType } from '../../types'

interface Props {
  produtos: ProdutoComEstoque[]
  loading: boolean
  onRecarregar: () => void
}

const badgeStatus: Record<StatusEstoque, { classes: string; label: string }> = {
  normal: { classes: 'bg-brand-green/15 text-brand-green', label: 'Normal' },
  baixo: { classes: 'bg-brand-yellow/15 text-brand-yellow', label: 'Baixo' },
  critico: { classes: 'bg-brand-red/15 text-brand-red', label: 'Crítico' },
}

interface ModalEdicaoProps {
  produto: ProdutoComEstoque
  onFechar: () => void
  onSalvar: () => void
}

function ModalEdicao({ produto, onFechar, onSalvar }: ModalEdicaoProps) {
  const { mostrarToast } = useToast()
  const [nome, setNome] = useState(produto.nome)
  const [categoria, setCategoria] = useState(produto.categoria ?? '')
  const [estoqueMinimo, setEstoqueMinimo] = useState(produto.estoque_minimo)
  const [custoUnitario, setCustoUnitario] = useState(produto.custo_unitario ?? 0)
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    const { error } = await db.produtos().update({
      nome,
      categoria,
      estoque_minimo: estoqueMinimo,
      custo_unitario: custoUnitario,
    }).eq('id', produto.id)

    if (error) {
      mostrarToast('Erro ao salvar produto.', 'erro')
    } else {
      mostrarToast('Produto atualizado com sucesso!', 'sucesso')
      onSalvar()
    }
    setSalvando(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-bold text-white mb-5">Editar produto</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Código</label>
            <input
              value={produto.codigo}
              disabled
              className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Categoria</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Estoque mínimo</label>
              <input
                type="number"
                min={0}
                value={estoqueMinimo}
                onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Custo unit. (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onFechar}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando && <IconLoader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

export function TabelaEstoque({ produtos, loading, onRecarregar }: Props) {
  const { canEdit, canDelete } = usePermissions()
  const { mostrarToast } = useToast()
  const [produtoEditando, setProdutoEditando] = useState<ProdutoComEstoque | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<FiltrosType>({ busca: '', categoria: '', status: 'todos' })

  // Extrai categorias únicas
  const categorias = useMemo(
    () => [...new Set(produtos.map((p) => p.categoria).filter(Boolean) as string[])].sort(),
    [produtos]
  )

  // Aplica filtros
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const buscaOk =
        !filtros.busca ||
        p.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        p.codigo.toLowerCase().includes(filtros.busca.toLowerCase())
      const categoriaOk = !filtros.categoria || p.categoria === filtros.categoria
      const statusOk = filtros.status === 'todos' || p.status === filtros.status
      return buscaOk && categoriaOk && statusOk
    })
  }, [produtos, filtros])

  async function excluirProduto(produto: ProdutoComEstoque) {
    if (!confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return
    setExcluindo(produto.id)

    // Remove estoque vinculado primeiro (FK)
    await db.estoque().delete().eq('produto_id', produto.id)
    const { error } = await db.produtos().delete().eq('id', produto.id)

    if (error) {
      mostrarToast('Erro ao excluir produto.', 'erro')
    } else {
      mostrarToast(`Produto "${produto.nome}" excluído.`, 'sucesso')
      onRecarregar()
    }
    setExcluindo(null)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-dark-card border border-dark-border rounded-lg animate-pulse" />
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden animate-pulse">
          <div className="h-12 bg-dark-hover" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 border-t border-dark-border" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {produtoEditando && (
        <ModalEdicao
          produto={produtoEditando}
          onFechar={() => setProdutoEditando(null)}
          onSalvar={() => { setProdutoEditando(null); onRecarregar() }}
        />
      )}

      <div className="space-y-4">
        <FiltrosEstoque filtros={filtros} categorias={categorias} onChange={setFiltros} />

        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          {produtosFiltrados.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
              <IconPackageOff size={36} />
              <span className="text-sm">Nenhum produto encontrado.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border">
                    {['Código', 'Produto', 'Categoria', 'Qtd.', 'Mínimo', 'Custo unit.', 'Status', ''].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((produto) => {
                    const badge = badgeStatus[produto.status]
                    return (
                      <tr
                        key={produto.id}
                        className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{produto.codigo}</td>
                        <td className="px-5 py-3.5 font-medium text-white">{produto.nome}</td>
                        <td className="px-5 py-3.5 text-gray-400">{produto.categoria ?? '—'}</td>
                        <td className="px-5 py-3.5 text-white font-semibold">
                          {produto.quantidade.toLocaleString('pt-BR')}
                          <span className="text-xs text-gray-500 ml-1">{produto.unidade}</span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">{produto.estoque_minimo}</td>
                        <td className="px-5 py-3.5 text-gray-300">
                          {produto.custo_unitario
                            ? produto.custo_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.classes}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            {canEdit() && (
                              <button
                                onClick={() => setProdutoEditando(produto)}
                                title="Editar"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors"
                              >
                                <IconEdit size={15} />
                              </button>
                            )}
                            {canDelete() && (
                              <button
                                onClick={() => excluirProduto(produto)}
                                disabled={excluindo === produto.id}
                                title="Excluir"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10 transition-colors disabled:opacity-40"
                              >
                                {excluindo === produto.id ? (
                                  <IconLoader2 size={15} className="animate-spin" />
                                ) : (
                                  <IconTrash size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rodapé com total */}
          <div className="px-5 py-3 border-t border-dark-border flex items-center justify-between text-xs text-gray-500">
            <span>{produtosFiltrados.length} produto(s) exibido(s)</span>
            <span>
              Total filtrado:{' '}
              <span className="text-white font-semibold">
                {produtosFiltrados.reduce((acc, p) => acc + p.quantidade, 0).toLocaleString('pt-BR')} unidades
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
