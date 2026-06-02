// Nome e abreviação por unidade de medida — usados para rotular custo/quantidade
// conforme a unidade do produto (ex.: "Custo por metro" / R$/m).
export const UNIDADE_INFO: Record<string, { nome: string; abrev: string }> = {
  UN: { nome: 'unidade', abrev: 'un' },
  KG: { nome: 'quilograma', abrev: 'kg' },
  M: { nome: 'metro', abrev: 'm' },
  L: { nome: 'litro', abrev: 'L' },
  LT: { nome: 'litro', abrev: 'L' },
  CX: { nome: 'caixa', abrev: 'cx' },
  PC: { nome: 'pacote', abrev: 'pc' },
  PR: { nome: 'par', abrev: 'par' },
  T: { nome: 'tonelada', abrev: 't' },
}

export function infoUnidade(unidade: string | null | undefined): { nome: string; abrev: string } {
  const u = (unidade ?? '').trim()
  if (!u) return { nome: 'unidade', abrev: 'un' }
  return UNIDADE_INFO[u.toUpperCase()] ?? { nome: u.toLowerCase(), abrev: u.toLowerCase() }
}
