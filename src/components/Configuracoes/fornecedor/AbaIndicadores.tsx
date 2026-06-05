import { useState, useEffect } from 'react'
import {
  IconChartBar, IconCash, IconShoppingCart, IconReceipt2, IconCalendar, IconTruck, IconClockHour4,
} from '@tabler/icons-react'
import { db } from '../../../services/supabase'
import { formatarMoeda } from '../../../utils/numero'
import { formatarData } from '../../../utils/data'
import type { IndicadoresFornecedor } from '../../../types'

interface EntradaCompra {
  total: number | null
  custo_unitario: number | null
  quantidade: number
  data_recebimento: string
}

interface Props {
  fornecedorId: string | null
  prazoInformado: number | null
}

function calcular(entradas: EntradaCompra[], prazoInformado: number | null): IndicadoresFornecedor {
  const numeroCompras = entradas.length
  const totalComprado = entradas.reduce((acc, e) => acc + (e.total ?? (e.custo_unitario ?? 0) * e.quantidade), 0)
  const ultimaCompra = entradas.reduce<string | null>((max, e) => (!max || e.data_recebimento > max ? e.data_recebimento : max), null)
  return {
    totalComprado,
    numeroCompras,
    ticketMedio: numeroCompras ? totalComprado / numeroCompras : 0,
    ultimaCompra,
    prazoEntregaInformado: prazoInformado,
  }
}

interface CardProps {
  icone: typeof IconCash
  titulo: string
  valor: string
  cor: string
  nota?: string
}

function Card({ icone: Icone, titulo, valor, cor, nota }: CardProps) {
  return (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cor}`}>
          <Icone size={16} />
        </div>
        <span className="text-xs font-medium text-gray-400">{titulo}</span>
      </div>
      <p className="text-xl font-bold text-white">{valor}</p>
      {nota && <p className="text-xs text-gray-600">{nota}</p>}
    </div>
  )
}

export function AbaIndicadores({ fornecedorId, prazoInformado }: Props) {
  const [ind, setInd] = useState<IndicadoresFornecedor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar(id: string) {
      setLoading(true)
      const { data } = await db.entradas()
        .select('total, custo_unitario, quantidade, data_recebimento')
        .eq('fornecedor_id', id)
      setInd(calcular((data as EntradaCompra[]) ?? [], prazoInformado))
      setLoading(false)
    }
    if (fornecedorId) carregar(fornecedorId)
    else setLoading(false)
  }, [fornecedorId, prazoInformado])

  if (!fornecedorId) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-gray-500 text-center">
        <IconChartBar size={32} className="text-gray-600" />
        <p className="text-sm max-w-xs">Salve o cadastro do fornecedor para ver os indicadores de compras.</p>
      </div>
    )
  }

  if (loading || !ind) {
    return (
      <div className="grid grid-cols-2 gap-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-dark-hover rounded-xl" />)}
      </div>
    )
  }

  if (ind.numeroCompras === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-gray-500 text-center">
        <IconChartBar size={32} className="text-gray-600" />
        <p className="text-sm max-w-xs">Ainda não há compras registradas para este fornecedor. Os indicadores aparecem após a primeira entrada.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card icone={IconCash} cor="bg-brand-green/15 text-brand-green" titulo="Total comprado" valor={formatarMoeda(ind.totalComprado)} />
        <Card icone={IconShoppingCart} cor="bg-brand-blue/15 text-brand-blue" titulo="Número de compras" valor={String(ind.numeroCompras)} />
        <Card icone={IconReceipt2} cor="bg-brand-purple/15 text-brand-purple" titulo="Ticket médio" valor={formatarMoeda(ind.ticketMedio)} />
        <Card icone={IconCalendar} cor="bg-brand-yellow/15 text-brand-yellow" titulo="Última compra" valor={ind.ultimaCompra ? formatarData(ind.ultimaCompra) : '—'} />
        <Card icone={IconTruck} cor="bg-brand-blue/15 text-brand-blue" titulo="Prazo de entrega informado" valor={ind.prazoEntregaInformado != null ? `${ind.prazoEntregaInformado} dias` : '—'} nota="Cadastrado na aba Comercial" />
        <Card icone={IconClockHour4} cor="bg-gray-500/15 text-gray-400" titulo="Cumprimento de prazo" valor="—" nota="Requer registrar data prevista x recebida nas entradas" />
      </div>
    </div>
  )
}
