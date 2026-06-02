// Normaliza texto para busca: remove acentos/diacríticos e ignora maiúsculas.
// Assim "alcool" encontra "Álcool", "cafe" encontra "Café", etc.
export function normalizarBusca(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
