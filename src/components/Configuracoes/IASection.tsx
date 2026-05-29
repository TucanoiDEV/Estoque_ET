import { useState, useEffect } from 'react'
import { IconSparkles, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { consultarIA } from '../../services/claude'

export function IASection() {
  const { mostrarToast } = useToast()
  const { canConfigureIA } = usePermissions()
  const [apiKey, setApiKey] = useState('')
  const [mostrarKey, setMostrarKey] = useState(false)
  const [alertasIA, setAlertasIA] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [testando, setTestando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await db.configuracoes().select('chave, valor').in('chave', ['claude_api_key', 'alertas_ia'])
      if (data) {
        data.forEach((c: any) => {
          if (c.chave === 'claude_api_key') setApiKey(c.valor ?? '')
          if (c.chave === 'alertas_ia') setAlertasIA(c.valor === 'true')
        })
      }
    }
    carregar()
  }, [])

  async function salvar() {
    setSalvando(true)
    await db.configuracoes().upsert({ chave: 'claude_api_key', valor: apiKey }, { onConflict: 'chave' })
    await db.configuracoes().upsert({ chave: 'alertas_ia', valor: String(alertasIA) }, { onConflict: 'chave' })
    mostrarToast('Configurações da IA salvas!', 'sucesso')
    setSalvando(false)
  }

  async function testarConexao() {
    if (!apiKey) {
      mostrarToast('Informe a API Key antes de testar.', 'aviso')
      return
    }
    setTestando(true)
    const resultado = await consultarIA('Responda apenas: "Conexão bem-sucedida!"', apiKey)
    if (resultado.sucesso) {
      mostrarToast('Conexão com Claude testada com sucesso!', 'sucesso')
    } else {
      mostrarToast(`Falha no teste: ${resultado.erro}`, 'erro')
    }
    setTestando(false)
  }

  if (!canConfigureIA()) {
    return (
      <div className="py-12 text-center text-gray-500 text-sm">
        Apenas administradores podem configurar o Assistente IA.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <IconSparkles size={20} className="text-brand-purple" />
        <div>
          <h3 className="text-base font-semibold text-white">Assistente IA (Claude)</h3>
          <p className="text-xs text-gray-500">Integração com a API da Anthropic</p>
        </div>
      </div>

      <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-4 text-xs text-gray-400">
        Obtenha sua API Key em{' '}
        <span className="text-brand-purple font-semibold">console.anthropic.com</span>. A chave é armazenada no banco de dados e usada apenas para análises de estoque.
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">API Key do Claude</label>
        <div className="relative">
          <input
            type={mostrarKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 pr-10 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-purple font-mono"
          />
          <button
            onClick={() => setMostrarKey(!mostrarKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {mostrarKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-y border-dark-border">
        <div>
          <div className="text-sm font-medium text-white">Alertas inteligentes</div>
          <div className="text-xs text-gray-500">IA analisa o estoque e sugere ações de reposição</div>
        </div>
        <button
          onClick={() => setAlertasIA(!alertasIA)}
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${alertasIA ? 'bg-brand-purple' : 'bg-dark-border'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${alertasIA ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={testarConexao}
          disabled={testando}
          className="flex items-center gap-2 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-purple text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {testando && <IconLoader2 size={14} className="animate-spin" />}
          {testando ? 'Testando...' : 'Testar conexão'}
        </button>
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {salvando && <IconLoader2 size={14} className="animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  )
}
