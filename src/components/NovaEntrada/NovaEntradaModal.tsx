// Modal de Nova Entrada de Estoque

import { useState, useMemo } from 'react';
import { IconX, IconCheck, IconSearch } from '@tabler/icons-react';
import type { ProdutoComEstoque, Fornecedor, NovaEntradaForm } from '../../types';

interface NovaEntradaModalProps {
  produtos: ProdutoComEstoque[];
  fornecedores: Fornecedor[];
  onConfirmar: (dados: Omit<import('../../types').Entrada, 'id' | 'created_at' | 'sincronizado'>) => Promise<void>;
  onFechar: () => void;
}

const formInicial: NovaEntradaForm = {
  produto_id: '',
  quantidade: 0,
  custo_unitario: 0,
  fornecedor_id: '',
  data_recebimento: new Date().toISOString().slice(0, 10),
  nf_numero: '',
  local_armazenamento: '',
  observacoes: '',
};

export function NovaEntradaModal({
  produtos, fornecedores, onConfirmar, onFechar,
}: NovaEntradaModalProps) {
  const [form, setForm] = useState<NovaEntradaForm>(formInicial);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [etapa, setEtapa] = useState<'form' | 'sucesso'>('form');

  const total = form.quantidade * form.custo_unitario;

  const produtosFiltrados = useMemo(() => {
    if (!buscaProduto) return produtos;
    const q = buscaProduto.toLowerCase();
    return produtos.filter(p =>
      p.nome.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
    );
  }, [produtos, buscaProduto]);

  const produtoSelecionado = produtos.find(p => p.id === form.produto_id);

  const campo = (key: keyof NovaEntradaForm) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = ['quantidade', 'custo_unitario'].includes(key)
        ? parseFloat(e.target.value) || 0
        : e.target.value;
      setForm(f => ({ ...f, [key]: value }));
    }
  );

  const handleConfirmar = async () => {
    if (!form.produto_id || !form.fornecedor_id || form.quantidade <= 0) return;

    setSalvando(true);
    try {
      const forn = fornecedores.find(f => f.id === form.fornecedor_id);
      await onConfirmar({
        produto_id: form.produto_id,
        produto_nome: produtoSelecionado?.nome,
        fornecedor_id: form.fornecedor_id,
        fornecedor_nome: forn?.nome,
        quantidade: form.quantidade,
        custo_unitario: form.custo_unitario,
        total,
        nf_numero: form.nf_numero || undefined,
        data_recebimento: form.data_recebimento,
        local_armazenamento: form.local_armazenamento || undefined,
        observacoes: form.observacoes || undefined,
      });
      setEtapa('sucesso');
    } finally {
      setSalvando(false);
    }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg bg-[#0f0f0f] border border-[var(--color-border)]
    text-white text-sm focus:border-teal-500 focus:outline-none transition-colors placeholder-neutral-600`;
  const labelCls = 'block text-xs text-neutral-400 mb-1.5';

  // Tela de sucesso
  if (etapa === 'sucesso') {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl
          w-full max-w-sm shadow-2xl text-center p-8 animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border-2 border-teal-500
            flex items-center justify-center mx-auto mb-4">
            <IconCheck size={32} className="text-teal-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Entrada registrada!</h2>
          <p className="text-sm text-neutral-400 mb-2">
            <span className="text-white font-medium">{produtoSelecionado?.nome}</span>
          </p>
          <p className="text-2xl font-bold text-teal-400 mb-6">
            +{form.quantidade}{produtoSelecionado?.unidade} &bull;{' '}
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <button
            onClick={onFechar}
            className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl
        w-full max-w-xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        {/* Header do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-base font-semibold text-white">Nova Entrada</h2>
          <button onClick={onFechar} className="text-neutral-400 hover:text-white transition-colors">
            <IconX size={20} />
          </button>
        </div>

        {/* Corpo do modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Produto */}
          <div>
            <label className={labelCls}>Produto *</label>
            <div className="space-y-2">
              <div className="relative">
                <IconSearch size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={buscaProduto}
                  onChange={e => setBuscaProduto(e.target.value)}
                  placeholder="Buscar produto..."
                  className={`${inputCls} pl-9`}
                />
              </div>
              <select
                value={form.produto_id}
                onChange={campo('produto_id')}
                className={inputCls}
                size={Math.min(produtosFiltrados.length + 1, 5)}
              >
                <option value="">â€” selecione o produto â€”</option>
                {produtosFiltrados.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo}] {p.nome} â€” {p.quantidade}{p.unidade} em estoque
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantidade + Custo + Total */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>
                Quantidade {produtoSelecionado ? `(${produtoSelecionado.unidade})` : ''}
              </label>
              <input
                type="number" min="0" step="0.01"
                value={form.quantidade || ''}
                onChange={campo('quantidade')}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelCls}>Custo unitÃ¡rio (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={form.custo_unitario || ''}
                onChange={campo('custo_unitario')}
                className={inputCls}
                placeholder="0,00"
              />
            </div>
            <div>
              <label className={labelCls}>Total calculado</label>
              <div className={`${inputCls} bg-teal-950/30 border-teal-900/50 font-semibold text-teal-400 cursor-default`}>
                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Fornecedor */}
          <div>
            <label className={labelCls}>Fornecedor *</label>
            <select value={form.fornecedor_id} onChange={campo('fornecedor_id')} className={inputCls}>
              <option value="">â€” selecione o fornecedor â€”</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>

          {/* Data + Nota Fiscal */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Data de recebimento</label>
              <input
                type="date"
                value={form.data_recebimento}
                onChange={campo('data_recebimento')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>NÃºmero da nota fiscal</label>
              <input
                type="text"
                value={form.nf_numero}
                onChange={campo('nf_numero')}
                placeholder="NF-000000"
                className={inputCls}
              />
            </div>
          </div>

          {/* Local de armazenamento */}
          <div>
            <label className={labelCls}>Local de armazenamento</label>
            <input
              type="text"
              value={form.local_armazenamento}
              onChange={campo('local_armazenamento')}
              placeholder="Setor A, Prateleira 1..."
              className={inputCls}
            />
          </div>

          {/* ObservaÃ§Ãµes */}
          <div>
            <label className={labelCls}>ObservaÃ§Ãµes</label>
            <textarea
              value={form.observacoes}
              onChange={campo('observacoes')}
              rows={2}
              placeholder="InformaÃ§Ãµes adicionais..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] shrink-0">
          <div className="text-xs text-neutral-500">
            {produtoSelecionado && (
              <>Estoque atual: <span className="text-white">{produtoSelecionado.quantidade}{produtoSelecionado.unidade}</span></>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onFechar}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={salvando || !form.produto_id || !form.fornecedor_id || form.quantidade <= 0}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500
                text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconCheck size={16} />
              {salvando ? 'Salvando...' : 'Confirmar entrada'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

