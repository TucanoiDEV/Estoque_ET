// Geração automática do código do produto a partir da categoria.
// Prefixo = 3 primeiras letras da PRIMEIRA palavra da categoria (sem acento,
// maiúsculas). Se tiver menos de 3 letras, completa com "X" (ex.: "Fd" -> "FDX").
// Categoria vazia -> "XXX".
export function prefixoCodigo(categoria: string): string {
  const primeira = (categoria ?? '').trim().split(/\s+/)[0] ?? ''
  const letras = primeira.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z]/g, '')
  return (letras.slice(0, 3).toUpperCase() + 'XXX').slice(0, 3)
}

// Próximo código sequencial para o prefixo da categoria (3 dígitos, ex.: TEC-001).
// O número é a ordem entre os produtos que já usam o mesmo prefixo.
export function proximoCodigo(categoria: string, codigosExistentes: string[]): string {
  const prefixo = prefixoCodigo(categoria)
  const re = new RegExp(`^${prefixo}-(\\d+)$`)
  let max = 0
  for (const c of codigosExistentes) {
    const m = re.exec((c ?? '').toUpperCase())
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `${prefixo}-${String(max + 1).padStart(3, '0')}`
}
