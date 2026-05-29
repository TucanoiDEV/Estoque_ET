// Aba principal do Dashboard com mÃ©tricas e sub-abas

import { useState } from 'react';
import type { MetricasDashboard, Entrada, Relatorio, AbaDashboard } from '../../types';
import { MetricCards } from './MetricCards';
import { Graficos } from './Graficos';
import { Relatorios } from './Relatorios';
import { HistoricoCompras } from './HistoricoCompras';

interface DashboardTabProps {
  metricas: MetricasDashboard;
  entradas: Entrada[];
  relatorios: Relatorio[];
}

const subAbas: { id: AbaDashboard; label: string }[] = [
  { id: 'graficos',   label: 'Graficos' },
  { id: 'relatorios', label: 'Relatorios' },
  { id: 'historico',  label: 'Historico de compras' },
];

export function DashboardTab({ metricas, entradas, relatorios }: DashboardTabProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaDashboard>('graficos');

  return (
    <div className="space-y-6">
      {/* Cards de mÃ©tricas */}
      <MetricCards metricas={metricas} />

      {/* Sub-abas */}
      <div>
        <nav className="flex gap-6 border-b border-[var(--color-border)] mb-6">
          {subAbas.map(aba => (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id)}
              className={`pb-3 pt-1 text-sm font-medium border-b-2 transition-all -mb-px ${
                abaAtiva === aba.id
                  ? 'text-teal-400 border-teal-400'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              {aba.label}
            </button>
          ))}
        </nav>

        {abaAtiva === 'graficos'   && <Graficos />}
        {abaAtiva === 'relatorios' && <Relatorios relatorios={relatorios} />}
        {abaAtiva === 'historico'  && <HistoricoCompras entradas={entradas} />}
      </div>
    </div>
  );
}

