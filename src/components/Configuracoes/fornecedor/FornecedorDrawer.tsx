import { useState, FormEvent, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  IconX, IconLoader2, IconBuilding, IconMapPin, IconReceipt2, IconPackage,
  IconChartBar, IconNotes, IconLoader, IconSearch,
} from '@tabler/icons-react'
import { db } from '../../../services/supabase'
import { useToast } from '../../shared/Toast'
import { sanitizarNumero, paraNumero } from '../../../utils/numero'
import { mascaraCNPJ, mascaraTelefone, mascaraCEP, emailValido, buscarCEP } from '../../../utils/mascaras'
import { AbaProdutos } from './AbaProdutos'
import { AbaIndicadores } from './AbaIndicadores'
import type { Fornecedor } from '../../../types'

type AbaId = 'dados' | 'endereco' | 'comercial' | 'produtos' | 'indicadores' | 'observacoes'

const ABAS: { id: AbaId; label: string; icone: typeof IconBuilding }[] = [
  { id: 'dados', label: 'Dados Básicos', icone: IconBuilding },
  { id: 'endereco', label: 'Endereço', icone: IconMapPin },
  { id: 'comercial', label: 'Comercial', icone: IconReceipt2 },
  { id: 'produtos', label: 'Produtos Fornecidos', icone: IconPackage },
  { id: 'indicadores', label: 'Indicadores', icone: IconChartBar },
  { id: 'observacoes', label: 'Observações', icone: IconNotes },
]

const CONDICOES_PADRAO = ['À vista', '7 dias', '15 dias', '30 dias', '30/60 dias', '30/60/90 dias']

interface FormFornecedor {
  nome: string
  representante: string
  cnpj: string
  inscricao_estadual: string
  telefone: string
  whatsapp: string
  email: string
  site: string
  ativo: boolean
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  prazo_entrega: string
  condicoes_pagamento: string
  pedido_minimo: string
  valor_minimo_compra: string
  desconto_padrao: string
  tipo_frete: string
  frete_gratis_acima: string
  observacoes: string
}

function formInicial(f: Fornecedor | null): FormFornecedor {
  return {
    nome: f?.nome ?? '',
    representante: f?.representante ?? '',
    cnpj: f?.cnpj ?? '',
    inscricao_estadual: f?.inscricao_estadual ?? '',
    telefone: f?.telefone ?? '',
    whatsapp: f?.whatsapp ?? '',
    email: f?.email ?? '',
    site: f?.site ?? '',
    ativo: f?.ativo ?? true,
    cep: f?.cep ?? '',
    endereco: f?.endereco ?? '',
    numero: f?.numero ?? '',
    complemento: f?.complemento ?? '',
    bairro: f?.bairro ?? '',
    cidade: f?.cidade ?? '',
    estado: f?.estado ?? '',
    prazo_entrega: f?.prazo_entrega != null ? String(f.prazo_entrega) : '',
    condicoes_pagamento: f?.condicoes_pagamento ?? '',
    pedido_minimo: f?.pedido_minimo != null ? String(f.pedido_minimo) : '',
    valor_minimo_compra: f?.valor_minimo_compra != null ? String(f.valor_minimo_compra) : '',
    desconto_padrao: f?.desconto_padrao != null ? String(f.desconto_padrao) : '',
    tipo_frete: f?.tipo_frete ?? '',
    frete_gratis_acima: f?.frete_gratis_acima != null ? String(f.frete_gratis_acima) : '',
    observacoes: f?.observacoes ?? '',
  }
}

const inputBase =
  'w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors'

// ─── Campo de texto reutilizável ──────────────────────────────────────────────
interface CampoProps {
  label: string
  valor: string
  onChange: (v: string) => void
  placeholder?: string
  tipo?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'tel' | 'url'
  obrigatorio?: boolean
  erro?: string
  dica?: ReactNode
  prefixo?: string
  sufixo?: string
}

