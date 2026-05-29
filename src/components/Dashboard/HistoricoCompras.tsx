// Aba de Historico de Compras do Dashboard

import type { Entrada } from '../../types';

interface HistoricoComprasProps {
  entradas: Entrada[];
}

function formatarData(data: string): string {
  return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function HistoricoCompras({ entradas }: HistoricoComprasProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300">Historico de Compras</h3>
        <span className="text-xs text-neutral-500">{entradas.length} registros</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {['Data', 'Produto', 'Fornecedor', 'Qtd', 'Custo Unit.', 'Total', 'Status'].map(h => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-400 bg-[var(--color-surface)]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {entradas.slice(0, 20).map(entrada => (
              <tr
                key={entrada.id}
                className="bg-[var(--color-card)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                  {formatarData(entrada.data_recebimento)}
                </td>
                <td className="px-4 py-3 text-white font-medium">{entrada.produto_nome}</td>
                <td className="px-4 py-3 text-neutral-400">{entrada.fornecedor_nome}</td>
                <td className="px-4 py-3 text-neutral-300">{entrada.quantidade}m</td>
                <td className="px-4 py-3 text-neutral-300">
                  {formatarMoeda(entrada.custo_unitario)}
                </td>
                <td className="px-4 py-3 text-teal-400 font-medium">
                  {formatarMoeda(entrada.total)}
                </td>
                <td className="px-4 py-3">
                  {entrada.sincronizado ? (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20">
                      Sincronizado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      Pendente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {entradas.length === 0 && (
          <div className="py-12 text-center text-neutral-500">
            Nenhuma entrada registrada
          </div>
        )}
      </div>
    </div>
  );
}

