import { useState } from 'react'
import { IconDownload, IconLoader2, IconDatabase } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { format } from 'date-fns'

export function BackupSection() {
  const { mostrarToast } = useToast()
  const { canExport } = usePermissions()
  const [exportandoCSV, setExportandoCSV] = useState(false)
  const [exportandoJSON, setExportandoJSON] = useState(false)
  const [statusConexao, setStatusConexao] = useState<'ok' | 'erro' | 'verificando' | null>(null)

  async function verificarConexao() {
    setStatusConexao('verificando')
    const { error } = await db.produtos().select('id').limit(1)
    setStatusConexao(error ? 'erro' : 'ok')
  }

  async function exportarCSV() {
    if (!canExport()) { mostrarToast('Sem permissão para exportar.', 'aviso'); return }
    setExportandoCSV(true)

    const { data: produtos } = await db.estoque().select('quantidade, produto:produto_id(codigo,nome,categoria,unidade,custo_unitario,estoque_minimo)')
    if (!produtos) { mostrarToast('Erro ao carregar dados.', 'erro'); setExportandoCSV(false); return }

    const header = 'Código,Produto,Categoria,Unidade,Quantidade,Custo Unit.,Estoque Mínimo\n'
    const linhas = produtos.map((item: any) => {
      const p = item.produto
      return `${p?.codigo},${p?.nome},${p?.categoria ?? ''},${p?.unidade},${item.quantidade},${p?.custo_unitario ?? 0},${p?.estoque_minimo}`
    }).join('\n')

    const blob = new Blob([header + linhas], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estoquesync-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)

    mostrarToast('CSV exportado com sucesso!', 'sucesso')
    setExportandoCSV(false)
  }

  async function exportarJSON() {
    if (!canExport()) { mostrarToast('Sem permissão para exportar.', 'aviso'); return }
    setExportandoJSON(true)

    const [{ data: produtos }, { data: entradas }, { data: fornecedores }] = await Promise.all([
      db.produtos().select('*'),
      db.entradas().select('*'),
      db.fornecedores().select('*'),
    ])

    const payload = {
      exportado_em: new Date().toISOString(),
      versao: '1.0',
      dados: { produtos, entradas, fornecedores },
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `estoquesync-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)

    mostrarToast('JSON exportado com sucesso!', 'sucesso')
    setExportandoJSON(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <IconDatabase size={20} className="text-brand-blue" />
        <div>
          <h3 className="text-base font-semibold text-white">Banco de dados e backup</h3>
          <p className="text-xs text-gray-500">Gerencie exportações e monitore a conexão</p>
        </div>
      </div>

      {/* Status da conexão */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">Conexão com Supabase</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {statusConexao === 'ok' && <span className="text-brand-green">Conexão ativa e funcionando</span>}
              {statusConexao === 'erro' && <span className="text-brand-red">Falha na conexão</span>}
              {statusConexao === 'verificando' && <span className="text-brand-yellow">Verificando...</span>}
              {statusConexao === null && 'Clique em verificar para checar a conexão'}
            </div>
          </div>
          <button
            onClick={verificarConexao}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-blue bg-brand-blue/10 hover:bg-brand-blue/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            {statusConexao === 'verificando' ? <IconLoader2 size={13} className="animate-spin" /> : null}
            Verificar
          </button>
        </div>
      </div>

      {/* Exportações */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Exportar dados</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={exportarCSV}
            disabled={exportandoCSV || !canExport()}
            className="flex items-center gap-3 bg-dark-card border border-dark-border hover:border-brand-green/40 rounded-xl p-4 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green/20 transition-colors">
              {exportandoCSV ? <IconLoader2 size={20} className="animate-spin text-brand-green" /> : <IconDownload size={20} className="text-brand-green" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Exportar CSV</div>
              <div className="text-xs text-gray-500">Posição atual do estoque</div>
            </div>
          </button>

          <button
            onClick={exportarJSON}
            disabled={exportandoJSON || !canExport()}
            className="flex items-center gap-3 bg-dark-card border border-dark-border hover:border-brand-purple/40 rounded-xl p-4 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-purple/10 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
              {exportandoJSON ? <IconLoader2 size={20} className="animate-spin text-brand-purple" /> : <IconDownload size={20} className="text-brand-purple" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Exportar JSON</div>
              <div className="text-xs text-gray-500">Backup completo do sistema</div>
            </div>
          </button>
        </div>

        {!canExport() && (
          <p className="text-xs text-gray-500">Apenas administradores podem exportar dados completos.</p>
        )}
      </div>
    </div>
  )
}
