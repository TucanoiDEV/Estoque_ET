import { useState, useEffect } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { db } from '../../services/supabase'
import { useToast } from '../shared/Toast'
import { usePermissions } from '../../hooks/usePermissions'
import { sanitizarNumero, paraNumero } from '../../utils/numero'
import { useLista } from '../../hooks/useLista'
import { useCategorias } from '../../hooks/useCategorias'
import { GerenciadorLista } from '../shared/GerenciadorLista'
import { CORES_PADRAO } from '../../utils/listasPadrao'

export function EstoqueSection() {
  const { mostrarToast } = useToast()
  const { canChangeSettings } = usePermissions()
  const cores = useLista('cores', CORES_PADRAO)
  const categorias = useCategorias()
  const [estoqueMinimoPadrao, setEstoqueMinimoPadrao] = useState('10')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data } = await db
        .configuracoes()
        .select('valor')
        .eq('chave', 'estoque_minimo_padrao')
        .maybeSingle()
      if (data?.valor != null) setEstoqueMinimoPadrao(String(data.valor))
    }
    carregar()
  }, [])

  async function salvar() {
    setSalvando(true)
    const { error } = await db
      .configuracoes()
      .upsert({ chave: 'estoque_minimo_padrao', valor: String(paraNumero(estoqueMinimoPadrao)) }, { onConflict: 'chave' })
    if (error) {
      mostrarToast(`Erro ao salvar: ${error.message}`, 'erro')
    } else {
      mostrarToast('Configurações de estoque salvas!', 'sucesso')
    }
    setSalvando(false)
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

      {/* Categorias — mesma lista usada no cadastro de produto (salva no banco) */}
      <GerenciadorLista
        label="Categorias de produtos"
        itens={categorias.categorias}
        onAdicionar={categorias.adicionar}
        onRemover={categorias.remover}
        placeholder="Nova categoria..."
        desabilitado={leitura}
        textoVazio="Nenhuma categoria cadastrada"
        ajuda="Aparecem no dropdown do cadastro de produto. Salvas no banco para todos os usuários."
      />

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
