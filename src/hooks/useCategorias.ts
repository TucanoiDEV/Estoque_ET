import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from '../services/supabase'

// Fonte única das categorias de produtos: a chave 'categorias' em configuracoes.
// Usada tanto nas Configurações quanto no cadastro de produto. Persiste na hora.
// Observação de RLS: gravar em configuracoes exige admin. Para operador, a lista
// é atualizada localmente (e a categoria persiste no produto ao salvá-lo).
export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  // Espelha o estado para evitar closures defasadas
  const ref = useRef<string[]>([])
  // Promessa do carregamento inicial — mutações esperam por ela antes de gravar
  const loadPromise = useRef<Promise<void> | null>(null)

  const aplicar = useCallback((lista: string[]) => {
    ref.current = lista
    setCategorias(lista)
  }, [])

  const persistir = useCallback(async (lista: string[]) => {
    const { error } = await db
      .configuracoes()
      .upsert({ chave: 'categorias', valor: JSON.stringify(lista) }, { onConflict: 'chave' })
    if (error) console.warn('[categorias] não persistido no banco:', error.message)
  }, [])

  const carregar = useCallback(async () => {
    const promessa = (async () => {
      const { data } = await db.configuracoes().select('valor').eq('chave', 'categorias').maybeSingle()
      let lista: string[] = []
      try {
        const parsed = data?.valor ? JSON.parse(data.valor) : []
        if (Array.isArray(parsed)) lista = parsed
      } catch {
        /* ignora JSON inválido */
      }
      aplicar([...new Set([...lista, ...ref.current])])
      setLoading(false)
    })()
    loadPromise.current = promessa
    return promessa
  }, [aplicar])

  useEffect(() => { carregar() }, [carregar])

  const adicionar = useCallback(
    async (categoria: string) => {
      await loadPromise.current // garante a lista carregada antes de mutar/gravar
      const valor = categoria.trim()
      if (!valor || ref.current.some((c) => c.toLowerCase() === valor.toLowerCase())) return
      const nova = [...ref.current, valor]
      aplicar(nova)
      await persistir(nova)
    },
    [aplicar, persistir]
  )

  const remover = useCallback(
    async (categoria: string) => {
      await loadPromise.current
      const nova = ref.current.filter((c) => c !== categoria)
      aplicar(nova)
      await persistir(nova)
    },
    [aplicar, persistir]
  )

  return { categorias, loading, adicionar, remover, recarregar: carregar }
}
