import { useState, useEffect, FormEvent } from 'react'
import { IconX, IconLoader2, IconMinus } from '@tabler/icons-react'
import { format } from 'date-fns'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import type { Produto } from '../../types'

interface Props {
  onFechar: () => void
  onSalvo: () => void
}

interface ProdutoComEstoque extends Produto {
  estoque_id: string
  quantidade_atual: number
}

interface FormSaida {
  produto_id: string
  quantidade: number
  motivo: string
  observacoes: string
  data_saida: string
}

const MOTIVOS = [
  'Consumo interno',
  'Venda',
  'Devolução ao fornecedor',
  'Avaria / Dano',
  'Vencimento / Expiração',
  'Furto / Roubo',
  'Ajuste de inventário',
  'Outro',
]

const FORM_INICIAL: FormSaida = {
  produto_id: '',
  quantidade: 1,
  motivo: 'Consumo interno',
  observacoes: '',
  data_saida: format(new Date(), 'yyyy-MM-dd'),
}

export function NovaSaidaModal({ onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormSaida>(FORM_INICIAL)
  const [produtos, setProdutos] = useState<ProdutoComEstoque[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormSaida, string>>>({})

  useEffect(() => {
    async function carregar() {
      const [{ data: prods }, { data: estoques }] = await Promise.all([
        db.produtos().select('id, codigo, nome, unidade, categoria, custo_unitario, estoque_minimo, local_armazenamento, created_at').order('nome'),
        db.estoque().select('id, produto_id, quantidade').gt('quantidade', 0),
      ])
      if (!prods || !estoques) return
      const merged: ProdutoComEstoque[] = prods
        .filter((p) => estoques.some((e) => e.produto_id === p.id))
        .map((p) => {
          const est = estoques.find((e) => e.produto_id === p.id)!
          return { ...p, estoque_id: est.id, quantidade_atual: est.quantidade } as ProdutoComEstoque
        })
      setProdutos(merged)
    }
    carregar()
  }, [])

  function set(campo: keyof FormSaida, valor: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  const produtoSelecionado = produtos.find((p) => p.id === form.produto_id)
  const estoqueApos = produtoSelecionado ? produtoSelecionado.quantidade_atual - form.quantidade : 0

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.produto_id) novosErros.produto_id = 'Selecione um produto'
    if (form.quantidade < 1) novosErros.quantidade = 'Quantidade mínima é 1'
    if (produtoSelecionado && form.quantidade > produtoSelecionado.quantidade_atual) {
      novosErros.quantidade = `Máximo disponível: ${produtoSelecionado.quantidade_atual} ${produtoSelecionado.unidade}`
    }
    if (!form.data_saida) novosErros.data_saida = 'Informe a data'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!validar() || !produtoSelecionado) return
    setSalvando(true)
    try {
      const { error } = await db
        .estoque()
        .update({ quantidade: estoqueApos, updated_at: new Date().toISOString() })
        .eq('id', produtoSelecionado.estoque_id)
      if (error) throw new Error(error.message)
      mostrarToast(`Saída de ${form.quantidade} ${produtoSelecionado.unidade} registrada!`, 'sucesso')
      onSalvo()
      onFechar()
    } catch (err) {
      mostrarToast(`Erro: ${err instanceof Error ? err.message : 'Erro desconhecido'}`, 'erro')
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
            <div className="w-8 h-8 bg-brand-red/15 rounded-lg flex items-center justify-center">
              <IconMinus size={16} className="text-brand-red" />
            </div>
            <h2 className="text-base font-bold text-white">Registrar saída de estoque</h2>
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
              onChange={(e) => set('produto_id', e.target.value)}
              className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                erros.produto_id ? 'border-brand-red' : 'border-dark-border'
              }`}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.codigo}] {p.nome} — {p.quantidade_atual} {p.unidade} disponíveis
                </option>
              ))}
            </select>
            {erros.produto_id && <p className="text-xs text-brand-red mt-1">{erros.produto_id}</p>}
          </div>

          {/* Estoque atual */}
          {produtoSelecionado && (
            <div className="bg-dark-hover border border-dark-border rounded-lg px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Estoque atual</span>
              <span className="text-base font-bold text-white">
                {produtoSelecionado.quantidade_atual.toLocaleString('pt-BR')}
                <span className="text-xs text-gray-500 ml-1">{produtoSelecionado.unidade}</span>
              </span>
            </div>
          )}

          {/* Quantidade + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Quantidade <span className="text-brand-red">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={produtoSelecionado?.quantidade_atual}
                value={form.quantidade}
                onChange={(e) => set('quantidade', Number(e.target.value))}
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                  erros.quantidade ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              {erros.quantidade && <p className="text-xs text-brand-red mt-1">{erros.quantidade}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Data da saída <span className="text-brand-red">*</span>
              </label>
              <input
                type="date"
                value={form.data_saida}
                onChange={(e) => set('data_saida', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Motivo da saída</label>
            <select
              value={form.motivo}
              onChange={(e) => set('motivo', e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
            >
              {MOTIVOS.map((m) => (
                <option key={m} value={m}>{m}</option>
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
              placeholder="Informações adicionais sobre esta saída..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors resize-none"
            />
          </div>

          {/* Estoque após saída */}
          {produtoSelecionado && form.quantidade >= 1 && (
            <div
              className={`border rounded-lg px-4 py-3 flex items-center justify-between ${
                estoqueApos < 0
                  ? 'bg-brand-red/10 border-brand-red/40'
                  : estoqueApos === 0
                  ? 'bg-brand-yellow/10 border-brand-yellow/40'
                  : 'bg-dark-hover border-dark-border'
              }`}
            >
              <span className="text-xs text-gray-400 font-medium">Estoque após saída</span>
              <span
                className={`text-lg font-bold ${
                  estoqueApos < 0 ? 'text-brand-red' : estoqueApos === 0 ? 'text-brand-yellow' : 'text-white'
                }`}
              >
                {Math.max(0, estoqueApos).toLocaleString('pt-BR')}
                <span className="text-xs text-gray-500 ml-1">{produtoSelecionado.unidade}</span>
              </span>
            </div>
          )}

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
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brand-red hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-red/20"
            >
              {salvando && <IconLoader2 size={14} className="animate-spin" />}
              {salvando ? 'Registrando...' : 'Confirmar saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
