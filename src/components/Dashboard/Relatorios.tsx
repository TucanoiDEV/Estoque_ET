// Aba de Relatorios do Dashboard

import { IconDownload, IconFileText } from '@tabler/icons-react';
import type { Relatorio } from '../../types';

interface RelatoriosProps {
  relatorios: Relatorio[];
}

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR')}`;
}

function exportarPDF(relatorio: Relatorio) {
  // ImportaÃ§Ã£o dinÃ¢mica para nÃ£o bloquear o carregamento inicial
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(0, 188, 180);
    doc.text('EstoqueSync', 14, 20);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(relatorio.nome, 14, 32);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`PerÃ­odo: ${relatorio.periodo}`, 14, 44);
    doc.text(`Total de entradas: ${relatorio.total_entradas}`, 14, 52);
    doc.text(`Valor total: ${formatarMoeda(relatorio.valor_total)}`, 14, 60);
    doc.text(`Itens movimentados: ${relatorio.itens_movimentados}`, 14, 68);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 80);

    doc.save(`${relatorio.nome.replace(/\s+/g, '_')}.pdf`);
  });
}

export function Relatorios({ relatorios }: RelatoriosProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-300">
          Relatorios DisponÃ­veis
        </h3>
        <span className="text-xs text-neutral-500">{relatorios.length} relatorios</span>
      </div>

      <div className="space-y-2">
        {relatorios.map(rel => (
          <div
            key={rel.id}
            className="flex items-center justify-between p-4 bg-[var(--color-card)]
              border border-[var(--color-border)] rounded-xl hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <IconFileText size={18} className="text-teal-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{rel.nome}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-neutral-400">{rel.periodo}</span>
                  <span className="text-xs text-neutral-500">&bull;</span>
                  <span className="text-xs text-neutral-400">{rel.total_entradas} entradas</span>
                  <span className="text-xs text-neutral-500">&bull;</span>
                  <span className="text-xs text-teal-400">{formatarMoeda(rel.valor_total)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => exportarPDF(rel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                text-teal-400 border border-teal-500/30 hover:bg-teal-500/10 transition-colors"
            >
              <IconDownload size={14} />
              PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

