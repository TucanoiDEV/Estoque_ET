import { useState, useRef, useEffect, useMemo } from 'react'
import { IconChevronDown, IconSearch, IconPlus, IconCheck } from '@tabler/icons-react'
import { normalizarBusca } from '../../utils/texto'

export interface ComboOpcao {
  value: string
  label: string
}

interface Props {
  value: string
  opcoes: ComboOpcao[]
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  obrigatorio?: boolean
  erro?: string
  // Rótulo da opção de valor vazio (ex.: "Sem fornecedor"). Omitir = sem opção vazia.
  vazioLabel?: string
  placeholderBusca?: string
  // Permite adicionar um item digitado que não existe (ex.: novo fornecedor/cor).
  onAdicionar?: (texto: string) => Promise<string | null> | string | null
}

// Dropdown pesquisável: digite para filtrar as opções; opcionalmente adiciona novas.
export function ComboBox({
  value,
  opcoes,
  onChange,
  label,
  placeholder = 'Selecione...',
  obrigatorio,
  erro,
  vazioLabel,
  placeholderBusca = 'Buscar...',
  onAdicionar,
}: Props) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const [destaque, setDestaque] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selecionada = opcoes.find((o) => o.value === value)

  const filtradas = useMemo(() => {
    const q = normalizarBusca(busca.trim())
    if (!q) return opcoes
    return opcoes.filter((o) => normalizarBusca(o.label).includes(q))
  }, [opcoes, busca])

  const podeAdicionar =
    !!onAdicionar &&
    busca.trim() !== '' &&
    !opcoes.some((o) => normalizarBusca(o.label) === normalizarBusca(busca.trim()))

  // Itens navegáveis: opção vazia (só sem busca) + filtradas + linha de adicionar
  const itens: { tipo: 'vazio' | 'opcao' | 'add'; value: string; label: string }[] = []
  if (vazioLabel !== undefined && !busca.trim()) itens.push({ tipo: 'vazio', value: '', label: vazioLabel })
  filtradas.forEach((o) => itens.push({ tipo: 'opcao', value: o.value, label: o.label }))
  if (podeAdicionar) itens.push({ tipo: 'add', value: '', label: `Adicionar "${busca.trim()}"` })

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false)
    }
    if (aberto) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [aberto])

  useEffect(() => {
    if (aberto) {
      setBusca('')
      setDestaque(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [aberto])

  function selecionar(v: string) {
    onChange(v)
    setAberto(false)
  }

  async function adicionar() {
    if (!onAdicionar) return
    const texto = busca.trim()
    if (!texto) return
    setSalvando(true)
    try {
      const v = await onAdicionar(texto)
      if (v) onChange(v)
    } finally {
      setSalvando(false)
      setAberto(false)
    }
  }

  function acionar(item: { tipo: string; value: string }) {
    if (item.tipo === 'add') adicionar()
    else selecionar(item.value)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setDestaque((d) => Math.min(d + 1, itens.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDestaque((d) => Math.max(d - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = itens[destaque]
      if (it) acionar(it)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setAberto(false)
    }
  }

  const textoTrigger = selecionada ? selecionada.label : value === '' && vazioLabel ? vazioLabel : placeholder
  const triggerVazio = !selecionada && !(value === '' && vazioLabel)

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          {label} {obrigatorio && <span className="text-brand-red">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 bg-dark-bg border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:border-brand-blue transition-colors ${
          erro ? 'border-brand-red' : 'border-dark-border'
        }`}
      >
        <span className={`truncate ${triggerVazio ? 'text-gray-500' : 'text-white'}`}>{textoTrigger}</span>
        <IconChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-dark-card border border-dark-border rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-dark-border">
            <div className="relative">
              <IconSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                ref={inputRef}
                data-testid="combobox-busca"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value)
                  setDestaque(0)
                }}
                onKeyDown={onKeyDown}
                placeholder={placeholderBusca}
                className="w-full bg-dark-bg border border-dark-border rounded-md pl-8 pr-2 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue"
              />
            </div>
          </div>

          <div data-testid="combobox-lista" className="max-h-56 overflow-y-auto py-1">
            {itens.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Nenhum resultado</div>}
            {itens.map((it, i) => (
              <button
                key={`${it.tipo}-${it.value}-${it.label}`}
                type="button"
                onMouseEnter={() => setDestaque(i)}
                onClick={() => acionar(it)}
                disabled={salvando}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors disabled:opacity-60 ${
                  i === destaque ? 'bg-brand-blue/15' : ''
                } ${it.tipo === 'add' ? 'text-brand-blue font-medium' : 'text-gray-300'}`}
              >
                {it.tipo === 'add' && <IconPlus size={14} className="shrink-0" />}
                {it.tipo === 'opcao' && it.value === value && <IconCheck size={14} className="text-brand-blue shrink-0" />}
                <span className="truncate">{it.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {erro && <p className="text-xs text-brand-red mt-1">{erro}</p>}
    </div>
  )
}
