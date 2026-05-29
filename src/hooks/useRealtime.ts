import { useEffect, useState, useRef } from 'react'
import { supabase } from '../services/supabase'

interface UseRealtimeOptions {
  onEstoqueChange: () => void
  onEntradasChange: () => void
}

// Hook que gerencia as subscriptions de tempo real do Supabase
export function useRealtime({ onEstoqueChange, onEntradasChange }: UseRealtimeOptions) {
  const [sincronizando, setSincronizando] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mostra o indicador de sync brevemente a cada atualização
  function acionarSync() {
    setSincronizando(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setSincronizando(false), 1500)
  }

  useEffect(() => {
    const canal = supabase
      .channel('estoque-sync-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'estoque' },
        () => {
          acionarSync()
          onEstoqueChange()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'entradas' },
        () => {
          acionarSync()
          onEntradasChange()
        }
      )
      .subscribe()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      supabase.removeChannel(canal)
    }
  }, [onEstoqueChange, onEntradasChange])

  return { sincronizando }
}
