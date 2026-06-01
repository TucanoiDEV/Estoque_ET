import { useState, useEffect, FormEvent } from 'react'
import { IconTruck, IconTrash, IconEdit, IconLoader2, IconPlus } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import type { Fornecedor } from '../../types'

interface FormFornecedor {
  nome: string
  contato: string
  prazo_entrega: string
  condicoes_pagamento: string
}

const FORM_VAZIO: FormFornecedor = { nome: '', contato: '', prazo_entrega: '', condicoes_pagamento: '' }

interface ModalProps {
  editando: Fornecedor | null // null = criando
  onFechar: () => void
  onSalvo: () => void
}

function ModalFornecedor({ editando, onFechar, onSalvo }: ModalProps) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormFornecedor>(
    editando
      ? {
          nome: editando.nome,
          contato: editando.contato ?? '',
          prazo_entrega: editando.prazo_entrega != null ? String(editando.prazo_entrega) : '',
          condicoes_pagamento: editando.condicoes_pagamento ?? '',
        }
      : FORM_VAZIO
  )
  const [salvando, setSalvando] = useState(false)
  const [erroNome, setErroNome] = useState('')

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErroNome('Nome é obrigatório')
      return
    }
    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      contato: form.contato.trim() || null,
      prazo_entrega: form.prazo_entrega ? paraNumero(form.prazo_entrega) : null,
      condicoes_pagamento: form.condicoes_pagamento.trim() || null,
    }
    const { error } = editando
      ? await db.fornecedores().update(payload).eq('id', editando.id)
      : await db.fornecedores().insert(payload)

    if (error) {
      mostrarToast(`Erro ao salvar: ${error.message}`, 'erro')
    } else {
      mostrarToast(editando ? 'Fornecedor atualizado!' : 'Fornecedor cadastrado!', 'sucesso')
      onSalvo()
    }
    setSalvando(false)
  }

  const inputBase =
    'w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={salvar} className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white">{editando ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Nome <span className="text-brand-red">*</span>
          </label>
          <input
            autoFocus
            value={form.nome}
            onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErroNome('') }}
            placeholder="Ex: TechParts Brasil"
            className={`${inputBase} ${erroNome ? 'border-brand-red' : ''}`}
          />
          {erroNome && <p className="text-xs text-brand-red mt-1">{erroNome}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Contato</label>
          <input
            value={form.contato}
            onChange={(e) => setForm({ ...form, contato: e.target.value })}
            placeholder="email ou telefone"
            className={inputBase}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Prazo de entrega (dias)</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.prazo_entrega}
              onChange={(e) => setForm({ ...form, prazo_entrega: sanitizarNumero(e.target.value) })}
              placeholder="0"
              className={inputBase}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Condições de pagamento</label>
            <input
              value={form.condicoes_pagamento}
              onChange={(e) => setForm({ ...form, condicoes_pagamento: e.target.value })}
              placeholder="Ex: 30/60 dias"
              className={inputBase}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onFechar}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-gray-400 border border-dark-border hover:bg-dark-hover transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="flex-1 py-2 rounded-lg text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {salvando && <IconLoader2 size={14} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  )
}

export function FornecedoresSection() {
  const { mostrarToast } = useToast()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ aberto: boolean; editando: Fornecedor | null }>({ aberto: false, editando: null })
  const [excluindo, setExcluindo] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    const { data } = await db.fornecedores().select('*').order('nome')
    setFornecedores((data as Fornecedor[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function excluir(f: Fornecedor) {
    if (!confirm(`Excluir o fornecedor "${f.nome}"?`)) return
    setExcluindo(f.id)
    const { error } = await db.fornecedores().delete().eq('id', f.id)

    if (error) {
      // 23503 = violação de chave estrangeira (fornecedor tem entradas vinculadas)
      if (error.code === '23503' || /foreign key/i.test(error.message)) {
        mostrarToast('Este fornecedor possui entradas vinculadas e não pode ser excluído.', 'aviso')
      } else {
        mostrarToast(`Erro ao excluir: ${error.message}`, 'erro')
      }
    } else {
      mostrarToast(`Fornecedor "${f.nome}" excluído.`, 'sucesso')
      carregar()
    }
    setExcluindo(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconTruck size={20} className="text-brand-blue" />
          <div>
            <h3 className="text-base font-semibold text-white">Fornecedores</h3>
            <p className="text-xs text-gray-500">Gerencie os fornecedores do estoque</p>
          </div>
        </div>
        <button
          onClick={() => setModal({ aberto: true, editando: null })}
          className="flex items-center gap-1.5 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <IconPlus size={16} />
          Novo fornecedor
        </button>
      </div>

      {modal.aberto && (
        <ModalFornecedor
          editando={modal.editando}
          onFechar={() => setModal({ aberto: false, editando: null })}
          onSalvo={() => { setModal({ aberto: false, editando: null }); carregar() }}
        />
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 bg-dark-hover rounded-xl" />)}
        </div>
      ) : fornecedores.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">Nenhum fornecedor cadastrado.</div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border">
                {['Nome', 'Contato', 'Prazo', 'Condições', ''].map((col) => (
                  <th key={col} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((f) => (
                <tr key={f.id} className="border-b border-dark-border/50 hover:bg-dark-hover/40">
                  <td className="px-5 py-3.5 font-medium text-white">{f.nome}</td>
                  <td className="px-5 py-3.5 text-gray-400">{f.contato ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400">{f.prazo_entrega != null ? `${f.prazo_entrega} dias` : '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400">{f.condicoes_pagamento ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModal({ aberto: true, editando: f })}
                        title="Editar"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-blue hover:bg-brand-blue/10"
                      >
                        <IconEdit size={15} />
                      </button>
                      <button
                        onClick={() => excluir(f)}
                        disabled={excluindo === f.id}
                        title="Excluir"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-red hover:bg-brand-red/10 disabled:opacity-40"
                      >
                        {excluindo === f.id ? <IconLoader2 size={15} className="animate-spin" /> : <IconTrash size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
