import { useState, useEffect } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'

export function EmpresaSection() {
  const { mostrarToast } = useToast()
  const { canChangeSettings } = usePermissions()
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    empresa_nome: '',
    empresa_cnpj: '',
    empresa_moeda: 'BRL',
    empresa_fuso: 'America/Sao_Paulo',
  })

  useEffect(() => {
    async function carregar() {
      const { data } = await db.configuracoes().select('chave, valor')
      if (data) {
        const mapa: Record<string, string> = {}
        data.forEach((c: any) => { mapa[c.chave] = c.valor ?? '' })
        setForm((prev) => ({ ...prev, ...mapa }))
      }
    }
    carregar()
  }, [])

  async function salvar() {
    setSalvando(true)
    const entradas = Object.entries(form).map(([chave, valor]) => ({ chave, valor }))
    for (const { chave, valor } of entradas) {
      await db.configuracoes().upsert({ chave, valor }, { onConflict: 'chave' })
    }
    mostrarToast('Configurações da empresa salvas!', 'sucesso')
    setSalvando(false)
  }

  const leitura = !canChangeSettings()

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white">Dados da empresa</h3>
        <p className="text-xs text-gray-500 mt-0.5">Informações exibidas nos relatórios</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Nome da empresa</label>
          <input
            value={form.empresa_nome}
            onChange={(e) => setForm({ ...form, empresa_nome: e.target.value })}
            disabled={leitura}
            placeholder="Minha Empresa Ltda."
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">CNPJ</label>
          <input
            value={form.empresa_cnpj}
            onChange={(e) => setForm({ ...form, empresa_cnpj: e.target.value })}
            disabled={leitura}
            placeholder="00.000.000/0001-00"
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Moeda padrão</label>
          <select
            value={form.empresa_moeda}
            onChange={(e) => setForm({ ...form, empresa_moeda: e.target.value })}
            disabled={leitura}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="BRL">BRL — Real Brasileiro</option>
            <option value="USD">USD — Dólar Americano</option>
            <option value="EUR">EUR — Euro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Fuso horário</label>
          <select
            value={form.empresa_fuso}
            onChange={(e) => setForm({ ...form, empresa_fuso: e.target.value })}
            disabled={leitura}
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="America/Sao_Paulo">America/Sao_Paulo (UTC-3)</option>
            <option value="America/Manaus">America/Manaus (UTC-4)</option>
            <option value="America/Belem">America/Belem (UTC-3)</option>
            <option value="America/Fortaleza">America/Fortaleza (UTC-3)</option>
          </select>
        </div>
      </div>

      {!leitura && (
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {salvando && <IconLoader2 size={14} className="animate-spin" />}
          Salvar configurações
        </button>
      )}
    </div>
  )
}
