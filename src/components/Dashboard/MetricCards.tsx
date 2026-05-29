// Cards de mÃ©tricas do Dashboard

import {
  IconPackage, IconTrendingUp, IconAlertTriangle, IconShoppingCart,
} from '@tabler/icons-react';
import type { MetricasDashboard } from '../../types';

interface MetricCardsProps {
  metricas: MetricasDashboard;
}

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`;
  if (valor >= 1_000) return `R$ ${(valor / 1_000).toFixed(0)}.${String(valor % 1000).padStart(3, '0')}`;
  return `R$ ${valor.toFixed(0)}`;
}

function formatarNumero(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function MetricCards({ metricas }: MetricCardsProps) {
  const cards = [
    {
      label: 'Itens em estoque',
      valor: formatarNumero(metricas.total_itens),
      sub: `+${metricas.variacao_semanal} esta semana`,
      subCor: 'text-teal-400',
      icone: <IconPackage size={18} className="text-neutral-400" />,
    },
    {
      label: 'Valor total',
      valor: formatarMoeda(metricas.valor_total),
      sub: `+${metricas.variacao_valor_pct.toFixed(1)}% vs mÃªs ant.`,
      subCor: 'text-teal-400',
      icone: <IconTrendingUp size={18} className="text-neutral-400" />,
    },
    {
      label: 'Estoque crÃ­tico',
      valor: String(metricas.itens_criticos),
      sub: 'itens abaixo do mÃ­nimo',
      subCor: 'text-red-400',
      icone: <IconAlertTriangle size={18} className="text-neutral-400" />,
    },
    {
      label: 'Entradas no mÃªs',
      valor: String(metricas.entradas_mes),
      sub: `de ${metricas.total_fornecedores} fornecedores`,
      subCor: 'text-neutral-400',
      icone: <IconShoppingCart size={18} className="text-neutral-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-neutral-400 font-medium">{card.label}</span>
            {card.icone}
          </div>
          <p className="text-2xl font-bold text-white mb-1">{card.valor}</p>
          <p className={`text-xs font-medium ${card.subCor}`}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}

