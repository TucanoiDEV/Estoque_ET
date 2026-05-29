import { IconPackages, IconCurrencyDollar, IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react'
import type { MetricasDashboard } from '../../types'

interface Props {
  metricas: MetricasDashboard
  loading: boolean
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR')
}

export function MetricCards({ metricas, loading }: Props) {
  const cards = [
    {
      titulo: 'Total de itens',
      valor: formatarNumero(metricas.totalItens),
      icone: <IconPackages size={22} />,
      cor: 'text-brand-blue',
      bg: 'bg-brand-blue/10',
      descricao: 'unidades em estoque',
    },
    {
      titulo: 'Valor em estoque',
      valor: formatarMoeda(metricas.valorTotal),
      icone: <IconCurrencyDollar size={22} />,
      cor: 'text-brand-purple',
      bg: 'bg-brand-purple/10',
      descricao: 'valor total estimado',
    },
    {
      titulo: 'Itens críticos',
      valor: formatarNumero(metricas.itensCriticos),
      icone: <IconAlertTriangle size={22} />,
      cor: metricas.itensCriticos > 0 ? 'text-brand-red' : 'text-brand-green',
      bg: metricas.itensCriticos > 0 ? 'bg-brand-red/10' : 'bg-brand-green/10',
      descricao: 'abaixo do mínimo',
    },
    {
      titulo: 'Entradas no mês',
      valor: formatarNumero(metricas.entradasMes),
      icone: <IconTrendingUp size={22} />,
      cor: 'text-brand-green',
      bg: 'bg-brand-green/10',
      descricao: 'registros este mês',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-dark-card border border-dark-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-dark-hover rounded w-3/4 mb-3" />
            <div className="h-8 bg-dark-hover rounded w-1/2 mb-2" />
            <div className="h-3 bg-dark-hover rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.titulo}
          className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-dark-hover transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-sm text-gray-400 font-medium">{card.titulo}</span>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg} ${card.cor}`}>
              {card.icone}
            </div>
          </div>
          <div className={`text-2xl font-bold mb-1 ${card.cor}`}>{card.valor}</div>
          <div className="text-xs text-gray-500">{card.descricao}</div>
        </div>
      ))}
    </div>
  )
}
