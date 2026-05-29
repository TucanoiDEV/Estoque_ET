import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import type { Entrada, StatusEntrada } from '../../types'

interface Props {
  entradas: Entrada[]
  loading: boolean
}

const ITENS_POR_PAGINA = 10

const badgeStatus: Record<StatusEntrada, string> = {
  recebido: 'bg-brand-green/15 text-brand-green',
  aguardando: 'bg-brand-yellow/15 text-brand-yellow',
  cancelado: 'bg-brand-red/15 text-brand-red',
}

const labelStatus: Record<StatusEntrada, string> = {
  recebido: 'Recebido',
  aguardando: 'Aguardando',
  cancelado: 'Cancelado',
}

export function HistoricoTab({ entradas, loading }: Props) {
  const [pagina, setPagina] = useState(1)

  const totalPaginas = Math.ceil(entradas.length / ITENS_POR_PAGINA)
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const itensPagina = entradas.slice(inicio, inicio + ITENS_POR_PAGINA)

  if (loading) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden animate-pulse">
        <div className="h-12 bg-dark-hover" />
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
    <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Histórico de compras</h3>
          <p className="text-xs text-gray-500 mt-0.5">{entradas.length} registros no total</p>
        </div>
      </div>

      {entradas.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">
          Nenhuma entrada registrada ainda.
        </div>
      ) : (
        <>
          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  {['Data', 'Produto', 'Fornecedor', 'Qtd.', 'Custo unit.', 'Total', 'Status'].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itensPagina.map((entrada) => (
                  <tr
                    key={entrada.id}
                    className="border-b border-dark-border/50 hover:bg-dark-hover/40 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-gray-300 whitespace-nowrap">
                      {format(new Date(entrada.data_recebimento), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium whitespace-nowrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(entrada.produto as any)?.nome ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(entrada.fornecedor as any)?.nome ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">
                      {entrada.quantidade.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-300">
                      {entrada.custo_unitario
                        ? entrada.custo_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-white font-semibold">
                      {entrada.total
                        ? entrada.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStatus[entrada.status]}`}>
                        {labelStatus[entrada.status]}
                      </span>
                    </td>
                  </tr>
                ))}
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
        </>
      )}
    </div>
  )
}
