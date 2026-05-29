// SeÃ§Ã£o de Fornecedores nas ConfiguraÃ§Ãµes

import { useState } from 'react';
import { IconUsers, IconPlus, IconTrash, IconX, IconCheck } from '@tabler/icons-react';
import type { Fornecedor } from '../../types';

interface ConfigFornecedoresProps {
  fornecedores: Fornecedor[];
  onCriar: (dados: Omit<Fornecedor, 'id' | 'created_at'>) => Promise<void>;
  onDeletar: (id: string) => Promise<void>;
}

interface FornecedorForm {
  nome: string;
  contato: string;
  email: string;
  prazo_entrega: string;
  condicoes_pagamento: string;
}

const formVazio: FornecedorForm = {
  nome: '', contato: '', email: '', prazo_entrega: '', condicoes_pagamento: '',
};

export function ConfigFornecedores({ fornecedores, onCriar, onDeletar }: ConfigFornecedoresProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FornecedorForm>(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const campo = (key: keyof FornecedorForm) => (
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  );

  const handleSalvar = async () => {
    if (!form.nome.trim()) return;
    setSalvando(true);
    try {
      await onCriar({
        nome: form.nome,
        contato: form.contato || undefined,
        email: form.email || undefined,
        prazo_entrega: form.prazo_entrega ? parseInt(form.prazo_entrega) : undefined,
        condicoes_pagamento: form.condicoes_pagamento || undefined,
        ativo: true,
      });
      setForm(formVazio);
      setModalAberto(false);
    } finally {
      setSalvando(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg bg-[#111] border border-[var(--color-border)]
    text-white text-sm focus:border-teal-500 focus:outline-none transition-colors`;
  const labelCls = 'block text-xs text-neutral-400 mb-1';

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconUsers size={18} className="text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Fornecedores</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{fornecedores.length} fornecedores</span>
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-teal-400
              border border-teal-500/30 hover:bg-teal-500/10 transition-colors"
          >
            <IconPlus size={14} />
            Adicionar
          </button>
        </div>
      </div>

      {/* Lista de fornecedores */}
      <div className="flex flex-wrap gap-2 mb-4">
        {fornecedores.map(f => (
          <div
            key={f.id}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111]
              border border-[var(--color-border)] hover:border-neutral-600 transition-colors"
          >
            <span className="text-sm text-neutral-200">{f.nome}</span>
            <button
              onClick={() =>
                confirmDelete === f.id
                  ? (onDeletar(f.id), setConfirmDelete(null))
                  : setConfirmDelete(f.id)
              }
              className={`opacity-0 group-hover:opacity-100 transition-all ${
                confirmDelete === f.id ? 'text-red-400' : 'text-neutral-500 hover:text-red-400'
              }`}
              title={confirmDelete === f.id ? 'Confirmar remoÃ§Ã£o' : 'Remover'}
            >
              <IconTrash size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Detalhes dos fornecedores */}
      <div className="space-y-2">
        {fornecedores.map(f => (
          <div key={f.id}
            className="p-3 rounded-lg bg-[#111] border border-[var(--color-border)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">{f.nome}</p>
                {f.email && (
                  <p className="text-xs text-neutral-400 mt-0.5">{f.email}</p>
                )}
              </div>
              <div className="text-right">
                {f.contato && (
                  <p className="text-xs text-neutral-400">{f.contato}</p>
                )}
                {f.prazo_entrega && (
                  <p className="text-xs text-neutral-500 mt-0.5">Prazo: {f.prazo_entrega} dias</p>
                )}
              </div>
            </div>
            {f.condicoes_pagamento && (
              <p className="text-xs text-neutral-500 mt-1">Pagamento: {f.condicoes_pagamento}</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal de novo fornecedor */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold text-white">Novo Fornecedor</h2>
              <button onClick={() => setModalAberto(false)}
                className="text-neutral-400 hover:text-white transition-colors">
                <IconX size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={labelCls}>Nome *</label>
                <input className={inputCls} value={form.nome} onChange={campo('nome')} />
              </div>
              <div>
                <label className={labelCls}>E-mail</label>
                <input className={inputCls} type="email" value={form.email} onChange={campo('email')} />
              </div>
              <div>
                <label className={labelCls}>Telefone / WhatsApp</label>
                <input className={inputCls} value={form.contato} onChange={campo('contato')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Prazo de entrega (dias)</label>
                  <input className={inputCls} type="number" value={form.prazo_entrega}
                    onChange={campo('prazo_entrega')} />
                </div>
                <div>
                  <label className={labelCls}>CondiÃ§Ãµes de pagamento</label>
                  <input className={inputCls} value={form.condicoes_pagamento}
                    onChange={campo('condicoes_pagamento')} placeholder="30 dias" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-[var(--color-border)]">
              <button onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSalvar} disabled={salvando || !form.nome}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500
                  text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <IconCheck size={15} />
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

