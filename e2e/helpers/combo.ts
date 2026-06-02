import { Page } from '@playwright/test'

// Abre um ComboBox pelo texto atual do gatilho (placeholder, valor ou "Sem X"),
// busca e clica numa opção existente.
export async function escolherNoCombo(
  page: Page,
  gatilho: string | RegExp,
  busca: string,
  opcao: string | RegExp,
) {
  await page.getByRole('button', { name: gatilho }).first().click()
  await page.getByTestId('combobox-busca').fill(busca)
  await page.getByTestId('combobox-lista').getByRole('button', { name: opcao }).click()
}

// Abre um ComboBox, digita um texto novo e clica em "Adicionar "texto"".
export async function adicionarNoCombo(page: Page, gatilho: string | RegExp, texto: string) {
  await page.getByRole('button', { name: gatilho }).first().click()
  await page.getByTestId('combobox-busca').fill(texto)
  await page.getByTestId('combobox-lista').getByRole('button', { name: `Adicionar "${texto}"` }).click()
}
