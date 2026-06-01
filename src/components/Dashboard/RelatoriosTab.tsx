import { useState } from 'react'
import { IconFileTypePdf, IconDownload, IconLoader2 } from '@tabler/icons-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatarData } from '../../utils/data'
import type { ProdutoComEstoque, Entrada, Fornecedor } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import { useToast } from '../shared/Toast'

interface Props {
  produtos: ProdutoComEstoque[]
  entradas: Entrada[]
  fornecedores: Fornecedor[]
  loading: boolean
}

interface RelatorioConfig {
  id: string
  titulo: string
  descricao: string
  icone: string
  restrito: boolean
}

const relatorios: RelatorioConfig[] = [
  {
    id: 'posicao',
    titulo: 'Posição de estoque atual',
    descricao: 'Lista completa de produtos com quantidades e valores',
    icone: '📦',
    restrito: false,
  },
  {
    id: 'giro',
    titulo: 'Giro de produtos do mês',
    descricao: 'Movimentações e entradas do período atual',
    icone: '🔄',
    restrito: false,
  },
  {
    id: 'minimo',
    titulo: 'Itens abaixo do mínimo',
    descricao: 'Produtos em situação crítica que precisam de reposição',
    icone: '⚠️',
    restrito: false,
  },
  {
    id: 'valoracao',
    titulo: 'Valoração do estoque',
    descricao: 'Análise financeira completa do valor em estoque',
    icone: '💰',
    restrito: true,
  },
]

export function RelatoriosTab({ produtos, entradas, fornecedores, loading }: Props) {
  const [gerando, setGerando] = useState<string | null>(null)
  const { canExport, canExportLimitado } = usePermissions()
  const { mostrarToast } = useToast()

  async function gerarPDF(relatorioId: string) {
    setGerando(relatorioId)
    try {
      // Importa jsPDF e autoTable dinamicamente
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF()
      const dataHoje = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

      // Cabeçalho
      doc.setFontSize(18)
      doc.setTextColor(59, 130, 246)
      doc.text('Armazém Machado', 14, 16)
      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)

      if (relatorioId === 'posicao') {
        doc.text('Relatório: Posição de Estoque Atual', 14, 24)
        doc.setFontSize(9)
        doc.text(`Gerado em: ${dataHoje}`, 14, 30)
        autoTable(doc, {
          startY: 35,
          head: [['Código', 'Produto', 'Categoria', 'Qtd.', 'Custo Unit.', 'Total', 'Status']],
          body: produtos.map((p) => [
            p.codigo,
            p.nome,
            p.categoria ?? '—',
            p.quantidade,
            p.custo_unitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—',
            ((p.custo_unitario ?? 0) * p.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            p.status.toUpperCase(),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        })
      } else if (relatorioId === 'giro') {
        const mesAtual = new Date().toISOString().slice(0, 7)
        const entradasMes = entradas.filter((e) => e.created_at.startsWith(mesAtual))
        doc.text('Relatório: Giro de Produtos do Mês', 14, 24)
        doc.setFontSize(9)
        doc.text(`Período: ${dataHoje}`, 14, 30)
        autoTable(doc, {
          startY: 35,
          head: [['Data', 'Produto', 'Fornecedor', 'Qtd.', 'Total', 'Status']],
          body: entradasMes.map((e) => [
            formatarData(e.data_recebimento),
            (e.produto as any)?.nome ?? '—',
            (e.fornecedor as any)?.nome ?? '—',
            e.quantidade,
            e.total?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—',
            e.status,
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        })
      } else if (relatorioId === 'minimo') {
        const criticos = produtos.filter((p) => p.status === 'critico' || p.status === 'baixo')
        doc.text('Relatório: Itens Abaixo do Mínimo', 14, 24)
        autoTable(doc, {
          startY: 35,
          head: [['Código', 'Produto', 'Qtd. Atual', 'Qtd. Mínima', 'Diferença', 'Status']],
          body: criticos.map((p) => [
            p.codigo,
            p.nome,
            p.quantidade,
            p.estoque_minimo,
            p.quantidade - p.estoque_minimo,
            p.status.toUpperCase(),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [239, 68, 68] },
        })
      } else if (relatorioId === 'valoracao') {
        const totalGeral = produtos.reduce((acc, p) => acc + (p.custo_unitario ?? 0) * p.quantidade, 0)
        doc.text('Relatório: Valoração do Estoque', 14, 24)
        autoTable(doc, {
          startY: 35,
          head: [['Produto', 'Qtd.', 'Custo Unit.', 'Valor Total', '% do Total']],
          body: produtos.map((p) => {
            const valor = (p.custo_unitario ?? 0) * p.quantidade
            return [
              p.nome,
              p.quantidade,
              p.custo_unitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '—',
              valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              totalGeral > 0 ? `${((valor / totalGeral) * 100).toFixed(1)}%` : '0%',
            ]
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [168, 85, 247] },
          foot: [['TOTAL', '', '', totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), '100%']],
        })
      }

      doc.save(`estoquesync-${relatorioId}-${new Date().toISOString().slice(0, 10)}.pdf`)
      mostrarToast('Relatório gerado com sucesso!', 'sucesso')
    } catch {
      mostrarToast('Erro ao gerar o PDF. Tente novamente.', 'erro')
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Itens cadastrados', valor: produtos.length.toLocaleString('pt-BR'), cor: 'text-brand-blue' },
          { label: 'Fornecedores ativos', valor: fornecedores.length.toLocaleString('pt-BR'), cor: 'text-brand-purple' },
        ].map((item) => (
          <div key={item.label} className="bg-dark-card border border-dark-border rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div className={`text-xl font-bold ${item.cor}`}>{item.valor}</div>
          </div>
        ))}
      </div>

      {/* Lista de relatórios disponíveis */}
      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-border">
          <h3 className="font-semibold text-white">Relatórios disponíveis</h3>
          <p className="text-xs text-gray-500 mt-0.5">Clique em download para gerar o PDF</p>
        </div>
        <div className="divide-y divide-dark-border">
          {relatorios.map((rel) => {
            const podeDownload = rel.restrito ? canExport() : canExportLimitado()
            const estaGerando = gerando === rel.id

            return (
              <div key={rel.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-2xl">{rel.icone}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm">{rel.titulo}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{rel.descricao}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
                    <IconFileTypePdf size={14} /> PDF
                  </span>
                  <button
                    onClick={() => gerarPDF(rel.id)}
                    disabled={!podeDownload || loading || estaGerando}
                    title={!podeDownload ? 'Sem permissão para exportar' : 'Baixar PDF'}
                    className="flex items-center gap-1.5 bg-brand-blue/10 hover:bg-brand-blue/20 disabled:opacity-40 disabled:cursor-not-allowed text-brand-blue text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {estaGerando ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconDownload size={14} />
                    )}
                    {estaGerando ? 'Gerando...' : 'Download'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
