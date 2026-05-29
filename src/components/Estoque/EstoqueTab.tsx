// Aba de Estoque com tabela, busca, filtros e aÃ§Ãµes CRUD

import { useState, useMemo, useRef } from 'react';
import {
  IconPlus, IconSearch, IconPencil, IconTrash, IconHistory,
  IconChevronDown, IconX, IconCheck, IconAlertTriangle, IconAlertCircle,
} from '@tabler/icons-react';
import type { ProdutoComEstoque, Fornecedor, Categoria, StatusEstoque } from '../../types';

interface EstoqueTabProps {
  produtos: ProdutoComEstoque[];
  fornecedores: Fornecedor[];
  categorias: Categoria[];
  onCriarProduto: (dados: Omit<ProdutoComEstoque, 'id' | 'created_at' | 'status'>) => Promise<void>;
  onAtualizarProduto: (id: string, dados: Partial<ProdutoComEstoque>) => Promise<void>;
  onDeletarProduto: (id: string) => Promise<void>;
}

// Cores dos badges de tipo de tecido
const tipoCores: Record<string, string> = {
  'Algodão': 'bg-violet-900/60 text-violet-300 border-violet-700/30',
  Seda:           'bg-blue-900/60 text-blue-300 border-blue-700/30',
  Linho:          'bg-emerald-900/60 text-emerald-300 border-emerald-700/30',
  Malha:          'bg-slate-700/60 text-slate-300 border-slate-600/30',
  Cetim:          'bg-pink-900/60 text-pink-300 border-pink-700/30',
  Tricoline:      'bg-orange-900/60 text-orange-300 border-orange-700/30',
  Oxford:         'bg-indigo-900/60 text-indigo-300 border-indigo-700/30',
  Viscose:        'bg-teal-900/60 text-teal-300 border-teal-700/30',
  Crepe:          'bg-amber-900/60 text-amber-300 border-amber-700/30',
  Jeans:          'bg-blue-950/60 text-blue-400 border-blue-800/30',
  'Unitário': 'bg-green-900/60 text-green-300 border-green-700/30',
  Voil:           'bg-cyan-900/60 text-cyan-300 border-cyan-700/30',
};

