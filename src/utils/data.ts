import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Converte 'YYYY-MM-DD' (campo DATE do banco) para Date no fuso LOCAL.
// Evita o bug em que new Date('2026-06-01') é lido como meia-noite UTC e,
// em fusos negativos (ex.: Brasil UTC-3), exibe o dia anterior (31/05).
export function dataLocal(valor: string): Date {
  const [ano, mes, dia] = valor.slice(0, 10).split('-').map(Number)
  return new Date(ano, (mes || 1) - 1, dia || 1)
}

// Formata uma data 'YYYY-MM-DD' com segurança de fuso (padrão dd/MM/yyyy).
export function formatarData(valor: string, formato = 'dd/MM/yyyy'): string {
  return format(dataLocal(valor), formato, { locale: ptBR })
}
