// SeÃ§Ã£o de Categorias nas ConfiguraÃ§Ãµes

import { useState } from 'react';
import { IconCategory, IconPlus, IconTrash, IconX, IconCheck } from '@tabler/icons-react';
import type { Categoria } from '../../types';

interface ConfigCategoriasProps {
  categorias: Categoria[];
  onCriar: (nome: string) => Promise<void>;
  onDeletar: (id: string) => Promise<void>;
}

export function ConfigCategorias({ categorias, onCriar, onDeletar }: ConfigCategoriasProps) {
  const [novoNome, setNovoNome] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAdicionar = async () => {
    if (!novoNome.trim()) return;
    setSalvando(true);
    try {
      await onCriar(novoNome.trim());
      setNovoNome('');
      setAdicionando(false);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <IconCategory size={18} className="text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Categorias de Tecidos</h3>
        </div>
        <button
          onClick={() => setAdicionando(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-teal-400
            border border-teal-500/30 hover:bg-teal-500/10 transition-colors"
        >
          <IconPlus size={14} />
          Nova categoria
        </button>
      </div>

      {/* Campo para nova categoria */}
      {adicionando && (
        <div className="flex items-center gap-2 mb-4 animate-slide-up">
          <input
            type="text"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdicionar()}
            placeholder="Nome da categoria..."
            autoFocus
            className="flex-1 px-3 py-2 rounded-lg bg-[#111] border border-teal-500/50
              text-white text-sm focus:outline-none"
          />
          <button
            onClick={handleAdicionar} disabled={salvando || !novoNome.trim()}
            className="p-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white
              disabled:opacity-50 transition-colors"
          >
            <IconCheck size={16} />
          </button>
          <button
            onClick={() => { setAdicionando(false); setNovoNome(''); }}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Lista de categorias */}
      <div className="flex flex-wrap gap-2">
        {categorias.map(cat => (
          <div
            key={cat.id}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111]
              border border-[var(--color-border)] hover:border-neutral-600 transition-colors"
          >
            <span className="text-sm text-neutral-200">{cat.nome}</span>
            <button
              onClick={() =>
                confirmDelete === cat.id
                  ? (onDeletar(cat.id), setConfirmDelete(null))
                  : setConfirmDelete(cat.id)
              }
              className={`opacity-0 group-hover:opacity-100 transition-all ${
                confirmDelete === cat.id ? 'text-red-400' : 'text-neutral-500 hover:text-red-400'
              }`}
              title={confirmDelete === cat.id ? 'Confirmar remoÃ§Ã£o' : 'Remover'}
            >
              <IconTrash size={12} />
            </button>
          </div>
        ))}

        {categorias.length === 0 && (
          <p className="text-sm text-neutral-500">Nenhuma categoria cadastrada</p>
        )}
      </div>
    </div>
  );
}

