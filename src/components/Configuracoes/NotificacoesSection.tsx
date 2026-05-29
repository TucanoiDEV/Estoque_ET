import { useState } from 'react'
import { IconBell } from '@tabler/icons-react'
import { usePermissions } from '../../hooks/usePermissions'

interface ToggleProps {
  label: string
  descricao: string
  ativo: boolean
  onChange: (v: boolean) => void
  desabilitado?: boolean
}

function Toggle({ label, descricao, ativo, onChange, desabilitado }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-dark-border last:border-0">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{descricao}</div>
      </div>
      <button
        onClick={() => !desabilitado && onChange(!ativo)}
        disabled={desabilitado}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
          ativo ? 'bg-brand-blue' : 'bg-dark-border'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            ativo ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export function NotificacoesSection() {
  const { canChangeSettings } = usePermissions()
  const leitura = !canChangeSettings()

  const [notifs, setNotifs] = useState({
    estoqueCritico: true,
    novaEntrada: true,
    relatorioSemanal: false,
  })

  function toggle(chave: keyof typeof notifs) {
    setNotifs((prev) => ({ ...prev, [chave]: !prev[chave] }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <IconBell size={20} className="text-brand-blue" />
        <div>
          <h3 className="text-base font-semibold text-white">Notificações</h3>
          <p className="text-xs text-gray-500">Alertas do sistema</p>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl px-5">
        <Toggle
          label="Alerta de estoque crítico"
          descricao="Notifica quando um produto atinge ou ultrapassa o limite mínimo"
          ativo={notifs.estoqueCritico}
          onChange={() => toggle('estoqueCritico')}
          desabilitado={leitura}
        />
        <Toggle
          label="Nova entrada registrada"
          descricao="Notifica quando uma nova entrada é adicionada ao sistema"
          ativo={notifs.novaEntrada}
          onChange={() => toggle('novaEntrada')}
          desabilitado={leitura}
        />
        <Toggle
          label="Relatório semanal automático"
          descricao="Envia um resumo semanal do estoque por email"
          ativo={notifs.relatorioSemanal}
          onChange={() => toggle('relatorioSemanal')}
          desabilitado={leitura}
        />
      </div>

      {leitura && (
        <p className="text-xs text-gray-500">Apenas administradores podem alterar notificações.</p>
      )}
    </div>
  )
}
