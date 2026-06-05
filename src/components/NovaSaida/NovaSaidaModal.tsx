import { useState, useEffect, FormEvent } from 'react'
import { IconX, IconLoader2, IconMinus } from '@tabler/icons-react'
import { format } from 'date-fns'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { useAuth } from '../../hooks/useAuth'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import { infoUnidade } from '../../utils/unidade'
import { descontoVigente, precoComDesconto } from '../../utils/desconto'
import { ComboBox } from '../shared/ComboBox'
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
  quantidade: string
  custo_unitario: string
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
  quantidade: '1',
  custo_unitario: '',
  motivo: 'Consumo interno',
  observacoes: '',
  data_saida: format(new Date(), 'yyyy-MM-dd'),
}

export function NovaSaidaModal({ onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const { usuario } = useAuth()
  const [form, setForm] = useState<FormSaida>(FORM_INICIAL)
  const [produtos, setProdutos] = useState<ProdutoComEstoque[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormSaida, string>>>({})

  useEffect(() => {
    async function carregar() {
      const camposBase = 'id, codigo, nome, unidade, categoria, cor, custo_unitario, estoque_minimo, local_armazenamento, created_at'
      // Tenta com os campos de desconto; se ainda não existirem, carrega sem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let prodsResp: { data: any[] | null; error: any } = await db.produtos().select(`${camposBase}, desconto, desconto_inicio, desconto_fim`).order('nome')
      if (prodsResp.error) prodsResp = await db.produtos().select(`${camposBase}, desconto`).order('nome')
      if (prodsResp.error) prodsResp = await db.produtos().select(camposBase).order('nome')
      const { data: estoques } = await db.estoque().select('id, produto_id, quantidade').gt('quantidade', 0)
      const prods = prodsResp.data
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

  function set(campo: keyof FormSaida, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  // Preenche o custo ao selecionar o produto, já com o desconto vigente aplicado (editável)
  function selecionarProduto(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId)
    setForm((prev) => ({
      ...prev,
      produto_id: produtoId,
      custo_unitario: produto?.custo_unitario != null ? String(precoComDesconto(produto.custo_unitario, produto)) : prev.custo_unitario,
    }))
    if (erros.produto_id) setErros((prev) => ({ ...prev, produto_id: undefined }))
  }

  const produtoSelecionado = produtos.find((p) => p.id === form.produto_id)
  const quantidadeNum = paraNumero(form.quantidade)
  const estoqueApos = produtoSelecionado ? produtoSelecionado.quantidade_atual - quantidadeNum : 0
  const total = quantidadeNum * paraNumero(form.custo_unitario)

  // Unidade do produto selecionado — rotula o custo (ex.: "Custo por metro" / R$/m)
  const custoInfo = infoUnidade(produtoSelecionado?.unidade)
  // Desconto vigente do produto selecionado (já refletido no custo pré-preenchido)
  const descontoAplicado = produtoSelecionado ? descontoVigente(produtoSelecionado) : 0

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.produto_id) novosErros.produto_id = 'Selecione um produto'
    if (quantidadeNum < 1) novosErros.quantidade = 'Quantidade mínima é 1'
    if (produtoSelecionado && quantidadeNum > produtoSelecionado.quantidade_atual) {
      novosErros.quantidade = `Máximo disponível: ${produtoSelecionado.quantidade_atual} ${produtoSelecionado.unidade}`
    }
    if (paraNumero(form.custo_unitario) < 0) novosErros.custo_unitario = 'Custo não pode ser negativo'
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

      // Registra a saída no histórico (para os gráficos). Se a tabela ainda não
      // existir (saidas.sql não rodado), a baixa de estoque acima já foi feita.
      const { error: erroRegistro } = await db.saidas().insert({
        produto_id: produtoSelecionado.id,
        usuario_id: usuario?.id ?? null,
        quantidade: quantidadeNum,
        custo_unitario: paraNumero(form.custo_unitario) || null,
        total: total || null,
        motivo: form.motivo || null,
        observacoes: form.observacoes || null,
        data_saida: form.data_saida,
      })
      if (erroRegistro) {
        console.warn('[Saída] Histórico não registrado (rode supabase/saidas.sql):', erroRegistro.message)
      }

      mostrarToast(`Saída de ${quantidadeNum} ${produtoSelecionado.unidade} registrada!`, 'sucesso')
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
          <ComboBox
            label="Produto"
            obrigatorio
            value={form.produto_id}
            opcoes={produtos.map((p) => ({
              value: p.id,
              label: `[${p.codigo}] ${p.nome} — ${p.quantidade_atual} ${p.unidade} disponíveis`,
            }))}
            onChange={selecionarProduto}
            placeholder="Selecione um produto..."
            placeholderBusca="Buscar produto..."
            erro={erros.produto_id}
          />

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

          {/* Quantidade + Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Quantidade <span className="text-brand-red">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.quantidade}
                onChange={(e) => set('quantidade', sanitizarNumero(e.target.value))}
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                  erros.quantidade ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              {erros.quantidade && <p className="text-xs text-brand-red mt-1">{erros.quantidade}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Custo por {custoInfo.nome}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.custo_unitario}
                  onChange={(e) => set('custo_unitario', sanitizarNumero(e.target.value, true))}
                  placeholder="0,00"
                  className={`w-full bg-dark-bg border rounded-lg pl-3 pr-16 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors ${
                    erros.custo_unitario ? 'border-brand-red' : 'border-dark-border'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                  R$/{custoInfo.abrev}
                </span>
              </div>
              {descontoAplicado > 0 && produtoSelecionado?.custo_unitario != null && (
                <p className="text-[11px] text-brand-purple mt-1">
                  −{descontoAplicado}% aplicado · original{' '}
                  {produtoSelecionado.custo_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
              {erros.custo_unitario && <p className="text-xs text-brand-red mt-1">{erros.custo_unitario}</p>}
            </div>
          </div>

          {/* Total calculado */}
          <div className="bg-dark-hover border border-dark-border rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total da saída</span>
            <span className="text-lg font-bold text-brand-green">
              {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          {/* Data + Motivo */}
          <div className="grid grid-cols-2 gap-3">
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
          {produtoSelecionado && quantidadeNum >= 1 && (
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
