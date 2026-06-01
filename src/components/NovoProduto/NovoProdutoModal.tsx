import { useState, useEffect, FormEvent } from 'react'
import { IconX, IconLoader2, IconPackages } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import { useLista } from '../../hooks/useLista'
import { useCategorias } from '../../hooks/useCategorias'
import { SelectComAdicionar, type Opcao } from '../shared/SelectComAdicionar'
import { CORES_PADRAO } from '../../utils/listasPadrao'

interface Props {
  onFechar: () => void
  onSalvo: () => void
}

interface FormProduto {
  codigo: string
  nome: string
  categoria: string
  unidade: string
  cor: string
  custo_unitario: string
  estoque_minimo: string
  quantidade_inicial: string
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

// Nome e abreviação por unidade — usados para rotular o custo conforme a medida
const UNIDADE_INFO: Record<string, { nome: string; abrev: string }> = {
  UN: { nome: 'unidade', abrev: 'un' },
  KG: { nome: 'quilograma', abrev: 'kg' },
  M: { nome: 'metro', abrev: 'm' },
  L: { nome: 'litro', abrev: 'L' },
  CX: { nome: 'caixa', abrev: 'cx' },
  PC: { nome: 'pacote', abrev: 'pc' },
  PR: { nome: 'par', abrev: 'par' },
  T: { nome: 'tonelada', abrev: 't' },
}

function infoUnidade(unidade: string): { nome: string; abrev: string } {
  return UNIDADE_INFO[unidade] ?? { nome: unidade.toLowerCase(), abrev: unidade.toLowerCase() }
}

const LOCAIS = ['Estoque A', 'Estoque B', 'Depósito', 'Câmara Fria', 'Área Externa']

const FORM_INICIAL: FormProduto = {
  codigo: '',
  nome: '',
  categoria: '',
  unidade: 'UN',
  cor: '',
  custo_unitario: '',
  estoque_minimo: '',
  quantidade_inicial: '',
  local_armazenamento: 'Estoque A',
}

export function NovoProdutoModal({ onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormProduto>(FORM_INICIAL)
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormProduto, string>>>({})

  // Listas editáveis (o usuário pode adicionar novos itens) — salvas no navegador
  const cores = useLista('cores', CORES_PADRAO)
  const unidadesExtra = useLista('unidades', [])
  const locais = useLista('locais', LOCAIS)

  // Categorias: lista oficial do banco (mesma das Configurações) + as já usadas em produtos
  const categorias = useCategorias()
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([])
  useEffect(() => {
    async function carregar() {
      const { data } = await db.produtos().select('categoria')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const distintas = [...new Set((data ?? []).map((p: any) => p.categoria).filter(Boolean))] as string[]
      setCategoriasExistentes(distintas)
    }
    carregar()
  }, [])

  const opcoesUnidade: Opcao[] = [
    ...UNIDADES,
    ...unidadesExtra.itens
      .filter((u) => !UNIDADES.some((d) => d.value === u))
      .map((u) => ({ value: u, label: u })),
  ]

  // Opções de categoria = lista oficial (Configurações/banco) + as já usadas em produtos
  const opcoesCategoria: Opcao[] = [...new Set([...categorias.categorias, ...categoriasExistentes])]
    .sort((a, b) => a.localeCompare(b))
    .map((c) => ({ value: c, label: c }))

  // Rótulo do custo conforme a unidade selecionada (ex.: "Custo por metro" / R$/m)
  const custoInfo = infoUnidade(form.unidade)

  function set(campo: keyof FormProduto, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.codigo.trim()) novosErros.codigo = 'Código é obrigatório'
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório'
    if (!form.unidade) novosErros.unidade = 'Selecione uma unidade'
    if (paraNumero(form.custo_unitario) < 0) novosErros.custo_unitario = 'Custo não pode ser negativo'
    if (paraNumero(form.estoque_minimo) < 0) novosErros.estoque_minimo = 'Valor não pode ser negativo'
    if (paraNumero(form.quantidade_inicial) < 0) novosErros.quantidade_inicial = 'Valor não pode ser negativo'
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
          cor: form.cor.trim() || null,
          custo_unitario: paraNumero(form.custo_unitario) || null,
          estoque_minimo: paraNumero(form.estoque_minimo),
          local_armazenamento: form.local_armazenamento || null,
        })
        .select('id')
        .single()

      if (erroProduto) throw new Error(erroProduto.message)

      const { error: erroEstoque } = await db.estoque().insert({
        produto_id: produto.id,
        quantidade: paraNumero(form.quantidade_inicial),
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
            <SelectComAdicionar
              label="Unidade de medida"
              obrigatorio
              value={form.unidade}
              opcoes={opcoesUnidade}
              onChange={(v) => set('unidade', v)}
              onAdicionar={(texto) => { unidadesExtra.adicionar(texto); return texto }}
              erro={erros.unidade}
              placeholderNovo="Nova unidade (ex.: Rolo)"
            />
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

          {/* Categoria + Cor */}
          <div className="grid grid-cols-2 gap-3">
            <SelectComAdicionar
              label="Categoria"
              value={form.categoria}
              textoVazio="Sem categoria"
              opcoes={opcoesCategoria}
              onChange={(v) => set('categoria', v)}
              onAdicionar={async (texto) => { await categorias.adicionar(texto); return texto }}
              placeholderNovo="Nova categoria (ex.: Lona PVC)"
            />
            <SelectComAdicionar
              label="Cor"
              value={form.cor}
              textoVazio="Sem cor"
              opcoes={cores.itens.map((c) => ({ value: c, label: c }))}
              onChange={(v) => set('cor', v)}
              onAdicionar={(texto) => { cores.adicionar(texto); return texto }}
              placeholderNovo="Nova cor (ex.: Laranja)"
            />
          </div>

          {/* Custo unit. + Estoque mínimo */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-full bg-dark-bg border border-dark-border rounded-lg pl-3 pr-16 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                  R$/{custoInfo.abrev}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Estoque mínimo</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.estoque_minimo}
                onChange={(e) => set('estoque_minimo', sanitizarNumero(e.target.value))}
                placeholder="0"
                className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors ${
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
              type="text"
              inputMode="numeric"
              value={form.quantidade_inicial}
              onChange={(e) => set('quantidade_inicial', sanitizarNumero(e.target.value))}
              placeholder="0"
              className={`w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors ${
                erros.quantidade_inicial ? 'border-brand-red' : 'border-dark-border'
              }`}
            />
            {erros.quantidade_inicial && <p className="text-xs text-brand-red mt-1">{erros.quantidade_inicial}</p>}
          </div>

          {/* Local de armazenamento */}
          <SelectComAdicionar
            label="Local de armazenamento"
            value={form.local_armazenamento}
            opcoes={locais.itens.map((l) => ({ value: l, label: l }))}
            onChange={(v) => set('local_armazenamento', v)}
            onAdicionar={(texto) => { locais.adicionar(texto); return texto }}
            placeholderNovo="Novo local (ex.: Prateleira 3)"
          />

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
