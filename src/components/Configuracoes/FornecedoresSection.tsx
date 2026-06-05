import { useState, useEffect, useMemo } from 'react'
import {
  IconTrash, IconEdit, IconEye, IconChartLine, IconLoader2, IconPlus, IconSearch,
  IconChevronLeft, IconChevronRight, IconArrowsSort, IconBuildingOff,
} from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { FornecedorDrawer } from './fornecedor/FornecedorDrawer'
import { FornecedorResumoModal } from './fornecedor/FornecedorResumoModal'
import { FornecedorHistorico } from './fornecedor/FornecedorHistorico'
import type { Entrada, Fornecedor } from '../../types'

type FiltroStatus = 'todos' | 'ativos' | 'inativos'
const POR_PAGINA = 8

interface Props {
  entradas: Entrada[]
  loadingEntradas: boolean
}

export function FornecedoresSection({ entradas, loadingEntradas }: Props) {
  const { mostrarToast } = useToast()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState<{ aberto: boolean; editando: Fornecedor | null }>({ aberto: false, editando: null })
  const [resumo, setResumo] = useState<Fornecedor | null>(null)
  const [historico, setHistorico] = useState<Fornecedor | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('todos')
  const [ordemAsc, setOrdemAsc] = useState(true)
  const [pagina, setPagina] = useState(1)

  async function carregar() {
    setLoading(true)
    const { data } = await db.fornecedores().select('*').order('nome')
    setFornecedores((data as Fornecedor[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  // Filtra + ordena no cliente
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return fornecedores
      .filter((f) => {
        const buscaOk = !termo || f.nome.toLowerCase().includes(termo) || (f.representante ?? '').toLowerCase().includes(termo)
        const statusOk =
          statusFiltro === 'todos' || (statusFiltro === 'ativos' ? f.ativo : !f.ativo)
        return buscaOk && statusOk
      })
      .sort((a, b) => (ordemAsc ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)))
  }, [fornecedores, busca, statusFiltro, ordemAsc])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA)

  // Volta para a página 1 quando os filtros mudam
  useEffect(() => { setPagina(1) }, [busca, statusFiltro, ordemAsc])

  async function excluir(f: Fornecedor) {
    if (!confirm(`Excluir o fornecedor "${f.nome}"?`)) return
    setExcluindo(f.id)
    const { error } = await db.fornecedores().delete().eq('id', f.id)

    if (error) {
      // 23503 = violação de chave estrangeira (fornecedor tem entradas vinculadas)
      if (error.code === '23503' || /foreign key/i.test(error.message)) {
        mostrarToast('Este fornecedor possui entradas vinculadas e não pode ser excluído.', 'aviso')
      } else {
        mostrarToast(`Erro ao excluir: ${error.message}`, 'erro')
      }
    } else {
      mostrarToast(`Fornecedor "${f.nome}" excluído.`, 'sucesso')
      carregar()
    }
    setExcluindo(null)
  }

  const inputBusca =
    'w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors'

  return (
    <div className="space-y-5">
      {/* Filtros + ação */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por empresa ou representante..."
            className={inputBusca}
          />
        </div>
        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as FiltroStatus)}
          className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
        <button
          onClick={() => setOrdemAsc((v) => !v)}
          title="Ordenar por nome"
          className="flex items-center gap-1.5 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-dark-hover transition-colors"
        >
          <IconArrowsSort size={15} />
          Nome {ordemAsc ? 'A→Z' : 'Z→A'}
        </button>
        <button
          onClick={() => setDrawer({ aberto: true, editando: null })}
          className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <IconPlus size={16} />
          Novo fornecedor
        </button>
      </div>

      {drawer.aberto && (
        <FornecedorDrawer
          editando={drawer.editando}
          onFechar={() => setDrawer({ aberto: false, editando: null })}
          onSalvo={carregar}
        />
      )}

      {resumo && (
        <FornecedorResumoModal fornecedor={resumo} onFechar={() => setResumo(null)} />
      )}

      {/* Tabela */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-14 bg-dark-hover rounded-xl" />)}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-gray-500 text-center">
          <IconBuildingOff size={32} className="text-gray-600" />
          <p className="text-sm">
            {fornecedores.length === 0 ? 'Nenhum fornecedor cadastrado.' : 'Nenhum fornecedor encontrado com os filtros atuais.'}
          </p>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Empresa', 'Representante', 'Prazo médio', 'Pagamento', 'Status', ''].map((col) => (
                    <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((f) => (
                  <tr key={f.id} className="border-b border-dark-border/50 last:border-0 hover:bg-dark-hover/40">
                    <td className="px-5 py-3.5 font-medium text-white whitespace-nowrap">{f.nome}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{f.representante ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{f.prazo_entrega != null ? `${f.prazo_entrega} dias` : '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{f.condicoes_pagamento ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        f.ativo ? 'bg-brand-green/15 text-brand-green' : 'bg-gray-500/15 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.ativo ? 'bg-brand-green' : 'bg-gray-400'}`} />
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setResumo(f)}
                          title="Ver resumo"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-green/10"
                        >
                          <IconEye size={15} />
                        </button>
                        <button
                          onClick={() => setHistorico(f)}
                          title="Histórico de compras"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                        >
                          <IconChartLine size={15} />
                        </button>
                        <button
                          onClick={() => setDrawer({ aberto: true, editando: f })}
                          title="Editar"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          onClick={() => excluir(f)}
                          disabled={excluindo === f.id}
                          title="Excluir"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10 disabled:opacity-40"
                        >
                          {excluindo === f.id ? <IconLoader2 size={15} className="animate-spin" /> : <IconTrash size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com paginação */}
          <div className="px-5 py-3 border-t border-dark-border flex items-center justify-between text-xs text-gray-500">
            <span>{filtrados.length} fornecedor(es)</span>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <IconChevronLeft size={16} />
                </button>
                <span className="text-gray-400">Página {paginaAtual} de {totalPaginas}</span>
                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-dark-hover disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Histórico de compras do fornecedor selecionado */}
      {historico && (
        <FornecedorHistorico
          key={historico.id}
          fornecedor={historico}
          entradas={entradas}
          loading={loadingEntradas}
          onFechar={() => setHistorico(null)}
        />
      )}
    </div>
  )
}
