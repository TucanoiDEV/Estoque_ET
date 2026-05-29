import { IconSun, IconMoon, IconPalette } from '@tabler/icons-react'

interface Props {
  temaEscuro: boolean
  onToggleTema: () => void
}

export function AparenciaSection({ temaEscuro, onToggleTema }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <IconPalette size={20} className="text-brand-purple" />
        <div>
          <h3 className="text-base font-semibold text-white">Aparência</h3>
          <p className="text-xs text-gray-500">Personalize a interface</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Tema escuro */}
        <button
          onClick={() => !temaEscuro && onToggleTema()}
          className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
            temaEscuro
              ? 'border-brand-blue bg-brand-blue/5'
              : 'border-dark-border hover:border-dark-hover bg-dark-card'
          }`}
        >
          {temaEscuro && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-blue" />
          )}
          <div className="w-10 h-10 rounded-lg bg-dark-bg flex items-center justify-center mb-3">
            <IconMoon size={20} className="text-brand-blue" />
          </div>
          <div className="text-sm font-semibold text-white">Tema escuro</div>
          <div className="text-xs text-gray-500 mt-0.5">Interface com fundo escuro (padrão)</div>
        </button>

        {/* Tema claro */}
        <button
          onClick={() => temaEscuro && onToggleTema()}
          className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
            !temaEscuro
              ? 'border-brand-blue bg-brand-blue/5'
              : 'border-dark-border hover:border-dark-hover bg-dark-card'
          }`}
        >
          {!temaEscuro && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-blue" />
          )}
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
            <IconSun size={20} className="text-brand-yellow" />
          </div>
          <div className="text-sm font-semibold text-white">Tema claro</div>
          <div className="text-xs text-gray-500 mt-0.5">Interface com fundo claro</div>
        </button>
      </div>

      <p className="text-xs text-gray-500">
        A preferência de tema é salva localmente no seu navegador.
      </p>
    </div>
  )
}
