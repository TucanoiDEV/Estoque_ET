import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  IconX, IconBuilding, IconBuildingPlus, IconUser, IconPhone, IconCash, IconCalendar, IconPackages,
} from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { formatarMoeda } from '../../utils/numero'
import { formatarData } from '../../utils/data'
import type { ProdutoComEstoque } from '../../types'

interface FornecedorResumo {
  id: string
  nome: string
  representante: string | null
  telefone: string | null
}

interface UltimaCompra {
  preco: number | null
  data: string
  fornecedor: string | null
}

interface Props {
  produto: ProdutoComEstoque
  onFechar: () => void
}

export function ProdutoDetalheModal({ produto, onFechar }: Props) {
  const [principal, setPrincipal] = useState<FornecedorResumo | null>(null)
  const [secundario, setSecundario] = useState<FornecedorResumo | null>(null)
  const [ultima, setUltima] = useState<UltimaCompra | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      const [forn, vinc, ent] = await Promise.all([
        produto.fornecedor_id
          ? db.fornecedores().select('id, nome, representante, telefone').eq('id', produto.fornecedor_id).maybeSingle()
          : Promise.resolve({ data: null }),
        db.fornecedorProdutos().select('fornecedor_id, fornecedor:fornecedores(id, nome, representante, telefone)').eq('produto_id', produto.id),
        db.entradas().select('custo_unitario, data_recebimento, fornecedor:fornecedores(nome)').eq('produto_id', produto.id).order('data_recebimento', { ascending: false }).limit(1).maybeSingle(),
      ])

      setPrincipal((forn.data as unknown as FornecedorResumo) ?? null)

      // Secundário = primeiro vínculo cujo fornecedor não é o principal
      const vinculos = (vinc.data as unknown as { fornecedor_id: string; fornecedor: FornecedorResumo | null }[]) ?? []
      const sec = vinculos.find((v) => v.fornecedor_id !== produto.fornecedor_id)?.fornecedor ?? null
      setSecundario(sec)

      const e = ent.data as unknown as { custo_unitario: number | null; data_recebimento: string; fornecedor: { nome: string } | null } | null
      setUltima(e ? { preco: e.custo_unitario, data: e.data_recebimento, fornecedor: e.fornecedor?.nome ?? null } : null)
      setLoading(false)
    }
    carregar()
  }, [produto.id, produto.fornecedor_id])

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onFechar}>
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-brand-blue/15 rounded-lg flex items-center justify-center shrink-0">
              <IconPackages size={18} className="text-brand-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">{produto.nome}</h2>
              <p className="text-xs text-gray-500 font-mono">{produto.codigo}</p>
            </div>
          </div>
          <button onClick={onFechar} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors shrink-0">
            <IconX size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-gray-500 -mt-1">Informações de reposição</p>

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 bg-dark-hover rounded-xl" />)}
            </div>
          ) : (
            <>
              {/* Fornecedor principal */}
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconBuilding size={15} className="text-brand-blue" />
                  <span className="text-xs font-semibold text-gray-400 uppercase">Fornecedor principal</span>
                </div>
                {principal ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{principal.nome}</p>
                    {principal.representante && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5"><IconUser size={13} /> {principal.representante}</p>
                    )}
                    {principal.telefone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5"><IconPhone size={13} /> {principal.telefone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Não definido</p>
                )}
              </div>

              {/* Fornecedor secundário */}
              <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconBuildingPlus size={15} className="text-brand-purple" />
                  <span className="text-xs font-semibold text-gray-400 uppercase">Fornecedor secundário</span>
                </div>
                {secundario ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{secundario.nome}</p>
                    {secundario.representante && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5"><IconUser size={13} /> {secundario.representante}</p>
                    )}
                    {secundario.telefone && (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5"><IconPhone size={13} /> {secundario.telefone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Nenhum vínculo adicional. Cadastre em Configurações → Fornecedores.</p>
                )}
              </div>

              {/* Último preço + última compra */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <IconCash size={15} className="text-brand-green" />
                    <span className="text-xs font-semibold text-gray-400 uppercase">Último preço</span>
                  </div>
                  <p className="text-base font-bold text-white">{ultima?.preco != null ? formatarMoeda(ultima.preco) : '—'}</p>
                  {ultima?.fornecedor && <p className="text-xs text-gray-600 mt-0.5 truncate">{ultima.fornecedor}</p>}
                </div>
                <div className="bg-dark-bg border border-dark-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <IconCalendar size={15} className="text-brand-yellow" />
                    <span className="text-xs font-semibold text-gray-400 uppercase">Última compra</span>
                  </div>
                  <p className="text-base font-bold text-white">{ultima?.data ? formatarData(ultima.data) : '—'}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
