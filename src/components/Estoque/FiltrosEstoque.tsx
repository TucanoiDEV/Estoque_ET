import { IconSearch, IconX, IconTag } from '@tabler/icons-react'
import type { FiltrosEstoque, StatusEstoque } from '../../types'

interface Props {
  filtros: FiltrosEstoque
  categorias: string[]
  coresDisponiveis: string[]
  fornecedoresDisponiveis: string[]
  onChange: (filtros: FiltrosEstoque) => void
}

type AbaStatus = StatusEstoque | 'todos'

const abas: { id: AbaStatus; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'critico', label: 'Críticos' },
  { id: 'baixo', label: 'Baixo' },
  { id: 'normal', label: 'Normal' },
]

const medidas = [
  { value: '', label: 'Todas as medidas' },
  { value: 'KG', label: 'Quilograma (Kg)' },
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'M', label: 'Metro (M)' },
]

export function FiltrosEstoque({ filtros, categorias, coresDisponiveis, fornecedoresDisponiveis, onChange }: Props) {
  function set(parcial: Partial<FiltrosEstoque>) {
    onChange({ ...filtros, ...parcial })
  }

  // O filtro de cor só faz sentido para lonas — aparece apenas quando a categoria "Lona" está selecionada
  const categoriaEhLona = filtros.categoria.toLowerCase() === 'lona'
  const mostrarFiltroCor = categoriaEhLona && coresDisponiveis.length > 0

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou código..."
          value={filtros.busca}
          onChange={(e) => set({ busca: e.target.value })}
          className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors"
        />
        {filtros.busca && (
          <button
            onClick={() => set({ busca: '' })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <IconX size={14} />
          </button>
        )}
      </div>

      {/* Abas de status */}
      <div className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-lg p-1">
        {abas.map((aba) => (
          <button
            key={aba.id}
            onClick={() => set({ status: aba.id })}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              filtros.status === aba.id
                ? 'bg-brand-blue text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <select
          value={filtros.categoria}
          onChange={(e) => {
            const categoria = e.target.value
            // Ao sair da categoria "Lona", limpa o filtro de cor para não filtrar a tabela com o controle oculto
            const corLimpa = categoria.toLowerCase() === 'lona' ? {} : { cor: '' }
            set({ categoria, ...corLimpa })
          }}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="" className="bg-dark-card text-gray-100">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat} className="bg-dark-card text-gray-100">
              {cat}
            </option>
          ))}
        </select>
      )}

      {/* Filtro por fornecedor */}
      {fornecedoresDisponiveis.length > 0 && (
        <select
          value={filtros.fornecedor}
          onChange={(e) => set({ fornecedor: e.target.value })}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="" className="bg-dark-card text-gray-100">Todos os fornecedores</option>
          {fornecedoresDisponiveis.map((forn) => (
            <option key={forn} value={forn} className="bg-dark-card text-gray-100">
              {forn}
            </option>
          ))}
        </select>
      )}

      {/* Filtro por cor — aparece apenas quando a categoria "Lona" está selecionada */}
      {mostrarFiltroCor && (
        <div className="flex items-center gap-1.5 bg-dark-card border border-dark-border rounded-lg px-3 py-2">
          <IconTag size={14} className="text-gray-500 shrink-0" />
          <select
            value={filtros.cor}
            onChange={(e) => set({ cor: e.target.value })}
            className="bg-transparent text-sm text-gray-300 focus:outline-none"
          >
            <option value="" className="bg-dark-card text-gray-100">Todas as cores</option>
            {coresDisponiveis.map((cor) => (
              <option key={cor} value={cor} className="bg-dark-card text-gray-100">
                {cor}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Filtro por medida */}
      <select
        value={filtros.medida}
        onChange={(e) => set({ medida: e.target.value })}
        className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-blue transition-colors"
      >
        {medidas.map((m) => (
          <option key={m.value} value={m.value} className="bg-dark-card text-gray-100">
            {m.label}
          </option>
        ))}
      </select>
    </div>
  )
}
