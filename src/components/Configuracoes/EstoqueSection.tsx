import { useState, useEffect } from 'react'
import { IconTrash, IconPlus, IconLoader2 } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import { useLista } from '../../hooks/useLista'
import { GerenciadorLista } from '../shared/GerenciadorLista'
import { CORES_PADRAO } from '../../utils/listasPadrao'

export function EstoqueSection() {
  const { mostrarToast } = useToast()
  const { canChangeSettings } = usePermissions()
  const cores = useLista('cores', CORES_PADRAO)
  const [estoqueMinimoPadrao, setEstoqueMinimoPadrao] = useState('10')
  const [categorias, setCategorias] = useState<string[]>([])
  const [novaCategoria, setNovaCategoria] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await db.configuracoes().select('chave, valor').in('chave', ['estoque_minimo_padrao', 'categorias'])
      if (data) {
        data.forEach((c: any) => {
          if (c.chave === 'estoque_minimo_padrao') setEstoqueMinimoPadrao(String(c.valor ?? '10'))
          if (c.chave === 'categorias') {
            try { setCategorias(JSON.parse(c.valor ?? '[]')) } catch { /* ignora */ }
          }
        })
      }
    }
    carregar()
  }, [])

  async function salvar() {
    setSalvando(true)
    const { error } = await db.configuracoes().upsert([
      { chave: 'estoque_minimo_padrao', valor: String(paraNumero(estoqueMinimoPadrao)) },
      { chave: 'categorias', valor: JSON.stringify(categorias) },
    ], { onConflict: 'chave' })
    if (error) {
      mostrarToast(`Erro ao salvar: ${error.message}`, 'erro')
    } else {
      mostrarToast('Configurações de estoque salvas!', 'sucesso')
    }
    setSalvando(false)
  }

  function adicionarCategoria() {
    const cat = novaCategoria.trim()
    if (!cat || categorias.includes(cat)) return
    setCategorias([...categorias, cat])
    setNovaCategoria('')
  }

  const leitura = !canChangeSettings()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white">Configurações de estoque</h3>
        <p className="text-xs text-gray-500 mt-0.5">Padrões aplicados a novos produtos</p>
      </div>

      <div className="max-w-xs">
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Estoque mínimo padrão</label>
        <input
          type="text"
          inputMode="numeric"
          value={estoqueMinimoPadrao}
          onChange={(e) => setEstoqueMinimoPadrao(sanitizarNumero(e.target.value))}
          disabled={leitura}
          className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-2">Categorias de produtos</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {categorias.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue text-xs font-semibold px-2.5 py-1 rounded-full">
              {cat}
              {!leitura && (
                <button onClick={() => setCategorias(categorias.filter((c) => c !== cat))} className="opacity-60 hover:opacity-100">
                  <IconTrash size={11} />
                </button>
              )}
            </div>
          ))}
          {categorias.length === 0 && <span className="text-xs text-gray-500">Nenhuma categoria cadastrada</span>}
        </div>

        {!leitura && (
          <div className="flex gap-2 max-w-sm">
            <input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && adicionarCategoria()}
              placeholder="Nova categoria..."
              className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-blue"
            />
            <button
              onClick={adicionarCategoria}
              className="flex items-center gap-1 bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <IconPlus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Cores disponíveis para os produtos */}
      <GerenciadorLista
        label="Cores de produtos"
        itens={cores.itens}
        onAdicionar={cores.adicionar}
        onRemover={cores.remover}
        placeholder="Nova cor (ex.: Laranja)"
        desabilitado={leitura}
        textoVazio="Nenhuma cor cadastrada"
        ajuda="Salvas automaticamente neste navegador. Excluir uma cor não altera produtos já cadastrados."
      />

      {!leitura && (
        <button
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
        >
          {salvando && <IconLoader2 size={14} className="animate-spin" />}
          Salvar
        </button>
      )}
    </div>
  )
}
