// Lógica de desconto com período de validade.

export interface ComDesconto {
  desconto?: number | null
  desconto_inicio?: string | null
  desconto_fim?: string | null
}

// Data de hoje no fuso LOCAL (YYYY-MM-DD), para comparar com datas DATE do banco.
export function dataHojeLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Desconto vigente hoje (0 se não houver ou se estiver fora do período).
export function descontoVigente(p: ComDesconto, hoje = dataHojeLocal()): number {
  const d = p.desconto ?? 0
  if (d <= 0) return 0
  const ini = (p.desconto_inicio ?? '').slice(0, 10)
  const fim = (p.desconto_fim ?? '').slice(0, 10)
  if (ini && hoje < ini) return 0
  if (fim && hoje > fim) return 0
  return d
}

// Preço final com o desconto vigente aplicado (nunca negativo).
export function precoComDesconto(custo: number | null | undefined, p: ComDesconto, hoje = dataHojeLocal()): number {
  const c = custo ?? 0
  const pct = descontoVigente(p, hoje)
  return Math.max(0, Math.round(c * (1 - pct / 100) * 100) / 100)
}
