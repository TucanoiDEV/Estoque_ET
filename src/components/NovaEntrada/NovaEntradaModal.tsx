import { useState, useEffect, FormEvent } from 'react'
import { IconX, IconLoader2, IconPackage } from '@tabler/icons-react'
import { format } from 'date-fns'
import { db } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../shared/Toast'
import type { Produto, Fornecedor, FormNovaEntrada } from '../../types'

interface Props {
  onFechar: () => void
  onSalvo: () => void
}

const LOCAIS = ['Estoque A', 'Estoque B', 'Depósito', 'Câmara Fria', 'Área Externa']

const FORM_INICIAL: FormNovaEntrada = {
  produto_id: '',
  quantidade: 1,
  custo_unitario: 0,
  fornecedor_id: '',
  data_recebimento: format(new Date(), 'yyyy-MM-dd'),
  nf_numero: '',
  local_armazenamento: 'Estoque A',
  observacoes: '',
}

export function NovaEntradaModal({ onFechar, onSalvo }: Props) {
  const { usuario } = useAuth()
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormNovaEntrada>(FORM_INICIAL)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormNovaEntrada, string>>>({})

  useEffect(() => {
    async function carregar() {
      const [{ data: p }, { data: f }] = await Promise.all([
        db.produtos().select('id, codigo, nome, custo_unitario').order('nome'),
        db.fornecedores().select('id, nome').order('nome'),
      ])
      setProdutos((p as Produto[]) ?? [])
      setFornecedores((f as Fornecedor[]) ?? [])
    }
    carregar()
  }, [])

  // Preenche custo ao selecionar produto
  function selecionarProduto(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId)
    setForm((prev) => ({
      ...prev,
      produto_id: produtoId,
      custo_unitario: produto?.custo_unitario ?? prev.custo_unitario,
    }))
  }

  function set(campo: keyof FormNovaEntrada, valor: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  const total = form.quantidade * form.custo_unitario

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.produto_id) novosErros.produto_id = 'Selecione um produto'
    if (form.quantidade < 1) novosErros.quantidade = 'Quantidade mínima é 1'
    if (form.custo_unitario < 0) novosErros.custo_unitario = 'Custo não pode ser negativo'
    if (!form.data_recebimento) novosErros.data_recebimento = 'Informe a data de recebimento'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setSalvando(true)

    try {
      // 1. Registra a entrada
      const { error: erroEntrada } = await db.entradas().insert({
        produto_id: form.produto_id,
        fornecedor_id: form.fornecedor_id || null,
        usuario_id: usuario!.id,
        quantidade: form.quantidade,
        custo_unitario: form.custo_unitario || null,
        total: total || null,
        nf_numero: form.nf_numero || null,
        data_recebimento: form.data_recebimento,
        local_armazenamento: form.local_armazenamento || null,
        observacoes: form.observacoes || null,
        status: 'recebido',
      })

      if (erroEntrada) throw new Error(erroEntrada.message)

      // 2. Verifica se já existe registro de estoque para o produto
      const { data: estoqueExistente } = await db
        .estoque()
        .select('id, quantidade')
        .eq('produto_id', form.produto_id)
        .single()

      if (estoqueExistente) {
        // Incrementa a quantidade existente
        await db
          .estoque()
          .update({ quantidade: estoqueExistente.quantidade + form.quantidade, updated_at: new Date().toISOString() })
          .eq('id', estoqueExistente.id)
      } else {
        // Cria novo registro de estoque
        await db.estoque().insert({ produto_id: form.produto_id, quantidade: form.quantidade })
      }

      mostrarToast('Entrada registrada com sucesso!', 'sucesso')
      onSalvo()
      onFechar()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      mostrarToast(`Erro ao salvar: ${msg}`, 'erro')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border sticky top-0 bg-dark-card z-10">
          <div className="flex items-center gap-2">
            <IconPackage size={20} className="text-brand-green" />
            <h2 className="text-base font-bold text-white">Nova entrada de estoque</h2>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={salvar} className="px-6 py-5 space-y-4">
          {/* Produto */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Produto <span className="text-brand-red">*</span>
            </label>
            <select
              value={form.produto_id}
              onChange={(e) => selecionarProduto(e.target.value)}
              className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                erros.produto_id ? 'border-brand-red' : 'border-dark-border'
              }`}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nome}
                </option>
              ))}
            </select>
            {erros.produto_id && <p className="text-xs text-brand-red mt-1">{erros.produto_id}</p>}
          </div>

          {/* Quantidade + Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Quantidade <span className="text-brand-red">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={form.quantidade}
                onChange={(e) => set('quantidade', Number(e.target.value))}
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                  erros.quantidade ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              {erros.quantidade && <p className="text-xs text-brand-red mt-1">{erros.quantidade}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Custo unitário (R$)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.custo_unitario}
                onChange={(e) => set('custo_unitario', Number(e.target.value))}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>

          {/* Total calculado */}
          <div className="bg-dark-hover border border-dark-border rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total da entrada</span>
            <span className="text-lg font-bold text-brand-green">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {/* Fornecedor */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Fornecedor</label>
            <select
              value={form.fornecedor_id}
              onChange={(e) => set('fornecedor_id', e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
            >
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          {/* Data + NF */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Data de recebimento <span className="text-brand-red">*</span>
              </label>
              <input
                type="date"
                value={form.data_recebimento}
                onChange={(e) => set('data_recebimento', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nº da nota fiscal</label>
              <input
                type="text"
                value={form.nf_numero}
                onChange={(e) => set('nf_numero', e.target.value)}
                placeholder="NF-0001"
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>

          {/* Local de armazenamento */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Local de armazenamento</label>
            <select
              value={form.local_armazenamento}
              onChange={(e) => set('local_armazenamento', e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
            >
              {LOCAIS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Observações</label>
            <textarea
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              rows={2}
              placeholder="Informações adicionais sobre esta entrada..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brand-green hover:bg-green-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-green/20"
            >
              {salvando && <IconLoader2 size={14} className="animate-spin" />}
              {salvando ? 'Salvando...' : 'Confirmar entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
