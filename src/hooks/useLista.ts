import { useState, useCallback } from 'react'

// Lista de opções editável persistida no localStorage (cores, unidades, locais...).
// Permite ao usuário adicionar novos itens que ficam salvos no navegador.
export function useLista(chave: string, padrao: string[]) {
  const armazenamento = `lista:${chave}`

  const [itens, setItens] = useState<string[]>(() => {
    try {
      const salvo = localStorage.getItem(armazenamento)
      if (salvo) {
        const parsed = JSON.parse(salvo)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      /* ignora JSON inválido */
    }
    return padrao
  })

  const adicionar = useCallback(
    (item: string) => {
      const valor = item.trim()
      if (!valor) return
      setItens((prev) => {
        if (prev.some((i) => i.toLowerCase() === valor.toLowerCase())) return prev
        const novo = [...prev, valor]
        localStorage.setItem(armazenamento, JSON.stringify(novo))
        return novo
      })
    },
    [armazenamento]
  )

  const remover = useCallback(
    (item: string) => {
      setItens((prev) => {
        const novo = prev.filter((i) => i !== item)
        localStorage.setItem(armazenamento, JSON.stringify(novo))
        return novo
      })
    },
    [armazenamento]
  )

  return { itens, adicionar, remover }
}