function BadgeTipo({ tipo }: { tipo: string }) {
  const cor = tipoCores[tipo] ?? 'bg-neutral-800 text-neutral-300 border-neutral-700/30';
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${cor}`}>
      {tipo}
    </span>
  );
}

function BadgeStatus({ status }: { status: StatusEstoque }) {
  if (status === 'normal') return null;
  return status === 'critico' ? (
    <IconAlertCircle size={14} className="text-red-400 inline ml-1" />
  ) : (
    <IconAlertTriangle size={14} className="text-yellow-400 inline ml-1" />
  );
}

// Modal de cadastro/ediÃ§Ã£o de produto
interface ProdutoForm {
  codigo: string;
  nome: string;
  categoria: string;
  tipo: string;
  unidade: string;
  custo_unitario: string;
  estoque_minimo: string;
  quantidade: string;
  fornecedor_id: string;
  local_armazenamento: string;
  cor: string;
}

const formVazio: ProdutoForm = {
  codigo: '', nome: '', categoria: '', tipo: '', unidade: 'm',
  custo_unitario: '', estoque_minimo: '', quantidade: '',
  fornecedor_id: '', local_armazenamento: '', cor: '',
};

function ModalProduto({
  produto, fornecedores, categorias, onSalvar, onFechar,
}: {
  produto: ProdutoComEstoque | null;
  fornecedores: Fornecedor[];
  categorias: Categoria[];
  onSalvar: (f: ProdutoForm) => Promise<void>;
  onFechar: () => void;
}) {
  const [form, setForm] = useState<ProdutoForm>(
    produto
      ? {
          codigo: produto.codigo, nome: produto.nome,
          categoria: produto.categoria, tipo: produto.tipo,
          unidade: produto.unidade, custo_unitario: String(produto.custo_unitario),
          estoque_minimo: String(produto.estoque_minimo),
          quantidade: String(produto.quantidade),
          fornecedor_id: produto.fornecedor_id ?? '',
          local_armazenamento: produto.local_armazenamento ?? '',
          cor: produto.cor ?? '',
        }
      : formVazio
  );
  const [salvando, setSalvando] = useState(false);

  const campo = (key: keyof ProdutoForm) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  );

  const handleSalvar = async () => {
    setSalvando(true);
    try { await onSalvar(form); }
    finally { setSalvando(false); }
  };

  const inputCls = `w-full px-3 py-2 rounded-lg bg-[#111] border border-[var(--color-border)]
    text-white text-sm focus:border-teal-500 focus:outline-none transition-colors`;
  const labelCls = 'block text-xs text-neutral-400 mb-1';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl w-full max-w-xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-base font-semibold text-white">
            {produto ? 'Editar Produto' : 'Cadastrar Produto'}
          </h2>
          <button onClick={onFechar} className="text-neutral-400 hover:text-white transition-colors">
            <IconX size={20} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Codigo *</label>
            <input className={inputCls} value={form.codigo} onChange={campo('codigo')} placeholder="TEC001" />
          </div>
          <div>
            <label className={labelCls}>Nome *</label>
            <input className={inputCls} value={form.nome} onChange={campo('nome')} placeholder="AlgodÃ£o Premium" />
          </div>
          <div>
            <label className={labelCls}>Tipo / Categoria</label>
            <input className={inputCls} value={form.tipo} onChange={campo('tipo')} placeholder="AlgodÃ£o" list="tipos-list" />
            <datalist id="tipos-list">
              {categorias.map(c => <option key={c.id} value={c.nome} />)}
            </datalist>
          </div>
          <div>
            <label className={labelCls}>Cor / VariaÃ§Ã£o</label>
            <input className={inputCls} value={form.categoria} onChange={campo('categoria')} placeholder="Branco" />
          </div>
          <div>
            <label className={labelCls}>Unidade</label>
            <select className={inputCls} value={form.unidade} onChange={campo('unidade')}>
              {['m', 'un', 'kg', 'L', 'rolo'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Custo UnitÃ¡rio (R$)</label>
            <input className={inputCls} type="number" step="0.01" value={form.custo_unitario}
              onChange={campo('custo_unitario')} placeholder="0,00" />
          </div>
          <div>
            <label className={labelCls}>Estoque MÃ­nimo</label>
            <input className={inputCls} type="number" value={form.estoque_minimo}
              onChange={campo('estoque_minimo')} placeholder="50" />
          </div>
          <div>
            <label className={labelCls}>Quantidade Inicial</label>
            <input className={inputCls} type="number" value={form.quantidade}
              onChange={campo('quantidade')} placeholder="0" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Fornecedor</label>
            <select className={inputCls} value={form.fornecedor_id} onChange={campo('fornecedor_id')}>
              <option value="">â€” selecione â€”</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Local de Armazenamento</label>
            <input className={inputCls} value={form.local_armazenamento}
              onChange={campo('local_armazenamento')} placeholder="Setor A" />
          </div>
          <div>
            <label className={labelCls}>Cor (hex)</label>
            <input className={inputCls} value={form.cor}
              onChange={campo('cor')} placeholder="#ffffff" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
          <button onClick={onFechar}
            className="px-4 py-2 rounded-lg text-sm text-neutral-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSalvar} disabled={salvando || !form.nome || !form.codigo}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500
              text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <IconCheck size={16} />
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EstoqueTab({
  produtos, fornecedores, categorias,
  onCriarProduto, onAtualizarProduto, onDeletarProduto,
}: EstoqueTabProps) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoComEstoque | null>(null);
  const [confirmandoDelete, setConfirmandoDelete] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const tipos = useMemo(() => {
    const set = new Set(produtos.map(p => p.tipo));
    return ['Todos', ...Array.from(set).sort()];
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const buscaOk = !busca || [p.nome, p.codigo, p.categoria, p.tipo]
        .some(v => v.toLowerCase().includes(busca.toLowerCase()));
      const tipoOk = filtroTipo === 'Todos' || p.tipo === filtroTipo;
      return buscaOk && tipoOk;
    });
  }, [produtos, busca, filtroTipo]);

  const totalBaixo = produtos.filter(p => p.status !== 'normal').length;

  const abrirNovoProduto = () => {
    setProdutoEditando(null);
    setModalAberto(true);
  };

  const abrirEdicao = (produto: ProdutoComEstoque) => {
    setProdutoEditando(produto);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
  };

  const salvarProduto = async (form: ProdutoForm) => {
    const forn = fornecedores.find(f => f.id === form.fornecedor_id);
    const dados = {
      codigo: form.codigo,
      nome: form.nome,
      categoria: form.categoria,
      tipo: form.tipo,
      unidade: form.unidade as ProdutoComEstoque['unidade'],
      custo_unitario: parseFloat(form.custo_unitario) || 0,
      estoque_minimo: parseFloat(form.estoque_minimo) || 0,
      quantidade: parseFloat(form.quantidade) || 0,
      fornecedor_id: form.fornecedor_id || undefined,
      fornecedor_nome: forn?.nome,
      local_armazenamento: form.local_armazenamento || undefined,
      cor: form.cor || undefined,
      created_at: new Date().toISOString(),
    };

    if (produtoEditando) {
      await onAtualizarProduto(produtoEditando.id, dados);
    } else {
      await onCriarProduto(dados);
    }
    fecharModal();
  };

  const iniciarDelete = (id: string) => {
    setConfirmandoDelete(id);
    clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => setConfirmandoDelete(null), 3000);
  };

  const confirmarDelete = async (id: string) => {
    clearTimeout(deleteTimerRef.current);
    setConfirmandoDelete(null);
    await onDeletarProduto(id);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={abrirNovoProduto}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500
            text-white text-sm font-medium transition-colors"
        >
          <IconPlus size={16} />
          Cadastrar Produto
        </button>

        {/* Campo de busca */}
        <div className="flex-1 min-w-48 relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou codigo..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-card)] border border-[var(--color-border)]
              rounded-lg text-sm text-white placeholder-neutral-500 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="relative">
          <span className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
            <IconChevronDown size={14} className="text-neutral-500" />
          </span>
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="pl-3 pr-8 py-2 bg-[var(--color-card)] border border-[var(--color-border)]
              rounded-lg text-sm text-white focus:border-teal-500 focus:outline-none appearance-none min-w-[130px]"
          >
            {tipos.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Codigo', 'Nome', 'Categoria', 'Tipo', 'Quantidade', 'PreÃ§o', 'Fornecedor', 'Est. Min.', 'AÃ§Ãµes'].map(h => (
                <th key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-400 bg-[var(--color-surface)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {produtosFiltrados.map(produto => (
              <tr
                key={produto.id}
                className={`transition-colors ${
                  produto.status === 'critico'
                    ? 'bg-red-950/30 hover:bg-red-950/50'
                    : produto.status === 'baixo'
                    ? 'bg-[var(--color-card)] hover:bg-yellow-950/20'
                    : 'bg-[var(--color-card)] hover:bg-[var(--color-surface)]'
                }`}
              >
                <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{produto.codigo}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {produto.cor && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: produto.cor }}
                      />
                    )}
                    <span className="text-white font-medium">{produto.nome}</span>
                    <BadgeStatus status={produto.status} />
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-400">{produto.categoria}</td>
                <td className="px-4 py-3">
                  <BadgeTipo tipo={produto.tipo} />
                </td>
                <td className={`px-4 py-3 font-medium ${
                  produto.status === 'critico' ? 'text-red-400'
                  : produto.status === 'baixo' ? 'text-yellow-400'
                  : 'text-white'
                }`}>
                  {produto.quantidade}{produto.unidade}
                </td>
                <td className="px-4 py-3 text-neutral-300">
                  R$ {produto.custo_unitario.toFixed(2)} /{produto.unidade}
                </td>
                <td className="px-4 py-3 text-neutral-400">{produto.fornecedor_nome ?? 'â€”'}</td>
                <td className="px-4 py-3 text-neutral-400">
                  {produto.estoque_minimo}{produto.unidade}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEdicao(produto)}
                      className="p-1.5 rounded text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                      title="Editar"
                    >
                      <IconPencil size={15} />
                    </button>
                    <button
                      className="p-1.5 rounded text-neutral-500 hover:text-teal-400 hover:bg-teal-500/5 transition-colors"
                      title="Historico"
                    >
                      <IconHistory size={15} />
                    </button>
                    <button
                      onClick={() =>
                        confirmandoDelete === produto.id
                          ? confirmarDelete(produto.id)
                          : iniciarDelete(produto.id)
                      }
                      className={`p-1.5 rounded transition-colors ${
                        confirmandoDelete === produto.id
                          ? 'text-red-400 bg-red-500/10'
                          : 'text-neutral-500 hover:text-red-400 hover:bg-red-500/5'
                      }`}
                      title={confirmandoDelete === produto.id ? 'Confirmar exclusÃ£o' : 'Excluir'}
                    >
                      <IconTrash size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {produtosFiltrados.length === 0 && (
          <div className="py-12 text-center text-neutral-500">
            {busca ? `Nenhum produto encontrado para "${busca}"` : 'Nenhum produto cadastrado'}
          </div>
        )}
      </div>

      {/* RodapÃ© da tabela */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-400">
          Total de itens: <span className="text-white font-medium">{produtosFiltrados.length}</span>
        </span>
        {totalBaixo > 0 && (
          <span className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            Estoque baixo: {totalBaixo}
          </span>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <ModalProduto
          produto={produtoEditando}
          fornecedores={fornecedores}
          categorias={categorias}
          onSalvar={salvarProduto}
          onFechar={fecharModal}
        />
      )}
    </div>
  );
}

