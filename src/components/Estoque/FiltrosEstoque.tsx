import { IconSearch, IconX } from '@tabler/icons-react'
import type { FiltrosEstoque, StatusEstoque } from '../../types'

interface Props {
  filtros: FiltrosEstoque
  categorias: string[]
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

export function FiltrosEstoque({ filtros, categorias, onChange }: Props) {
  function set(parcial: Partial<FiltrosEstoque>) {
    onChange({ ...filtros, ...parcial })
  }

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
          onChange={(e) => set({ categoria: e.target.value })}
          className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-blue transition-colors"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      )}

      {/* Filtro por medida */}
      <select
        value={filtros.medida}
        onChange={(e) => set({ medida: e.target.value })}
        className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-brand-blue transition-colors"
      >
        {medidas.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  )
}
