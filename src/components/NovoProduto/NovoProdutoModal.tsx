import { useState, useEffect, FormEvent } from 'react'
import { format } from 'date-fns'
import { IconX, IconLoader2, IconPackages } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { useAuth } from '../../hooks/useAuth'
import { sanitizarNumero, paraNumero, formatarMoeda } from '../../utils/numero'
import { useLista } from '../../hooks/useLista'
import { useCategorias } from '../../hooks/useCategorias'
import { SelectComAdicionar, type Opcao } from '../shared/SelectComAdicionar'
import { CORES_PADRAO } from '../../utils/listasPadrao'
import { infoUnidade } from '../../utils/unidade'
import { proximoCodigo } from '../../utils/codigo'
import type { Fornecedor } from '../../types'

interface Props {
  onFechar: () => void
  onSalvo: () => void
}

interface FormProduto {
  nome: string
  categoria: string
  unidade: string
  cor: string
  fornecedor_id: string
  custo_unitario: string
  venda_valor: string
  venda_percentual: string
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

const LOCAIS = ['Estoque A', 'Estoque B', 'Depósito', 'Câmara Fria', 'Área Externa']

const FORM_INICIAL: FormProduto = {
  nome: '',
  categoria: '',
  unidade: 'UN',
  cor: '',
  fornecedor_id: '',
  custo_unitario: '',
  venda_valor: '',
  venda_percentual: '',
  estoque_minimo: '',
  quantidade_inicial: '',
  local_armazenamento: 'Estoque A',
}

export function NovoProdutoModal({ onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const { usuario } = useAuth()
  const [form, setForm] = useState<FormProduto>(FORM_INICIAL)
  // Como o usuário informa a venda: valor direto (R$) ou margem (%) sobre o custo
  const [modoVenda, setModoVenda] = useState<'valor' | 'percentual'>('valor')
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormProduto, string>>>({})

  // Listas editáveis (o usuário pode adicionar novos itens) — salvas no navegador
  const cores = useLista('cores', CORES_PADRAO)
  const unidadesExtra = useLista('unidades', [])
  const locais = useLista('locais', LOCAIS)

  // Categorias: lista oficial do banco (mesma das Configurações) + as já usadas em produtos
  const categorias = useCategorias()
  const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([])
  const [codigosExistentes, setCodigosExistentes] = useState<string[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  useEffect(() => {
    async function carregar() {
      const { data } = await db.produtos().select('categoria, codigo')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const distintas = [...new Set((data ?? []).map((p: any) => p.categoria).filter(Boolean))] as string[]
      setCategoriasExistentes(distintas)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setCodigosExistentes((data ?? []).map((p: any) => p.codigo).filter(Boolean) as string[])

      const { data: forn } = await db.fornecedores().select('id, nome').order('nome')
      setFornecedores((forn as Fornecedor[]) ?? [])
    }
    carregar()
  }, [])

  // Código gerado automaticamente a partir da categoria (ex.: "Tecido" -> TEC-001)
  const codigoGerado = proximoCodigo(form.categoria, codigosExistentes)

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

  // Preço de venda: só é permitido depois que o custo for informado. Pode ser
  // digitado como valor (R$) ou como margem (%) sobre o custo.
  const custoNum = paraNumero(form.custo_unitario)
  const custoPreenchido = form.custo_unitario.trim() !== '' && custoNum > 0
  const precoVenda = !custoPreenchido
    ? 0
    : modoVenda === 'percentual'
      ? custoNum * (1 + paraNumero(form.venda_percentual) / 100)
      : paraNumero(form.venda_valor)

  function set(campo: keyof FormProduto, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  function validar(): boolean {
    const novosErros: typeof erros = {}
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório'
    if (!form.unidade) novosErros.unidade = 'Selecione uma unidade'
    if (paraNumero(form.custo_unitario) < 0) novosErros.custo_unitario = 'Custo não pode ser negativo'
    if (modoVenda === 'valor' && paraNumero(form.venda_valor) < 0) novosErros.venda_valor = 'Valor não pode ser negativo'
    if (modoVenda === 'percentual' && paraNumero(form.venda_percentual) < 0) novosErros.venda_percentual = 'Percentual não pode ser negativo'
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
      const dadosBase = {
        codigo: codigoGerado,
        nome: form.nome.trim(),
        categoria: form.categoria.trim() || null,
        unidade: form.unidade,
        cor: form.cor.trim() || null,
        fornecedor_id: form.fornecedor_id || null,
        custo_unitario: paraNumero(form.custo_unitario) || null,
        estoque_minimo: paraNumero(form.estoque_minimo),
        local_armazenamento: form.local_armazenamento || null,
      }
      const precoVendaFinal = custoPreenchido && precoVenda > 0 ? Number(precoVenda.toFixed(2)) : null

      // Tenta com preco_venda; se a coluna ainda não existir, grava sem ela.
      let resp = await db.produtos().insert({ ...dadosBase, preco_venda: precoVendaFinal }).select('id').single()
      if (resp.error && /preco_venda|column/i.test(resp.error.message)) {
        resp = await db.produtos().insert(dadosBase).select('id').single()
      }
      const produto = resp.data
      if (resp.error || !produto) throw new Error(resp.error?.message ?? 'Falha ao cadastrar o produto')

      const quantidadeInicial = paraNumero(form.quantidade_inicial)

      const { error: erroEstoque } = await db.estoque().insert({
        produto_id: produto.id,
        quantidade: quantidadeInicial,
      })

      if (erroEstoque) throw new Error(erroEstoque.message)

      // Registra o estoque inicial como uma entrada, para aparecer no histórico
      // de movimentações (o registro de estoque sozinho não vira entrada).
      if (quantidadeInicial > 0 && usuario) {
        const custo = paraNumero(form.custo_unitario)
        const { error: erroEntrada } = await db.entradas().insert({
          produto_id: produto.id,
          fornecedor_id: form.fornecedor_id || null,
          usuario_id: usuario.id,
          quantidade: quantidadeInicial,
          custo_unitario: custo || null,
          total: custo ? custo * quantidadeInicial : null,
          data_recebimento: format(new Date(), 'yyyy-MM-dd'),
          local_armazenamento: form.local_armazenamento || null,
          observacoes: 'Estoque inicial do cadastro',
          status: 'recebido',
        })
        if (erroEntrada) throw new Error(erroEntrada.message)
      }

      mostrarToast(`Produto "${form.nome.trim()}" cadastrado com sucesso!`, 'sucesso')
      onSalvo()
      onFechar()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
        mostrarToast(`O código "${codigoGerado}" já existe. Tente novamente.`, 'erro')
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
          {/* Código (gerado) + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Código <span className="text-gray-600">(gerado)</span>
              </label>
              <div
                title="Gerado automaticamente a partir da categoria"
                className="w-full bg-dark-hover border border-dark-border rounded-lg px-3 py-2 text-sm font-mono text-gray-300 cursor-not-allowed select-none"
              >
                {codigoGerado}
              </div>
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

          {/* Preço de venda — só habilita depois que o custo for informado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-gray-400">
                Venda por {custoInfo.nome}
              </label>
              <div className="flex items-center gap-0.5 bg-dark-hover border border-dark-border rounded-md p-0.5">
                {([['valor', 'R$'], ['percentual', '% sobre custo']] as const).map(([m, rotulo]) => (
                  <button
                    key={m}
                    type="button"
                    disabled={!custoPreenchido}
                    onClick={() => setModoVenda(m)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      modoVenda === m ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                disabled={!custoPreenchido}
                value={modoVenda === 'valor' ? form.venda_valor : form.venda_percentual}
                onChange={(e) => set(modoVenda === 'valor' ? 'venda_valor' : 'venda_percentual', sanitizarNumero(e.target.value, true))}
                placeholder={modoVenda === 'valor' ? '0,00' : '0'}
                className={`w-full bg-dark-bg border rounded-lg pl-3 pr-16 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  erros.venda_valor || erros.venda_percentual ? 'border-brand-red' : 'border-dark-border'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
                {modoVenda === 'valor' ? `R$/${custoInfo.abrev}` : '%'}
              </span>
            </div>
            {(erros.venda_valor || erros.venda_percentual) ? (
              <p className="text-xs text-brand-red mt-1">{erros.venda_valor || erros.venda_percentual}</p>
            ) : !custoPreenchido ? (
              <p className="text-[11px] text-gray-600 mt-1">Informe o custo acima para definir a venda.</p>
            ) : modoVenda === 'percentual' ? (
              <p className="text-[11px] text-gray-500 mt-1">
                Venda: <span className="text-brand-green font-semibold">{formatarMoeda(precoVenda)}</span> /{custoInfo.abrev}
              </p>
            ) : precoVenda > 0 && precoVenda >= custoNum ? (
              <p className="text-[11px] text-gray-500 mt-1">
                Margem: <span className="text-brand-green font-semibold">+{(((precoVenda - custoNum) / custoNum) * 100).toFixed(1).replace('.', ',')}%</span> sobre o custo
              </p>
            ) : null}
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
