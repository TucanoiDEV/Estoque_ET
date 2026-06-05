import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconPackage, IconCash, IconBuilding } from '@tabler/icons-react'
import { db } from '../../../services/supabase'
import { formatarMoeda } from '../../../utils/numero'
import type { Fornecedor } from '../../../types'

interface Resumo {
  produtosVinculados: number
  totalComprado: number
}

interface Props {
  fornecedor: Fornecedor
  onFechar: () => void
}

export function FornecedorResumoModal({ fornecedor, onFechar }: Props) {
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const [vinc, ents] = await Promise.all([
        db.fornecedorProdutos().select('id', { count: 'exact', head: true }).eq('fornecedor_id', fornecedor.id),
        db.entradas().select('total, custo_unitario, quantidade').eq('fornecedor_id', fornecedor.id),
      ])

      const entradas = (ents.data as { total: number | null; custo_unitario: number | null; quantidade: number }[]) ?? []
      const totalComprado = entradas.reduce((acc, e) => acc + (e.total ?? (e.custo_unitario ?? 0) * e.quantidade), 0)

      setResumo({ produtosVinculados: vinc.count ?? 0, totalComprado })
      setLoading(false)
    }
    carregar()
  }, [fornecedor.id])

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <div className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-xl shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-brand-blue/15 rounded-lg flex items-center justify-center shrink-0">
              <IconBuilding size={18} className="text-brand-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{fornecedor.nome}</h2>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${fornecedor.ativo ? 'text-brand-green' : 'text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${fornecedor.ativo ? 'bg-brand-green' : 'bg-gray-500'}`} />
                {fornecedor.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <button type="button" onClick={onFechar} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors shrink-0">
            <IconX size={18} />
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 p-5">
          {loading ? (
            <>
              <div className="h-24 bg-dark-hover rounded-xl animate-pulse" />
              <div className="h-24 bg-dark-hover rounded-xl animate-pulse" />
            </>
          ) : (
            <>
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-blue/15 text-brand-blue">
                    <IconPackage size={16} />
                  </div>
                  <span className="text-xs font-medium text-gray-400">Produtos vinculados</span>
                </div>
                <p className="text-xl font-bold text-white">{resumo?.produtosVinculados ?? 0}</p>
              </div>

              <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-green/15 text-brand-green">
                    <IconCash size={16} />
                  </div>
                  <span className="text-xs font-medium text-gray-400">Total comprado</span>
                </div>
                <p className="text-xl font-bold text-white">{formatarMoeda(resumo?.totalComprado ?? 0)}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