function Campo({ label, valor, onChange, placeholder, tipo = 'text', inputMode, obrigatorio, erro, dica, prefixo, sufixo }: CampoProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label} {obrigatorio && <span className="text-brand-red">*</span>}
      </label>
      <div className="relative">
        {prefixo && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{prefixo}</span>}
        <input
          type={tipo}
          inputMode={inputMode}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputBase} ${prefixo ? 'pl-9' : ''} ${sufixo ? 'pr-12' : ''} ${erro ? 'border-brand-red' : ''}`}
        />
        {sufixo && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">{sufixo}</span>}
      </div>
      {erro && <p className="text-xs text-brand-red mt-1">{erro}</p>}
      {dica && !erro && <p className="text-xs text-gray-600 mt-1">{dica}</p>}
    </div>
  )
}

interface Props {
  editando: Fornecedor | null // null = criando
  onFechar: () => void
  onSalvo: () => void // refetch da lista de fundo (não fecha o drawer)
}

export function FornecedorDrawer({ editando, onFechar, onSalvo }: Props) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormFornecedor>(() => formInicial(editando))
  const [aba, setAba] = useState<AbaId>('dados')
  const [salvando, setSalvando] = useState(false)
  const [erros, setErros] = useState<Partial<Record<keyof FormFornecedor, string>>>({})
  const [buscandoCEP, setBuscandoCEP] = useState(false)
  // id do fornecedor "vivo": vem de editando ou do registro recém-criado
  const [idAtual, setIdAtual] = useState<string | null>(editando?.id ?? null)

  function set<K extends keyof FormFornecedor>(campo: K, valor: FormFornecedor[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: undefined }))
  }

  async function preencherPorCEP() {
    setBuscandoCEP(true)
    const end = await buscarCEP(form.cep)
    setBuscandoCEP(false)
    if (!end) {
      mostrarToast('CEP não encontrado.', 'aviso')
      return
    }
    setForm((prev) => ({
      ...prev,
      endereco: end.logradouro || prev.endereco,
      bairro: end.bairro || prev.bairro,
      cidade: end.cidade || prev.cidade,
      estado: end.estado || prev.estado,
    }))
  }

  function validar(): boolean {
    const novos: typeof erros = {}
    if (!form.nome.trim()) novos.nome = 'Nome da empresa é obrigatório'
    if (form.email.trim() && !emailValido(form.email)) novos.email = 'E-mail inválido'
    setErros(novos)
    if (novos.nome || novos.email) {
      setAba('dados') // leva o usuário ao campo com erro
      return false
    }
    return true
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      representante: form.representante.trim() || null,
      cnpj: form.cnpj.trim() || null,
      inscricao_estadual: form.inscricao_estadual.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      email: form.email.trim() || null,
      site: form.site.trim() || null,
      ativo: form.ativo,
      cep: form.cep.trim() || null,
      endereco: form.endereco.trim() || null,
      numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim() || null,
      prazo_entrega: form.prazo_entrega ? paraNumero(form.prazo_entrega) : null,
      condicoes_pagamento: form.condicoes_pagamento.trim() || null,
      pedido_minimo: form.pedido_minimo ? paraNumero(form.pedido_minimo) : null,
      valor_minimo_compra: form.valor_minimo_compra ? paraNumero(form.valor_minimo_compra) : null,
      desconto_padrao: form.desconto_padrao ? paraNumero(form.desconto_padrao) : null,
      tipo_frete: form.tipo_frete || null,
      frete_gratis_acima: form.frete_gratis_acima ? paraNumero(form.frete_gratis_acima) : null,
      observacoes: form.observacoes.trim() || null,
    }

    if (idAtual) {
      const { error } = await db.fornecedores().update(payload).eq('id', idAtual)
      if (error) mostrarToast(`Erro ao salvar: ${error.message}`, 'erro')
      else { mostrarToast('Fornecedor atualizado!', 'sucesso'); onSalvo() }
    } else {
      const { data, error } = await db.fornecedores().insert(payload).select('id').single()
      if (error) {
        mostrarToast(`Erro ao salvar: ${error.message}`, 'erro')
      } else {
        setIdAtual((data as { id: string }).id)
        mostrarToast('Fornecedor cadastrado! Já pode vincular produtos.', 'sucesso')
        onSalvo()
      }
    }
    setSalvando(false)
  }

  // Opções de condição de pagamento: padrões + o valor atual, se for customizado
  const opcoesCondicao = form.condicoes_pagamento && !CONDICOES_PADRAO.includes(form.condicoes_pagamento)
    ? [form.condicoes_pagamento, ...CONDICOES_PADRAO]
    : CONDICOES_PADRAO

  const drawer = (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFechar} />

      <form
        onSubmit={salvar}
        className="relative w-full max-w-4xl h-full bg-dark-card border-l border-dark-border shadow-2xl flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-brand-blue/15 rounded-lg flex items-center justify-center shrink-0">
              <IconBuilding size={18} className="text-brand-blue" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {form.nome.trim() || (idAtual ? 'Editar fornecedor' : 'Novo fornecedor')}
              </h2>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${form.ativo ? 'text-brand-green' : 'text-gray-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${form.ativo ? 'bg-brand-green' : 'bg-gray-500'}`} />
                {form.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <button type="button" onClick={onFechar} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-dark-hover transition-colors shrink-0">
            <IconX size={18} />
          </button>
        </div>

        {/* Navegação por abas */}
        <div className="flex gap-1 px-4 pt-3 border-b border-dark-border overflow-x-auto shrink-0">
          {ABAS.map((a) => {
            const Icone = a.icone
            const ativa = aba === a.id
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAba(a.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors border-b-2 ${
                  ativa ? 'text-brand-blue border-brand-blue' : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <Icone size={16} />
                {a.label}
              </button>
            )
          })}
        </div>

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Dados Básicos ── */}
          {aba === 'dados' && (
            <div className="space-y-4">
              <Campo label="Nome da empresa" obrigatorio valor={form.nome} onChange={(v) => set('nome', v)} placeholder="Ex: TechParts Brasil Ltda" erro={erros.nome} />
              <Campo label="Nome do representante" valor={form.representante} onChange={(v) => set('representante', v)} placeholder="Ex: João Silva" />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="CNPJ" valor={form.cnpj} onChange={(v) => set('cnpj', mascaraCNPJ(v))} placeholder="00.000.000/0000-00" inputMode="numeric" />
                <Campo label="Inscrição Estadual" valor={form.inscricao_estadual} onChange={(v) => set('inscricao_estadual', v)} placeholder="Isento ou número" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Telefone" valor={form.telefone} onChange={(v) => set('telefone', mascaraTelefone(v))} placeholder="(00) 0000-0000" inputMode="tel" />
                <Campo label="WhatsApp" valor={form.whatsapp} onChange={(v) => set('whatsapp', mascaraTelefone(v))} placeholder="(00) 00000-0000" inputMode="tel" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="E-mail" valor={form.email} onChange={(v) => set('email', v)} placeholder="contato@empresa.com" inputMode="email" tipo="email" erro={erros.email} />
                <Campo label="Site" valor={form.site} onChange={(v) => set('site', v)} placeholder="www.empresa.com.br" inputMode="url" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <div className="flex gap-2">
                  {[{ v: true, l: 'Ativo' }, { v: false, l: 'Inativo' }].map((opt) => (
                    <button
                      key={opt.l}
                      type="button"
                      onClick={() => set('ativo', opt.v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                        form.ativo === opt.v
                          ? opt.v ? 'bg-brand-green/15 border-brand-green text-brand-green' : 'bg-gray-500/15 border-gray-500 text-gray-300'
                          : 'border-dark-border text-gray-400 hover:bg-dark-hover'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Endereço ── */}
          {aba === 'endereco' && (
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                <Campo label="CEP" valor={form.cep} onChange={(v) => set('cep', mascaraCEP(v))} placeholder="00000-000" inputMode="numeric" dica="Preencha o CEP e busque o endereço automaticamente." />
                <button
                  type="button"
                  onClick={preencherPorCEP}
                  disabled={buscandoCEP}
                  className="h-[38px] px-3 rounded-lg text-sm font-semibold bg-brand-blue/15 text-brand-blue hover:bg-brand-blue/25 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {buscandoCEP ? <IconLoader size={15} className="animate-spin" /> : <IconSearch size={15} />}
                  Buscar
                </button>
              </div>
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Campo label="Rua" valor={form.endereco} onChange={(v) => set('endereco', v)} placeholder="Av. Paulista" />
                <Campo label="Número" valor={form.numero} onChange={(v) => set('numero', v)} placeholder="123" />
              </div>
              <Campo label="Complemento" valor={form.complemento} onChange={(v) => set('complemento', v)} placeholder="Sala, andar, bloco..." />
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Bairro" valor={form.bairro} onChange={(v) => set('bairro', v)} placeholder="Centro" />
                <Campo label="Cidade" valor={form.cidade} onChange={(v) => set('cidade', v)} placeholder="São Paulo" />
              </div>
              <div className="max-w-[120px]">
                <Campo label="Estado (UF)" valor={form.estado} onChange={(v) => set('estado', v.toUpperCase().slice(0, 2))} placeholder="SP" />
              </div>
            </div>
          )}

          {/* ── Comercial ── */}
          {aba === 'comercial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Prazo médio de entrega" valor={form.prazo_entrega} onChange={(v) => set('prazo_entrega', sanitizarNumero(v))} placeholder="0" inputMode="numeric" sufixo="dias" />
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Condição de pagamento</label>
                  <select
                    value={form.condicoes_pagamento}
                    onChange={(e) => set('condicoes_pagamento', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">Selecione...</option>
                    {opcoesCondicao.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Pedido mínimo" valor={form.pedido_minimo} onChange={(v) => set('pedido_minimo', sanitizarNumero(v))} placeholder="0" inputMode="numeric" sufixo="un" />
                <Campo label="Valor mínimo de compra" valor={form.valor_minimo_compra} onChange={(v) => set('valor_minimo_compra', sanitizarNumero(v, true))} placeholder="0,00" inputMode="decimal" prefixo="R$" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Campo label="Desconto padrão" valor={form.desconto_padrao} onChange={(v) => set('desconto_padrao', sanitizarNumero(v, true))} placeholder="0" inputMode="decimal" sufixo="%" />
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Tipo de frete</label>
                  <select
                    value={form.tipo_frete}
                    onChange={(e) => set('tipo_frete', e.target.value)}
                    className={inputBase}
                  >
                    <option value="">Selecione...</option>
                    <option value="CIF">CIF (por conta do fornecedor)</option>
                    <option value="FOB">FOB (por conta do comprador)</option>
                    <option value="gratis">Frete grátis</option>
                    <option value="combinar">A combinar</option>
                  </select>
                </div>
              </div>
              <Campo label="Frete grátis acima de" valor={form.frete_gratis_acima} onChange={(v) => set('frete_gratis_acima', sanitizarNumero(v, true))} placeholder="0,00" inputMode="decimal" prefixo="R$" dica="Valor de compra a partir do qual o frete é gratuito." />
            </div>
          )}

          {/* ── Produtos Fornecidos ── */}
          {aba === 'produtos' && <AbaProdutos fornecedorId={idAtual} />}

          {/* ── Indicadores ── */}
          {aba === 'indicadores' && (
            <AbaIndicadores fornecedorId={idAtual} prazoInformado={form.prazo_entrega ? paraNumero(form.prazo_entrega) : null} />
          )}

          {/* ── Observações ── */}
          {aba === 'observacoes' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-400">Observações internas</label>
              <textarea
                value={form.observacoes}
                onChange={(e) => set('observacoes', e.target.value)}
                rows={10}
                placeholder={'Ex.:\n- Entrega apenas pela manhã\n- Frete grátis acima de R$ 1.000\n- Representante responde rápido pelo WhatsApp\n- Fornecedor preferencial'}
                className={`${inputBase} resize-none leading-relaxed`}
              />
              <p className="text-xs text-gray-600">Anotações livres visíveis apenas para a equipe.</p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-dark-border shrink-0">
          <p className="text-xs text-gray-600">
            {idAtual ? 'Editando cadastro existente' : 'Preencha os dados e salve para liberar Produtos e Indicadores'}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onFechar} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors">
              Fechar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-brand-blue/20"
            >
              {salvando && <IconLoader2 size={14} className="animate-spin" />}
              {idAtual ? 'Salvar alterações' : 'Cadastrar fornecedor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )

  return createPortal(drawer, document.body)
}
