// Utilitários para campos numéricos de formulário.
// Os inputs guardam o texto digitado (string) para evitar o bug do zero à
// esquerda que ocorre com <input type="number"> controlado por número.

// Sanitiza o texto digitado: remove caracteres inválidos e zeros à esquerda.
// Com `decimal`, aceita um separador decimal (ponto ou vírgula).
export function sanitizarNumero(raw: string, decimal = false): string {
  let s = raw.replace(decimal ? /[^\d.,]/g : /\D/g, '')
  if (decimal) {
    s = s.replace(/,/g, '.')
    const i = s.indexOf('.')
    if (i !== -1) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '')
  }
  const [inteira, ...dec] = s.split('.')
  const inteiraLimpa = inteira.replace(/^0+(?=\d)/, '') // remove zeros à esquerda
  return dec.length ? `${inteiraLimpa}.${dec.join('')}` : inteiraLimpa
}

// Converte o texto do campo para número (vazio ou inválido vira 0).
export function paraNumero(valor: string): number {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

// Formata um valor como moeda brasileira (R$ 1.234,56). null/undefined → R$ 0,00.
export function formatarMoeda(valor: number | null | undefined): string {
  return (valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
