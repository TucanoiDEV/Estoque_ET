import { useState, useEffect, useCallback } from 'react'
import { IconRefresh, IconCheck, IconX, IconTerminal2 } from '@tabler/icons-react'
import { db, supabaseConfigurado } from '../../services/supabase'
import { useAuth } from '../../hooks/useAuth'

// Área exclusiva do cargo "developer" (acima do admin): diagnósticos do
// ambiente, do banco e das migrações opcionais. Útil para os devs do projeto
// verificarem rapidamente o estado da instância sem abrir o painel do Supabase.

interface Checagem {
  label: string
  ok: boolean
  detalhe?: string
}

interface Contagem {
  label: string
  valor: number | null
}

export function DesenvolvedorSection() {
  const { usuario } = useAuth()
  const [checagens, setChecagens] = useState<Checagem[]>([])
  const [contagens, setContagens] = useState<Contagem[]>([])
  const [carregando, setCarregando] = useState(false)
  const [rodadoEm, setRodadoEm] = useState<Date | null>(null)

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const modo = import.meta.env.MODE

  const rodarDiagnostico = useCallback(async () => {
    setCarregando(true)

    // Detecção de features opcionais (migrações que podem não ter sido rodadas)
    const semErro = async (q: PromiseLike<{ error: unknown }>) => !(await q).error

    const tabelaSaidas = await semErro(db.saidas().select('id', { head: true, count: 'exact' }))
    const colDesconto = await semErro(db.produtos().select('desconto').limit(1))
    const colDescontoDatas = await semErro(db.produtos().select('desconto_inicio, desconto_fim').limit(1))

    setChecagens([
      { label: 'Conexão com o Supabase', ok: supabaseConfigurado, detalhe: supabaseConfigurado ? 'configurado' : 'sem .env' },
      { label: 'Tabela saidas', ok: tabelaSaidas, detalhe: tabelaSaidas ? undefined : 'rode supabase/saidas.sql' },
      { label: 'Coluna produtos.desconto', ok: colDesconto, detalhe: colDesconto ? undefined : 'rode supabase/desconto.sql' },
      { label: 'Colunas de vigência do desconto', ok: colDescontoDatas, detalhe: colDescontoDatas ? undefined : 'rode supabase/desconto.sql' },
    ])

    // Contagens de registros
    const conta = async (q: PromiseLike<{ count: number | null; error: unknown }>) => {
      const { count, error } = await q
      return error ? null : count ?? 0
    }
    const [produtos, fornecedores, entradas, saidas, usuarios] = await Promise.all([
      conta(db.produtos().select('*', { head: true, count: 'exact' })),
      conta(db.fornecedores().select('*', { head: true, count: 'exact' })),
      conta(db.entradas().select('*', { head: true, count: 'exact' })),
      conta(db.saidas().select('*', { head: true, count: 'exact' })),
      conta(db.usuarios().select('*', { head: true, count: 'exact' })),
    ])
    setContagens([
      { label: 'Produtos', valor: produtos },
      { label: 'Fornecedores', valor: fornecedores },
      { label: 'Entradas', valor: entradas },
      { label: 'Saídas', valor: saidas },
      { label: 'Usuários', valor: usuarios },
    ])

    setRodadoEm(new Date())
    setCarregando(false)
  }, [supabaseConfigurado])

  useEffect(() => { rodarDiagnostico() }, [rodarDiagnostico])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconTerminal2 size={20} className="text-brand-green" />
          <div>
            <h2 className="text-base font-bold text-white">Desenvolvedor</h2>
            <p className="text-xs text-gray-500 mt-0.5">Diagnóstico do ambiente — visível apenas para o cargo developer</p>
          </div>
        </div>
        <button
          onClick={rodarDiagnostico}
          disabled={carregando}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-dark-hover text-gray-300 hover:text-white border border-dark-border disabled:opacity-50"
        >
          <IconRefresh size={15} className={carregando ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Ambiente */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ambiente</h3>
        <dl className="space-y-2 text-sm">
          <Linha termo="Supabase URL" valor={supabaseUrl ?? '—'} mono />
          <Linha termo="Modo de build" valor={modo} mono />
          <Linha termo="Sessão" valor={usuario?.email ?? '—'} mono />
          <Linha termo="Cargo" valor={usuario?.cargo ?? '—'} mono />
          <Linha termo="ID do usuário" valor={usuario?.id ?? '—'} mono />
        </dl>
      </div>

      {/* Diagnóstico de migrações */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Migrações & banco</h3>
        <ul className="space-y-2">
          {checagens.map((c) => (
            <li key={c.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-gray-300">
                {c.ok
                  ? <IconCheck size={16} className="text-brand-green shrink-0" />
                  : <IconX size={16} className="text-brand-red shrink-0" />}
                {c.label}
              </span>
              {c.detalhe && <span className="text-xs text-gray-500 font-mono shrink-0">{c.detalhe}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Contagens */}
      <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Registros</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {contagens.map((c) => (
            <div key={c.label} className="bg-dark-card border border-dark-border rounded-lg px-3 py-2.5 text-center">
              <p className="text-xl font-bold text-white">{c.valor === null ? '—' : c.valor.toLocaleString('pt-BR')}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {rodadoEm && (
        <p className="text-[11px] text-gray-600">
          Último diagnóstico: {rodadoEm.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </div>
  )
}

function Linha({ termo, valor, mono }: { termo: string; valor: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500 shrink-0">{termo}</dt>
      <dd className={`text-gray-300 truncate text-right ${mono ? 'font-mono text-xs' : ''}`}>{valor}</dd>
    </div>
  )
}
