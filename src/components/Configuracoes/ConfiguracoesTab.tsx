// Aba principal de ConfiguraÃ§Ãµes com sub-abas

import { useState } from 'react';
import type { ConfiguracaoApp, Fornecedor, Categoria, Usuario, AbaConfig } from '../../types';
import { ConfigGeral } from './ConfigGeral';
import { ConfigFornecedores } from './ConfigFornecedores';
import { ConfigCategorias } from './ConfigCategorias';

interface ConfiguracoesTabProps {
  config: ConfiguracaoApp;
  fornecedores: Fornecedor[];
  categorias: Categoria[];
  usuarios: Usuario[];
  tema: 'claro' | 'escuro';
  onSalvarConfig: (config: ConfiguracaoApp) => Promise<void>;
  onAlternarTema: () => void;
  onCriarFornecedor: (dados: Omit<Fornecedor, 'id' | 'created_at'>) => Promise<void>;
  onDeletarFornecedor: (id: string) => Promise<void>;
  onCriarCategoria: (nome: string) => Promise<void>;
  onDeletarCategoria: (id: string) => Promise<void>;
}

const subAbas: { id: AbaConfig; label: string }[] = [
  { id: 'geral',        label: 'Geral' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'categorias',   label: 'Categorias' },
];

export function ConfiguracoesTab({
  config, fornecedores, categorias, usuarios, tema,
  onSalvarConfig, onAlternarTema,
  onCriarFornecedor, onDeletarFornecedor,
  onCriarCategoria, onDeletarCategoria,
}: ConfiguracoesTabProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaConfig>('geral');

  return (
    <div>
      <nav className="flex gap-6 border-b border-[var(--color-border)] mb-6">
        {subAbas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`pb-3 pt-1 text-sm font-medium border-b-2 transition-all -mb-px ${
              abaAtiva === aba.id
                ? 'text-teal-400 border-teal-400'
                : 'text-neutral-400 border-transparent hover:text-neutral-200'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </nav>

      {abaAtiva === 'geral' && (
        <ConfigGeral
          config={config}
          usuarios={usuarios}
          tema={tema}
          onSalvar={onSalvarConfig}
          onAlternarTema={onAlternarTema}
        />
      )}

      {abaAtiva === 'fornecedores' && (
        <ConfigFornecedores
          fornecedores={fornecedores}
          onCriar={onCriarFornecedor}
          onDeletar={onDeletarFornecedor}
        />
      )}

      {abaAtiva === 'categorias' && (
        <ConfigCategorias
          categorias={categorias}
          onCriar={onCriarCategoria}
          onDeletar={onDeletarCategoria}
        />
      )}
    </div>
  );
}

