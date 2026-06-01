import { useState } from 'react'
import { IconPlus, IconCheck, IconX } from '@tabler/icons-react'

export interface Opcao {
  value: string
  label: string
}

interface Props {
  label: string
  value: string
  opcoes: Opcao[]
  onChange: (valor: string) => void
  // Recebe o texto digitado; retorna o valor a selecionar (ou null se falhar).
  onAdicionar: (texto: string) => Promise<string | null> | string | null
  obrigatorio?: boolean
  erro?: string
  textoVazio?: string // primeira opção (ex.: "Sem fornecedor"). Omitir torna obrigatório escolher.
  placeholderNovo?: string
}

const INPUT_BASE =
  'w-full bg-dark-bg border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue transition-colors'

// Dropdown com um botão "+" ao lado para adicionar novas opções na hora.
export function SelectComAdicionar({
  label,
  value,
  opcoes,
  onChange,
  onAdicionar,
  obrigatorio,
  erro,
  textoVazio,
  placeholderNovo,
}: Props) {
  const [adicionando, setAdicionando] = useState(false)
  const [novo, setNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  function cancelar() {
    setNovo('')
    setAdicionando(false)
  }

  async function confirmar() {
    const texto = novo.trim()
    if (!texto) {
      cancelar()
      return
    }
    setSalvando(true)
    try {
      const valor = await onAdicionar(texto)
      if (valor) onChange(valor)
    } finally {
      setSalvando(false)
      setNovo('')
      setAdicionando(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label} {obrigatorio && <span className="text-brand-red">*</span>}
      </label>

      {adicionando ? (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmar()
              } else if (e.key === 'Escape') {
                cancelar()
              }
            }}
            placeholder={placeholderNovo ?? 'Novo item...'}
            className={`${INPUT_BASE} border-dark-border`}
          />
          <button
            type="button"
            onClick={confirmar}
            disabled={salvando}
            title="Salvar"
            className="shrink-0 w-9 flex items-center justify-center rounded-lg bg-brand-green hover:bg-green-500 text-white transition-colors disabled:opacity-60"
          >
            <IconCheck size={16} />
          </button>
          <button
            type="button"
            onClick={cancelar}
            title="Cancelar"
            className="shrink-0 w-9 flex items-center justify-center rounded-lg border border-dark-border text-gray-400 hover:text-white hover:bg-dark-hover transition-colors"
          >
            <IconX size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            title={`Adicionar ${label.toLowerCase()}`}
            aria-label={`Adicionar ${label.toLowerCase()}`}
            className="shrink-0 w-9 flex items-center justify-center rounded-lg bg-brand-blue/15 text-brand-blue hover:bg-brand-blue/25 transition-colors"
          >
            <IconPlus size={16} />
          </button>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${INPUT_BASE} ${erro ? 'border-brand-red' : 'border-dark-border'}`}
          >
            {textoVazio !== undefined && <option value="">{textoVazio}</option>}
            {opcoes.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {erro && <p className="text-xs text-brand-red mt-1">{erro}</p>}
    </div>
  )
}
