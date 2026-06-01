import { useState } from 'react'
import { IconTrash, IconPlus } from '@tabler/icons-react'

interface Props {
  label: string
  itens: string[]
  onAdicionar: (item: string) => void
  onRemover: (item: string) => void
  placeholder?: string
  desabilitado?: boolean
  textoVazio?: string
  ajuda?: string
}

// Gerencia uma lista de strings como "chips": adicionar e remover (X).
export function GerenciadorLista({
  label,
  itens,
  onAdicionar,
  onRemover,
  placeholder,
  desabilitado,
  textoVazio,
  ajuda,
}: Props) {
  const [novo, setNovo] = useState('')

  function adicionar() {
    const valor = novo.trim()
    if (!valor) return
    onAdicionar(valor)
    setNovo('')
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-2">{label}</label>

      <div className="flex flex-wrap gap-2 mb-3">
        {itens.map((item) => (
          <div
            key={item}
            className="flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            {item}
            {!desabilitado && (
              <button
                type="button"
                onClick={() => onRemover(item)}
                title={`Remover ${item}`}
                aria-label={`Remover ${item}`}
                className="opacity-60 hover:opacity-100"
              >
                <IconTrash size={11} />
              </button>
            )}
          </div>
        ))}
        {itens.length === 0 && <span className="text-xs text-gray-500">{textoVazio ?? 'Nenhum item cadastrado'}</span>}
      </div>

      {!desabilitado && (
        <div className="flex gap-2 max-w-sm">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                adicionar()
              }
            }}
            placeholder={placeholder ?? 'Novo item...'}
            className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue"
          />
          <button
            type="button"
            onClick={adicionar}
            className="flex items-center gap-1 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            <IconPlus size={14} />
          </button>
        </div>
      )}

      {ajuda && <p className="text-[11px] text-gray-600 mt-2">{ajuda}</p>}
    </div>
  )
}
