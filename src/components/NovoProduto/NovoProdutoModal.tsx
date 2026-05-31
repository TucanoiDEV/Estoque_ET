import { useState, FormEvent } from 'react'
import { IconX, IconLoader2, IconPackages } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'

interface Props {
  onFechar: () => void
  onSalvo: () => void
}

interface FormProduto {
  codigo: string
  nome: string
  categoria: string
  unidade: string
  custo_unitario: number
  estoque_minimo: number
  quantidade_inicial: number
  local_armazenamento: string
}

const UNIDADES = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'KG', label: 'Quilograma (KG)' },
  { value: 'M', label: 'Metro (M)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PC', label: 'Pacote (PC)' },
  { value: 'PR', label: 'Par (PR)' },
  { value: 'T', label: 'Tonelada (T)' },
]

const LOCAIS = ['Estoque A', 'Estoque B', 'Depósito', 'Câmara Fria', 'Área Externa']

const FORM_INICIAL: FormProduto = {
  codigo: '',
  nome: '',
  categoria: '',
  unidade: 'UN',
  custo_unitario: 0,
  estoque_minimo: 0,
  quantidade_inicial: 0,
  local_armazenamento: 'Estoque A',
}

export function NovoProdutoModal({ onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormProduto>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormProduto, string>>>({})

  function set(campo: keyof FormProduto, valor: string | number) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.codigo.trim()) novosErros.codigo = 'Código é obrigatório'
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório'
    if (!form.unidade) novosErros.unidade = 'Selecione uma unidade'
    if (form.custo_unitario < 0) novosErros.custo_unitario = 'Custo não pode ser negativo'
    if (form.estoque_minimo < 0) novosErros.estoque_minimo = 'Valor não pode ser negativo'
    if (form.quantidade_inicial < 0) novosErros.quantidade_inicial = 'Valor não pode ser negativo'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setSalvando(true)
    try {
      const { data: produto, error: erroProduto } = await db
        .produtos()
        .insert({
          codigo: form.codigo.trim().toUpperCase(),
          nome: form.nome.trim(),
          categoria: form.categoria.trim() || null,
          unidade: form.unidade,
          custo_unitario: form.custo_unitario || null,
          estoque_minimo: form.estoque_minimo,
          local_armazenamento: form.local_armazenamento || null,
        })
        .select('id')
        .single()

      if (erroProduto) throw new Error(erroProduto.message)

      const { error: erroEstoque } = await db.estoque().insert({
        produto_id: produto.id,
        quantidade: form.quantidade_inicial,
      })

      if (erroEstoque) throw new Error(erroEstoque.message)

      mostrarToast(`Produto "${form.nome.trim()}" cadastrado com sucesso!`, 'sucesso')
      onSalvo()
      onFechar()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        setErros({ codigo: 'Este código já está em uso' })
        mostrarToast('Código já existe. Use um código diferente.', 'erro')
      } else {
        mostrarToast(`Erro ao cadastrar: ${msg}`, 'erro')
      }
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
            <div className="w-8 h-8 bg-brand-blue/15 rounded-lg flex items-center justify-center">
              <IconPackages size={16} className="text-brand-blue" />
            </div>
            <h2 className="text-base font-bold text-white">Cadastrar novo produto</h2>
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
          {/* Código + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Código <span className="text-brand-red">*</span>
              </label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => set('codigo', e.target.value)}
                placeholder="EX-001"
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors ${
                  erros.codigo ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              {erros.codigo && <p className="text-xs text-brand-red mt-1">{erros.codigo}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Unidade de medida <span className="text-brand-red">*</span>
              </label>
              <select
                value={form.unidade}
                onChange={(e) => set('unidade', e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors"
              >
                {UNIDADES.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Nome do produto <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Ex: Farinha de Trigo"
              className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors ${
                erros.nome ? 'border-brand-red' : 'border-dark-border'
              }`}
            />
            {erros.nome && <p className="text-xs text-brand-red mt-1">{erros.nome}</p>}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Categoria</label>
            <input
              type="text"
              value={form.categoria}
              onChange={(e) => set('categoria', e.target.value)}
              placeholder="Ex: Alimentos, Ferramentas, Limpeza..."
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>

          {/* Custo unit. + Estoque mínimo */}
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Estoque mínimo</label>
              <input
                type="number"
                min={0}
                value={form.estoque_minimo}
                onChange={(e) => set('estoque_minimo', Number(e.target.value))}
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                  erros.estoque_minimo ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              {erros.estoque_minimo && <p className="text-xs text-brand-red mt-1">{erros.estoque_minimo}</p>}
            </div>
          </div>

          {/* Quantidade inicial */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Quantidade inicial em estoque</label>
            <input
              type="number"
              min={0}
              value={form.quantidade_inicial}
              onChange={(e) => set('quantidade_inicial', Number(e.target.value))}
              className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue transition-colors ${
                erros.quantidade_inicial ? 'border-brand-red' : 'border-dark-border'
              }`}
            />
            {erros.quantidade_inicial && <p className="text-xs text-brand-red mt-1">{erros.quantidade_inicial}</p>}
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
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-blue/20"
            >
              {salvando && <IconLoader2 size={14} className="animate-spin" />}
              {salvando ? 'Cadastrando...' : 'Cadastrar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
