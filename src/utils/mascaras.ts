// Máscaras e validações de formulário (pt-BR) — usadas no módulo de fornecedores.
// As máscaras formatam progressivamente conforme o usuário digita; guarde o valor
// já mascarado no estado do formulário (texto).

// Remove tudo que não for dígito.
function apenasDigitos(raw: string): string {
  return raw.replace(/\D/g, '')
}

// CNPJ: 00.000.000/0000-00
export function mascaraCNPJ(raw: string): string {
  const d = apenasDigitos(raw).slice(0, 14)
  if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
  if (d.length > 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  if (d.length > 5) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length > 2) return `${d.slice(0, 2)}.${d.slice(2)}`
  return d
}

// Telefone: (00) 0000-0000 (fixo) ou (00) 00000-0000 (celular)
export function mascaraTelefone(raw: string): string {
  const d = apenasDigitos(raw).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

// CEP: 00000-000
export function mascaraCEP(raw: string): string {
  const d = apenasDigitos(raw).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

// Validação de e-mail (simples, suficiente para feedback de formulário)
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// CNPJ é considerado preenchido completo quando tem 14 dígitos
export function cnpjCompleto(cnpj: string): boolean {
  return apenasDigitos(cnpj).length === 14
}

// ─── Busca de endereço por CEP (ViaCEP) ───────────────────────────────────────

export interface EnderecoCEP {
  logradouro: string
  bairro: string
  cidade: string
  estado: string
}

// Consulta o ViaCEP. Retorna null se o CEP for inválido, não existir ou a
// requisição falhar (offline etc.) — o chamador trata o feedback ao usuário.
export async function buscarCEP(cep: string): Promise<EnderecoCEP | null> {
  const d = apenasDigitos(cep)
  if (d.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${d}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data?.erro) return null
    return {
      logradouro: data.logradouro ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      estado: data.uf ?? '',
    }
  } catch {
    return null
  }
}
